import { useRef, useState } from 'react'
import './App.css'

import PromptInput from './components/PromptInput'
import ResultView from './components/ResultView'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'

import { generateStudyDeck } from './lib/api'

function App() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Used to prevent an older request from replacing a newer result.
  const requestIdRef = useRef(0)

  async function handleGenerate() {
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      setError('Enter a topic or some study notes first.')
      return
    }

    const requestId = ++requestIdRef.current

    setLoading(true)
    setError('')
    setResult(null)

    const controller = new AbortController()

    try {
      const studyResult = await generateStudyDeck(
        trimmedPrompt,
        controller.signal
      )

      // Ignore stale responses.
      if (requestId !== requestIdRef.current) {
        return
      }

      setResult(studyResult)
    } catch (err) {
      if (err.name === 'AbortError') {
        return
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      setError(
        err.message ||
          'Something went wrong. Please try generating the deck again.'
      )
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  function handleReset() {
    requestIdRef.current += 1

    setPrompt('')
    setResult(null)
    setError('')
    setLoading(false)
  }

  return (
    <main className="app">
      <section className="hero">
        <div className="hero-badge">AI StudyDeck</div>

        <h1>
          Turn your notes into
          <span> an interactive study deck.</span>
        </h1>

        <p>
          Enter a topic, paste your notes, and StudyDeck will create
          flashcards and a quiz for active recall.
        </p>
      </section>

      <section className="workspace">
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleGenerate}
          loading={loading}
        />

        {loading && <LoadingState />}

        {error && !loading && (
          <ErrorState
            message={error}
            onRetry={handleGenerate}
          />
        )}

        {result && !loading && !error && (
          <ResultView
            result={result}
            onReset={handleReset}
          />
        )}
      </section>

      <footer className="footer">
        <p>
          AI-generated study material can contain mistakes. Review
          important information before relying on it.
        </p>
      </footer>
    </main>
  )
}

export default App