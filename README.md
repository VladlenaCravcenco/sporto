
  # B2B Wholesale eCommerce

  This is a code bundle for B2B Wholesale eCommerce. The original project is available at https://www.figma.com/design/oenCUCJ3zNApkytWchZxUn/B2B-Wholesale-eCommerce.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Secure order request setup

  1. Run `src/database/add_secure_order_request_submission.sql` in the Supabase SQL Editor.
  2. Add `SUPABASE_SERVICE_ROLE_KEY` to the Vercel project environment variables.
  3. Deploy the application and submit one test request from `/order-request`.

  `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a `VITE_` prefix or commit it to the repository.
