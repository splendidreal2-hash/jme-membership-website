JME MEMBERSHIP WEBSITE - CHECKOUT-READY STARTER

WHAT WAS UPDATED
- Preserved the original membership page layout, branding, logo, card images, and management page.
- Changed all three membership calls to action to JOIN & PAY.
- Added a checkout information step that collects only the member's name and email.
- Added a Netlify Function endpoint at netlify/functions/create-checkout-session.js.
- The endpoint validates the selected package and uses server-side prices. It is deliberately disabled until a real payment provider is approved and connected.
- The browser redirects only if the backend later returns an HTTPS hosted-checkout URL.

MEMBERSHIP PRICES (USD)
- Membership 1: $399.99 (39999 cents)
- Membership 2: $849.89 (84989 cents)
- VIP Membership 3: $1,200.00 (120000 cents)

IMPORTANT - PAYMENT STATUS
This package does NOT currently accept card payments. It does not store card details, create fake payment confirmations, or activate memberships after an unverified request. Customers will see a clear message that checkout is not active yet.

TO ACTIVATE REAL PAYMENTS
1. Choose a payment provider that accepts your business and customer locations and supports Visa/Mastercard hosted checkout.
2. Complete the provider's merchant onboarding and any business/KYC checks it requires.
3. Confirm the provider's settlement and withdrawal options. Do not assume card payments automatically settle as USDT ERC20; confirm network, token, fees, limits, and payout availability with the provider.
4. Implement that provider's official hosted-checkout API in create-checkout-session.js. Keep all secret keys in Netlify environment variables, never in public JavaScript or HTML.
5. Configure the provider's signed webhook and verify its signature before marking an order paid or activating a membership. A browser redirect alone is not proof of payment.
6. Test successful, failed, cancelled, duplicate, and refunded payments in the provider's test environment before enabling live mode.

NETLIFY DEPLOYMENT
- Publish the contents of the jme_membership_site folder (not the parent folder) to Netlify.
- Netlify automatically detects functions in netlify/functions when the site is deployed with this folder structure.
- The static site can be previewed locally, but the serverless checkout endpoint requires a compatible Netlify deployment or Netlify Dev.

CONTACT DETAILS
- Phone/WhatsApp: +1 847-685-9394
- Email: jmeentertainmentrecords@gmail.com
- Telegram: https://t.me/jme_records
- Manager: Alex Huz
- Artist: Bam Tharudeone

SECURITY
- Never ask customers to send card numbers, CVV, PINs, banking passwords, or wallet seed phrases.
- Never put payment API secrets or private wallet keys in website files.
- management.html remains a contact/management landing page, not a secure authenticated admin dashboard.


NOCTRA API INTEGRATION (PREPARED, NOT YET LIVE)
The checkout function now calls the documented Noctra endpoint:
  POST https://api.noctra.is/v1/charges
It requests a hosted checkout URL and redirects customers only to HTTPS app.noctra.is.
The webhook function is:
  /.netlify/functions/noctra-webhook

SET THESE NETLIFY ENVIRONMENT VARIABLES
- NOCTRA_SECRET_KEY: merchant API secret from your Noctra dashboard. Keep it server-side.
- NOCTRA_WEBHOOK_SECRET: webhook signing secret from your Noctra dashboard.
- NOCTRA_SETTLEMENT_ASSET: USDT_ERC20 (only if this is actually configured and supported in your account).
- SITE_URL: https://membershipcardstore.netlify.app (or your actual deployed site origin).

WEBHOOK URL TO ENTER IN NOCTRA
  https://membershipcardstore.netlify.app/.netlify/functions/noctra-webhook
This URL will not receive events until the updated site is deployed and the Netlify function is live.

IMPORTANT FULFILMENT LIMITATION
The webhook currently verifies Noctra's documented HMAC-SHA256 signature and acknowledges authentic events, but it does not save orders or activate memberships. A durable order database, customer/order matching, duplicate-event protection, and a tested fulfilment workflow must be added before automatically granting membership. The website does not treat a redirect as proof of payment.

NOCTRA DOCUMENTATION NOTE
The integration follows the API details published at https://noctra.is/developers. Those are provider-published claims and have not been independently verified. Confirm the provider, acquiring relationship, live account status, fees, refunds/disputes, and USDT ERC20 settlement directly before taking customer payments.
