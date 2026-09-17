// api/audit-request.js — Free Audit intake, Vercel serverless function.
// No npm dependencies (same zero-dependency pattern as this site's other serverless
// functions) — uses the Node 18+ global fetch() directly against the Airtable and
// Resend REST APIs.
//
// Mirrors Parkway Car Stereo's /api/leads pattern: the Airtable write must succeed
// for the request to count (returns 502 if it fails). The Resend notification below
// it is best-effort only — a failure there is logged but never fails the response,
// since a missed notification email is recoverable (check Airtable) but a lost
// request is not.

const AIRTABLE_BASE_ID = 'appNanl519U2oUx2n';
const AIRTABLE_TABLE_ID = 'tbl8r8lS3hbRNE01w';
const NOTIFY_TO = 'dsbriceno42008@gmail.com';
const ALLOWED_SOURCES = ['nav', 'hero', 'real-problem', 'final-cta', 'direct'];

const MAX_FIELD_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort burst cap for this function instance. Durable protection
// against distributed floods should come from Vercel Firewall rate limiting;
// this stops simple same-instance spam bursts from reaching Airtable/Resend.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_SUBMITS = 5;
let recentSubmissions = [];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) {
    console.error('AIRTABLE_API_KEY is not set — audit request was not saved.');
    return res.status(500).json({ error: 'Server not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const contactName = String(body.contactName || '').trim();
  const businessName = String(body.businessName || '').trim();
  const email = String(body.email || '').trim();
  const location = String(body.location || '').trim();
  const website = String(body.website || '').trim();
  const phone = String(body.phone || '').trim();
  const consent = body.consent === true;
  const source = ALLOWED_SOURCES.indexOf(body.source) !== -1 ? body.source : 'direct';

  if (!contactName || !businessName || !email || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (phone && !consent) {
    return res.status(400).json({ error: 'Consent is required when providing a phone number' });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (
    contactName.length > MAX_FIELD_LENGTH ||
    businessName.length > MAX_FIELD_LENGTH ||
    location.length > MAX_FIELD_LENGTH ||
    website.length > MAX_FIELD_LENGTH ||
    phone.length > MAX_FIELD_LENGTH
  ) {
    return res.status(400).json({ error: 'One or more fields are too long' });
  }

  const nowMs = Date.now();
  recentSubmissions = recentSubmissions.filter(ts => nowMs - ts < RATE_WINDOW_MS);
  if (recentSubmissions.length >= RATE_MAX_SUBMITS) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }
  recentSubmissions.push(nowMs);

  const now = new Date();
  const fields = {
    'Contact Name': contactName,
    'Business Name': businessName,
    Email: email,
    'Business Location': location,
    Consent: consent,
    Source: source,
    'Submitted At': now.toISOString(),
    Status: 'New',
  };
  if (website) fields.Website = website;
  if (phone) fields.Phone = phone;

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: fields, typecast: true }),
      }
    );

    if (!airtableRes.ok) {
      const errText = await airtableRes.text();
      console.error('Airtable create record failed:', airtableRes.status, errText);
      return res.status(502).json({ error: 'Failed to save audit request' });
    }
  } catch (err) {
    console.error('Airtable create record threw:', err);
    return res.status(502).json({ error: 'Failed to save audit request' });
  }

  // Request is safely saved at this point. Everything below is best-effort notification.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cenovate Marketing Website <daniel@cenovatemarketing.com>',
          to: [NOTIFY_TO],
          subject: `New Free Audit Request: ${businessName}`,
          text: [
            'New free-audit request from cenovatemarketing.com/free-audit',
            '',
            `Contact Name: ${contactName}`,
            `Business Name: ${businessName}`,
            `Email: ${email}`,
            `Location: ${location}`,
            website ? `Website: ${website}` : 'Website: (not provided)',
            phone
              ? `Phone: ${phone} (consent given: ${consent ? 'yes' : 'no'})`
              : 'Phone: (not provided)',
            `Source: ${source}`,
            '',
            `Submitted: ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
          ].join('\n'),
        }),
      });
      if (!emailRes.ok) {
        console.error('Resend send failed:', emailRes.status, await emailRes.text());
      }
    } catch (err) {
      console.error('Resend send threw:', err);
    }
  } else {
    console.error('RESEND_API_KEY is not set — request saved but no notification email sent.');
  }

  return res.status(200).json({ ok: true });
};
