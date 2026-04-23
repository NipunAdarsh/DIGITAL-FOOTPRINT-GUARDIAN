export default async function handler(req, res) {
  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'Email required' })

  try {
    const r = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      { headers: {
          'hibp-api-key': process.env.HIBP_API_KEY,
          'user-agent': 'DigitalFootprintGuardian-CollegeProject'
      }}
    )
    if (r.status === 404) return res.status(200).json([])
    if (!r.ok) return res.status(r.status).json({ error: 'HIBP error' })
    return res.status(200).json(await r.json())
  } catch {
    return res.status(500).json({ error: 'Server error' })
  }
}
