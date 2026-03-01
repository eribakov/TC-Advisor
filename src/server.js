import express from 'express';

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // ✅ safe .env here

app.post('/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Analyze these terms and conditions:\n\n${text}` }] }]
      })
    }
  );

  const data = await response.json();
  if (data.error) return res.status(500).json({ error: data.error.message });

  res.json({ result: data.candidates[0].content.parts[0].text });
});

app.listen(3000, () => console.log('Running on port 3000'));