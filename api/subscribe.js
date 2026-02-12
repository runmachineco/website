/**
 * Vercel serverless function: receives email and forwards to Google Apps Script.
 * Uses GOOGLE_SCRIPT_URL if set in Vercel env; otherwise uses default below.
 */

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuJivfny9XzC38WK_Rl5nR2ZDX35-TS49qnIr8RRXJ3YJdd8mVaqehxe9RgHTMXJnrhQ/exec';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://runmachineco.vercel.app',
  'https://www.runmachineco.com',
  'https://runmachineco.com'
];

function corsHeaders(origin) {
  const allowOrigin = origin && ALLOWED_ORIGINS.some(o => origin === o || origin?.endsWith('.vercel.app'))
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Method not allowed' });
    return;
  }

  const url = process.env.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').json({ error: 'Invalid JSON' });
    return;
  }

  const email = (body.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').json({ error: 'Valid email required' });
    return;
  }

  try {
    const scriptRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!scriptRes.ok) {
      const text = await scriptRes.text();
      console.error('Google Script error', scriptRes.status, text);
      res.status(502).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').json({
        error: 'Could not save email. Please try again.'
      });
      return;
    }

    res.status(200).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').json({ success: true });
  } catch (err) {
    console.error('Subscribe API error', err);
    res.status(500).setHeader('Access-Control-Allow-Origin', req.headers.origin || '*').json({
      error: 'Something went wrong. Please try again.'
    });
  }
}
