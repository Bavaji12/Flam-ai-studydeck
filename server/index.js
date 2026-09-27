import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '100kb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'StudyDeck backend is running',
  })
})

// Generate study deck
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body

    // Validate input
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a topic or study notes.',
      })
    }

    if (prompt.length > 12000) {
      return res.status(400).json({
        success: false,
        error: 'Your input is too long.',
      })
    }

    // API key stays ONLY on the backend
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is missing from the server.',
      })
    }

    const systemInstruction = `
You are an educational content generator.

Convert the user's study topic or notes into a structured study deck.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.

Return exactly this structure:

{
  "topic": "string",
  "summary": "string",
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- Create 5 to 8 flashcards.
- Create exactly 5 quiz questions.
- Every quiz question must have exactly 4 options.
- The answer must exactly match one option.
- Keep explanations concise.
- Make the material educational and beginner-friendly.
`

    // Stop very slow Gemini requests
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, 30000)

    let response

    try {
      response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemInstruction}

USER STUDY INPUT:
${prompt.trim()}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      )
    } catch (error) {
      if (error.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'The AI request took too long. Please try again.',
        })
      }

      console.error('Gemini network error:', error)

      return res.status(502).json({
        success: false,
        error: 'Could not connect to the AI service.',
      })
    } finally {
      clearTimeout(timeout)
    }

    // Gemini returned an HTTP error
    if (!response.ok) {
      const errorText = await response.text()

      console.error('================ GEMINI ERROR ================')
      console.error('STATUS:', response.status)
      console.error('ERROR:', errorText)
      console.error('================================================')

      let googleMessage = 'Unknown Gemini API error.'

      try {
        const errorData = JSON.parse(errorText)
        googleMessage =
          errorData?.error?.message ||
          googleMessage
      } catch {
        // Keep raw error fallback
      }

      return res.status(502).json({
        success: false,
        error: `Gemini API error (${response.status}): ${googleMessage}`,
      })
    }

    // Parse Gemini response
    const data = await response.json()

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error('Gemini returned no generated text:')
      console.error(JSON.stringify(data, null, 2))

      return res.status(502).json({
        success: false,
        error: 'The AI returned an empty response.',
      })
    }

    // Parse AI JSON
    let parsedResult

    try {
      parsedResult = JSON.parse(generatedText)
    } catch (error) {
      console.error('Invalid JSON from Gemini:')
      console.error(generatedText)

      return res.status(502).json({
        success: false,
        error: 'The AI returned invalid JSON. Please try again.',
      })
    }

    // Send structured result to frontend
    return res.json({
      success: true,
      data: parsedResult,
    })
  } catch (error) {
    console.error('Server error:', error)

    return res.status(500).json({
      success: false,
      error: 'Something went wrong while generating your study deck.',
    })
  }
})

// Start server
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(
    `StudyDeck server running on http://127.0.0.1:${PORT}`
  )
})

server.on('error', (error) => {
  console.error('SERVER ERROR:', error)
})

// Keep development server alive
setInterval(() => {}, 1000)