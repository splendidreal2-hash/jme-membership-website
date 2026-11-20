// JME Records Noctra webhook signature verifier.
// Required Netlify environment variable: NOCTRA_WEBHOOK_SECRET
//
// IMPORTANT: This endpoint verifies and acknowledges authentic events, but it does NOT
// persist orders or activate memberships. Add a durable order database and idempotent
// fulfilment workflow before treating a webhook as a membership activation.

const crypto = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  const secret = process.env.NOCTRA_WEBHOOK_SECRET;
  if (!secret) {
    console.error('NOCTRA_WEBHOOK_SECRET is not configured.');
    return { statusCode: 503, headers, body: 'Webhook is not configured' };
  }

  const signatureHeader = event.headers && (
    event.headers['x-noctra-signature'] || event.headers['X-Noctra-Signature']
  );
  const signature = typeof signatureHeader === 'string'
    ? signatureHeader.replace(/^sha256=/i, '').trim()
    : '';

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return { statusCode: 401, headers, body: 'Invalid signature' };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : Buffer.from(event.body || '', 'utf8');

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return { statusCode: 401, headers, body: 'Signature verification failed' };
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); }
  catch (_) { return { statusCode: 400, headers, body: 'Invalid JSON' }; }

  if (payload.event === 'charge.settled' &&
      payload.data &&
      payload.data.status === 'settled' &&
      typeof payload.data.customer_ref === 'string') {
    // Safe to record as a verified event in server logs for now.
    // Do not activate membership until customer_ref is matched to a persisted pending order
    // and duplicate deliveries are handled idempotently.
    console.log('Verified Noctra charge.settled event:', JSON.stringify({
      chargeId: payload.id,
      customerRef: payload.data.customer_ref,
      amountFiat: payload.data.amount_fiat,
      currency: payload.data.currency,
      settlement: payload.data.settlement && {
        asset: payload.data.settlement.asset,
        network: payload.data.settlement.network,
        txHash: payload.data.settlement.tx_hash
      }
    }));
  } else {
    console.log('Verified Noctra webhook event received:', String(payload.event || 'unknown'));
  }

  return { statusCode: 200, headers, body: 'OK' };
};
