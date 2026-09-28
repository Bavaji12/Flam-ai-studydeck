import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Resolve project paths for serving the React production build
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.join(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

app.use(express.json({ limit: '100kb' }))

// --------------------------------------------------
// Serve React production build
// --------------------------------------------------

app.use(express.static(distPath))

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'StudyDeck backend is running',
  })
})

// --------------------------------------------------
// Generate study deck
// --------------------------------------------------

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body

    // --------------------------------------------------
    // Validate input
    // --------------------------------------------------

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a topic or study notes.',
      })
    }

    // Prevent excessively large requests
    if (prompt.length > 12000) {
      return res.status(400).json({
        success: false,
        error: 'Your input is too long.',
      })
    }

    // --------------------------------------------------
    // API key is ONLY available on the backend
    // --------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing.')

      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is missing from the server.',
      })
    }

    // --------------------------------------------------
    // Prompt for structured study content
    // --------------------------------------------------

    const systemInstruction = `
You are an educational content generator.

Convert the user's study topic or notes into a structured study deck.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any text before or after the JSON.

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
      "options": [
        "string",
        "string",
        "string",
        "string"
      ],
      "answer": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- Create 5 to 8 flashcards.
- Create exactly 5 quiz questions.
- Every quiz question must have exactly 4 options.
- Every option must be a non-empty string.
- The answer must exactly match one of the 4 options.
- Keep explanations concise.
- Make the material educational and beginner-friendly.
- Avoid duplicate questions.
- Base the content on the user's study input.
`

    // --------------------------------------------------
    // Gemini request with retry handling
    // --------------------------------------------------

    let response

    // Retry temporary 503 errors up to 3 times.
    const maxAttempts = 3

    // 1 second after first failure,
    // 2.5 seconds after second failure.
    const retryDelays = [1000, 2500]

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController()

      const timeout = setTimeout(() => {
        controller.abort()
      }, 30000)

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
                responseMimeType: 'application/json',
              },
            }),

            signal: controller.signal,
          }
        )

        // --------------------------------------------------
        // Retry temporary Gemini capacity errors
        // --------------------------------------------------

        if (response.status === 503 && attempt < maxAttempts) {
          console.log(
            `Gemini returned 503. Retrying in ${retryDelays[attempt - 1]}ms...`
          )

          await new Promise((resolve) => {
            setTimeout(resolve, retryDelays[attempt - 1])
          })

          continue
        }

        // Either successful or a non-retryable response
        break
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Gemini request timed out.')

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
    }

    // --------------------------------------------------
    // Make sure we received a response
    // --------------------------------------------------

    if (!response) {
      console.error('Gemini did not return a response.')

      return res.status(502).json({
        success: false,
        error: 'The AI service did not return a response.',
      })
    }

    // --------------------------------------------------
    // Handle Gemini API errors
    // --------------------------------------------------

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
        // Keep fallback error message
      }

      // Give the user a cleaner message for temporary overload.
      if (response.status === 503) {
        return res.status(503).json({
          success: false,
          error:
            'Gemini is temporarily busy. We tried again automatically, but the service is still unavailable. Please try again in a moment.',
        })
      }

      return res.status(502).json({
        success: false,
        error: `Gemini API error (${response.status}): ${googleMessage}`,
      })
    }

    // --------------------------------------------------
    // Parse Gemini HTTP response
    // --------------------------------------------------

    let data

    try {
      data = await response.json()
    } catch (error) {
      console.error('Could not parse Gemini HTTP response:', error)

      return res.status(502).json({
        success: false,
        error: 'The AI service returned an invalid response.',
      })
    }

    // --------------------------------------------------
    // Extract generated text
    // --------------------------------------------------

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error('Gemini returned no generated text:')

      console.error(
        JSON.stringify(data, null, 2)
      )

      return res.status(502).json({
        success: false,
        error: 'The AI returned an empty response.',
      })
    }

    // --------------------------------------------------
    // Parse AI-generated JSON
    // --------------------------------------------------

    let parsedResult

    try {
      parsedResult = JSON.parse(generatedText)
    } catch (error) {
      console.error('Invalid JSON returned by Gemini:')
      console.error(generatedText)

      return res.status(502).json({
        success: false,
        error: 'The AI returned invalid JSON. Please try again.',
      })
    }

    // --------------------------------------------------
    // Basic server-side validation
    // --------------------------------------------------

    if (
      !parsedResult ||
      typeof parsedResult !== 'object'
    ) {
      return res.status(502).json({
        success: false,
        error: 'The AI returned an invalid study deck.',
      })
    }

    // Validate topic
    if (
      typeof parsedResult.topic !== 'string' ||
      !parsedResult.topic.trim()
    ) {
      return res.status(502).json({
        success: false,
        error: 'The AI response is missing a valid topic.',
      })
    }

    // Validate flashcards
    if (
      !Array.isArray(parsedResult.flashcards) ||
      parsedResult.flashcards.length === 0
    ) {
      return res.status(502).json({
        success: false,
        error: 'The AI response contains no flashcards.',
      })
    }

    // Validate quiz
    if (
      !Array.isArray(parsedResult.quiz) ||
      parsedResult.quiz.length === 0
    ) {
      return res.status(502).json({
        success: false,
        error: 'The AI response contains no quiz questions.',
      })
    }

    // --------------------------------------------------
    // Validate flashcards
    // --------------------------------------------------

    for (const card of parsedResult.flashcards) {
      if (
        !card ||
        typeof card.question !== 'string' ||
        typeof card.answer !== 'string' ||
        !card.question.trim() ||
        !card.answer.trim()
      ) {
        return res.status(502).json({
          success: false,
          error: 'The AI returned an invalid flashcard.',
        })
      }
    }

    // --------------------------------------------------
    // Validate quiz questions
    // --------------------------------------------------

    for (const question of parsedResult.quiz) {
      if (
        !question ||
        typeof question.question !== 'string' ||
        !question.question.trim() ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        question.options.some(
          (option) =>
            typeof option !== 'string' ||
            !option.trim()
        ) ||
        typeof question.answer !== 'string' ||
        !question.answer.trim() ||
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        return res.status(502).json({
          success: false,
          error: 'The AI returned an invalid quiz question.',
        })
      }

      // Make sure answer matches one option
      if (!question.options.includes(question.answer)) {
        return res.status(502).json({
          success: false,
          error:
            'A quiz answer does not match any available option.',
        })
      }
    }

    // --------------------------------------------------
    // Send validated result to frontend
    // --------------------------------------------------

    return res.json({
      success: true,
      data: parsedResult,
    })
  } catch (error) {
    console.error('Server error:', error)

    return res.status(500).json({
      success: false,
      error:
        'Something went wrong while generating your study deck.',
    })
  }
})

// --------------------------------------------------
// React fallback
// --------------------------------------------------

app.get(/.*/, (req, res) => {
  res.sendFile(
    path.join(distPath, 'index.html')
  )
})

// --------------------------------------------------
// Start server
// --------------------------------------------------

const server = app.listen(
  PORT,
  '127.0.0.1',
  () => {
    console.log(
      `StudyDeck server running on http://127.0.0.1:${PORT}`
    )
  }
)

// --------------------------------------------------
// Server errors
// --------------------------------------------------

server.on('error', (error) => {
  console.error('SERVER ERROR:', error)
})

// --------------------------------------------------
// Keep development/production process alive
// --------------------------------------------------

setInterval(() => {}, 1000)