-- Server-side order request submission support.
-- Run once in Supabase SQL Editor before deploying the matching API endpoint.

ALTER TABLE public.order_requests
  ADD COLUMN IF NOT EXISTS client_id uuid;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_requests_client_id_fkey'
      AND conrelid = 'public.order_requests'::regclass
  ) THEN
    ALTER TABLE public.order_requests
      ADD CONSTRAINT order_requests_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_auth_user_id_fkey'
      AND conrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_unique_idx
  ON public.clients (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

UPDATE public.clients AS client
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE client.auth_user_id IS NULL
  AND lower(btrim(client.email)) = lower(btrim(auth_user.email));

CREATE INDEX IF NOT EXISTS order_requests_client_id_idx
  ON public.order_requests (client_id);

CREATE TABLE IF NOT EXISTS public.order_request_rate_limits (
  key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_request_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_order_request_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.order_request_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.order_request_rate_limits (key_hash, request_count)
  VALUES (p_key_hash, 0)
  ON CONFLICT (key_hash) DO NOTHING;

  SELECT * INTO current_row
  FROM public.order_request_rate_limits
  WHERE key_hash = p_key_hash
  FOR UPDATE;

  IF current_row.window_started_at <= now() - make_interval(secs => p_window_seconds) THEN
    UPDATE public.order_request_rate_limits
    SET window_started_at = now(), request_count = 1, updated_at = now()
    WHERE key_hash = p_key_hash;
    RETURN true;
  END IF;

  IF current_row.request_count >= p_limit THEN
    RETURN false;
  END IF;

  UPDATE public.order_request_rate_limits
  SET request_count = request_count + 1, updated_at = now()
  WHERE key_hash = p_key_hash;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_order_request_client(
  p_order_id uuid,
  p_name text,
  p_company text,
  p_email text,
  p_phone text,
  p_address text,
  p_client_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(btrim(coalesce(p_email, '')));
  normalized_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  email_client_id uuid;
  phone_client_id uuid;
  matched_client_id uuid;
BEGIN
  IF normalized_email <> '' THEN
    SELECT id INTO email_client_id
    FROM public.clients
    WHERE lower(btrim(email)) = normalized_email
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF normalized_phone <> '' THEN
    SELECT id INTO phone_client_id
    FROM public.clients
    WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = normalized_phone
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- Conflicting identifiers are not merged automatically. The request remains
  -- saved with its contact snapshot for an administrator to review.
  IF email_client_id IS NOT NULL
     AND phone_client_id IS NOT NULL
     AND email_client_id <> phone_client_id THEN
    RETURN NULL;
  END IF;

  -- A phone alone can be shared by a family or an organisation. If it points
  -- to a contact whose email does not match, leave the request unlinked.
  IF email_client_id IS NULL AND phone_client_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  matched_client_id := coalesce(email_client_id, phone_client_id);

  IF matched_client_id IS NULL THEN
    BEGIN
      INSERT INTO public.clients (
        name, company, email, phone, address, client_type
      ) VALUES (
        btrim(p_name),
        nullif(btrim(coalesce(p_company, '')), ''),
        normalized_email,
        nullif(btrim(coalesce(p_phone, '')), ''),
        nullif(btrim(coalesce(p_address, '')), ''),
        CASE WHEN p_client_type = 'individual' THEN 'individual' ELSE 'company' END
      )
      RETURNING id INTO matched_client_id;
    EXCEPTION WHEN unique_violation THEN
      -- A concurrent request may have created the contact. Resolve it again
      -- without merging two different existing contacts.
      SELECT id INTO email_client_id
      FROM public.clients
      WHERE lower(btrim(email)) = normalized_email
      LIMIT 1;

      IF normalized_phone <> '' THEN
        SELECT id INTO phone_client_id
        FROM public.clients
        WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') = normalized_phone
        LIMIT 1;
      END IF;

      IF email_client_id IS NOT NULL
         AND phone_client_id IS NOT NULL
         AND email_client_id <> phone_client_id THEN
        RETURN NULL;
      END IF;

      IF email_client_id IS NULL AND phone_client_id IS NOT NULL THEN
        RETURN NULL;
      END IF;

      matched_client_id := coalesce(email_client_id, phone_client_id);
    END;
  ELSE
    -- A public request may fill empty CRM fields, but never overwrite existing
    -- profile data belonging to a known client.
    UPDATE public.clients
    SET
      name = CASE WHEN nullif(btrim(name), '') IS NULL THEN btrim(p_name) ELSE name END,
      company = CASE WHEN nullif(btrim(coalesce(company, '')), '') IS NULL THEN nullif(btrim(coalesce(p_company, '')), '') ELSE company END,
      phone = CASE WHEN nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '') IS NULL THEN nullif(btrim(coalesce(p_phone, '')), '') ELSE phone END,
      address = CASE WHEN nullif(btrim(coalesce(address, '')), '') IS NULL THEN nullif(btrim(coalesce(p_address, '')), '') ELSE address END
    WHERE id = matched_client_id;
  END IF;

  IF matched_client_id IS NOT NULL THEN
    UPDATE public.order_requests
    SET client_id = matched_client_id
    WHERE id = p_order_id;
  END IF;

  RETURN matched_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_sporto_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(btrim(coalesce(new.email, '')));
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  linked_client_id uuid;
  submitted_phone text := nullif(btrim(coalesce(metadata ->> 'phone', '')), '');
BEGIN
  IF normalized_email = '' THEN
    RETURN new;
  END IF;

  UPDATE public.clients
  SET
    auth_user_id = new.id,
    name = CASE WHEN nullif(btrim(name), '') IS NULL THEN coalesce(nullif(btrim(metadata ->> 'name'), ''), normalized_email) ELSE name END,
    company = CASE WHEN nullif(btrim(coalesce(company, '')), '') IS NULL THEN nullif(btrim(metadata ->> 'company'), '') ELSE company END,
    client_type = CASE WHEN metadata ->> 'client_type' = 'individual' THEN 'individual' ELSE coalesce(client_type, 'company') END
  WHERE lower(btrim(email)) = normalized_email
    AND (auth_user_id IS NULL OR auth_user_id = new.id)
  RETURNING id INTO linked_client_id;

  IF linked_client_id IS NOT NULL THEN
    RETURN new;
  END IF;

  BEGIN
    INSERT INTO public.clients (
      auth_user_id, name, company, email, phone, client_type
    ) VALUES (
      new.id,
      coalesce(nullif(btrim(metadata ->> 'name'), ''), normalized_email),
      nullif(btrim(metadata ->> 'company'), ''),
      normalized_email,
      submitted_phone,
      CASE WHEN metadata ->> 'client_type' = 'individual' THEN 'individual' ELSE 'company' END
    );
  EXCEPTION WHEN unique_violation THEN
    -- A phone may already belong to another CRM contact. The account is still
    -- created, but the ambiguous phone is not copied into the new contact.
    INSERT INTO public.clients (
      auth_user_id, name, company, email, phone, client_type
    ) VALUES (
      new.id,
      coalesce(nullif(btrim(metadata ->> 'name'), ''), normalized_email),
      nullif(btrim(metadata ->> 'company'), ''),
      normalized_email,
      NULL,
      CASE WHEN metadata ->> 'client_type' = 'individual' THEN 'individual' ELSE 'company' END
    )
    ON CONFLICT (email) DO UPDATE
      SET auth_user_id = EXCLUDED.auth_user_id
      WHERE public.clients.auth_user_id IS NULL OR public.clients.auth_user_id = EXCLUDED.auth_user_id;
  END;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_sporto_auth_user_created ON auth.users;
CREATE TRIGGER on_sporto_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_sporto_auth_user();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('clients', 'order_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, policy_row.tablename);
  END LOOP;
END $$;

-- The admin email must match VITE_ADMIN_LOGIN_EMAIL used by the application.
CREATE POLICY "Sporto admin manages clients"
  ON public.clients FOR ALL TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com');

CREATE POLICY "Clients read own profile"
  ON public.clients FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Clients update own profile"
  ON public.clients FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Clients insert own profile"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid()
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Sporto admin manages order requests"
  ON public.order_requests FOR ALL TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com');

REVOKE ALL ON TABLE public.order_request_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_order_request_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_order_request_client(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_sporto_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_order_request_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_order_request_client(uuid, text, text, text, text, text, text) TO service_role;
