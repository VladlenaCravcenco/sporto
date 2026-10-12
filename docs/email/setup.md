# Order emails

OrderRequest uses one form, no registration/login, with required name, Moldovan phone and email. Company name is required for companies. The API first saves the contact snapshot and cart to `order_requests`, then links an existing CRM contact through the existing RPC and sends customer/admin notifications server-side.

## Server configuration

In `/var/www/sporto/.env.local` configure (never expose the private key with a VITE_ or NEXT_PUBLIC_ prefix):

```
EMAILJS_SERVICE_ID=...
EMAILJS_PUBLIC_KEY=...
EMAILJS_PRIVATE_KEY=...
EMAILJS_TEMPLATE_ORDER_CONFIRMATION=...
EMAILJS_TEMPLATE_ADMIN=...
ORDER_ADMIN_EMAIL=...
```

Existing VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_TEMPLATE_ADMIN and VITE_ADMIN_EMAIL are supported as fallbacks. Customer confirmation requires its own template. Copy `order-confirmation.txt` into the EmailJS template editor, set recipient to `{{to_email}}`; use escaped variables if using HTML. Use the same listed fields in the admin template. Enable server/non-browser requests in EmailJS account settings if required by the account. Reference: https://www.emailjs.com/docs/rest-api/send/

Restart/deploy after configuring. Test one real request with a mailbox you control: verify the saved record in `/admin/requests`, all product quantities/SKUs, company, address and notes, customer email, and admin email. Existing admin session and RLS are required; this change does not change admin login permissions. The page displays latest 30 records with pagination and linked-client history.

A provider acceptance is not a guarantee of inbox delivery. Missing configuration or send failure is returned explicitly; the saved request is never discarded and the customer is told not to resubmit. Transport errors log the order ID and status without credentials. There is no durable automatic email retry queue yet. EmailJS sending is serialized in a single server process; multiple replicas require a shared queue.

No production email or database writes were performed during local tests.
