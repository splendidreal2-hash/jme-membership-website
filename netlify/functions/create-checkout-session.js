// JME Records -> Noctra hosted checkout
// Required Netlify environment variables:
//   NOCTRA_SECRET_KEY       Noctra merchant API secret (never expose to browser)
//   NOCTRA_SETTLEMENT_ASSET  e.g. USDT_ERC20 (must match your approved dashboard setting)
//   SITE_URL                Public site origin, e.g. https://membershipcardstore.netlify.app
//
// This function creates a hosted charge only. A browser redirect is NOT proof of payment.
// Membership fulfilment must be added only after verified webhook events are durably recorded.

const crypto = require('crypto');

const PACKAGES = Object.freeze({
  'Membership 1': { amount: 399.99, title: 'JME Membership 1' },
  'Membership 2': { amount: 849.89, title: 'JME Membership 2' },
  'VIP Membership 3': { amount: 1200.00, title: 'JME VIP Membership 3' }
});

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed.' }) };
  }

  const secret = process.env.NOCTRA_SECRET_KEY;
  const settlementAsset = process.env.NOCTRA_SETTLEMENT_ASSET || 'USDT_ERC20';
  const siteUrl = (process.env.SITE_URL || process.env.URL || '').replace(/\/+$/, '');

  if (!secret || !siteUrl) {
    return {
      statusCode: 503, headers,
      body: JSON.stringify({ message: 'Secure checkout is not configured yet. No payment has been taken.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (_) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid checkout request.' }) };
  }

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : '';
  const selected = PACKAGES[body.packageId];

  if (!customerName || customerName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      customerEmail.length > 254 || !selected) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ message: 'Please provide a valid name, email address, and membership package.' })
    };
  }

  // Random opaque reference; do not put customer PII in the provider reference.
  const customerRef = `JME-${crypto.randomUUID()}`;
  const webhookUrl = `${siteUrl}/.netlify/functions/noctra-webhook`;

  try {
    const response = await fetch('https://api.noctra.is/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: selected.amount,
        currency: 'USD',
        settlement_asset: settlementAsset,
        customer_ref: customerRef,
        title: selected.title,
        description: `JME Records membership purchase: ${selected.title}`,
        webhook_url: webhookUrl
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = result && result.error && result.error.code;
      if (response.status === 403 || code === 'account_unactivated') {
        return {
          statusCode: 503, headers,
          body: JSON.stringify({ message: 'Noctra has not enabled live processing for this merchant account. No payment has been taken.' })
        };
      }
      console.error('Noctra charge creation failed:', response.status, code || 'provider_error');
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ message: 'The payment provider could not create checkout. No payment has been taken.' })
      };
    }

    // Only redirect to the expected Noctra hosted checkout origin.
    let checkout;
    try { checkout = new URL(result.checkout_url); } catch (_) {}
    if (!checkout || checkout.protocol !== 'https:' || checkout.hostname !== 'app.noctra.is') {
      console.error('Noctra returned an unexpected checkout URL.');
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ message: 'The payment provider returned an invalid checkout link. No payment has been taken.' })
      };
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ checkoutUrl: checkout.href, customerRef })
    };
  } catch (error) {
    console.error('Noctra API request failed:', error && error.message ? error.message : 'unknown error');
    return {
      statusCode: 502, headers,
      body: JSON.stringify({ message: 'Could not reach the payment provider. No payment has been taken.' })
    };
  }
};
