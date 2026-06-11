# Supabase auth email templates

## Confirm signup

In Supabase Dashboard:

1. Open **Authentication -> Email Templates -> Confirm signup**.
2. Set the subject to `Подтвердите email — SPORTOSFERA`.
3. Paste the contents of `supabase-confirm-signup.html`.
4. Save the template.

The template uses Supabase variables `{{ .ConfirmationURL }}` and `{{ .Email }}`.
