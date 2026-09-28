import { useRef, useState } from 'react'
import './App.css'

import PromptInput from './components/PromptInput'
import ResultView from './components/ResultView'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'
import StudySidebar from './components/StudySidebar'

import { generateStudyDeck } from './lib/api'

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tracks the latest generation request.
  // Older responses are ignored if a newer request has started.
  const requestIdRef = useRef(0)

  async function handleGenerate() {
    const trimmedPrompt = prompt.trim()

    // Prevent empty submissions.
    if (!trimmedPrompt) {
      setError(
        'Enter a topic, study notes, or upload a study file first.'
      )
      return
    }

    // Create a unique ID for this request.
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError('')
    setResult(null)

    // Allows the request to be cancelled if needed.
    const controller = new AbortController()

    try {
      const studyResult = await generateStudyDeck(
        trimmedPrompt,
        controller.signal
      )

      // Ignore an old response.
      if (requestId !== requestIdRef.current) {
        return
      }

      setResult(studyResult)
    } catch (err) {
      // Ignore intentionally cancelled requests.
      if (err.name === 'AbortError') {
        return
      }

      // Ignore errors from an old request.
      if (requestId !== requestIdRef.current) {
        return
      }

      setError(
        err.message ||
          'Something went wrong. Please try generating the deck again.'
      )
    } finally {
      // Only the latest request controls loading.
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  function handleReset() {
    // Invalidate any previous request.
    requestIdRef.current += 1

    setPrompt('')
    setResult(null)
    setError('')
    setLoading(false)
  }

  function handlePromptChange(value) {
    setPrompt(value)

    // Clear an old error when the user starts typing.
    if (error) {
      setError('')
    }
  }

  return (
    <main className="app">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="hero">
        <div className="hero-badge">
          AI StudyDeck
        </div>

        <h1>
          Turn your notes into
          <span> an interactive study deck.</span>
        </h1>

        <p>
          Enter a topic, paste your notes, speak with your
          microphone, or upload study material. StudyDeck
          will create flashcards and a quiz for active recall.
        </p>
      </section>

      {/* =========================================
          MAIN DASHBOARD
      ========================================= */}

      <section className="dashboard-layout">

        {/* =========================================
            MAIN COLUMN
        ========================================= */}

        <div className="main-column">
          <section className="workspace">

            <PromptInput
              value={prompt}
              onChange={handlePromptChange}
              onSubmit={handleGenerate}
              loading={loading}
            />

            {/* Loading */}

            {loading && <LoadingState />}

            {/* Error */}

            {error && !loading && (
              <ErrorState
                message={error}
                onRetry={handleGenerate}
              />
            )}

            {/* Generated study deck */}

            {result && !loading && !error && (
              <ResultView
                result={result}
                onReset={handleReset}
              />
            )}

          </section>
        </div>

        {/* =========================================
            RIGHT SIDEBAR
        ========================================= */}

        <StudySidebar result={result} />

      </section>

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className="footer">
        <p>
          AI-generated study material can contain
          mistakes. Review important information before
          relying on it.
        </p>
      </footer>

    </main>
  )
}

export default App