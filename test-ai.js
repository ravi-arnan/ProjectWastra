import fetch from 'node-fetch'

async function run() {
  const res = await fetch('http://localhost:3001/api/ai-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Tolong rekomendasikan 3 destinasi wisata. 2 yang populer seperti uluwatu dan 1 yang tidak biasa seperti pantai double six' }]
    })
  })
  const data = await res.json()
  console.log("RESPONSE:")
  console.log(data)
}
run()
