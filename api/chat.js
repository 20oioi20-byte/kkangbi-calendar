export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages, max_tokens = 1000 } = req.body;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens,
        system: system || '',
        messages
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Anthropic error' });
    }

    const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
    const continued = data.stop_reason === 'max_tokens';

    res.status(200).json({ text, continued });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
