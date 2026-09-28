import { useEffect, useRef, useState } from 'react'

function VoiceAssistant({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [speaking, setSpeaking] = useState(false)

  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript

      if (transcript.trim()) {
        onTranscript(transcript)
      }
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [onTranscript])

  function startListening() {
    if (!recognitionRef.current || listening) {
      return
    }

    try {
      recognitionRef.current.start()
    } catch {
      // Ignore repeated start errors.
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()

    const utterance =
      new SpeechSynthesisUtterance(text)

    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.pitch = 1

    utterance.onstart = () => {
      setSpeaking(true)
    }

    utterance.onend = () => {
      setSpeaking(false)
    }

    utterance.onerror = () => {
      setSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  if (!supported) {
    return (
      <div className="voice-unsupported">
        Voice input is not supported in this browser.
        Try Chrome or Edge.
      </div>
    )
  }

  return (
    <div className="voice-assistant">
      <div className="voice-header">
        <div>
          <span className="voice-label">
            VOICE ASSISTANT
          </span>

          <h3>Study with your voice</h3>

          <p>
            Speak a topic and StudyDeck will turn it
            into a study deck.
          </p>
        </div>

        <div
          className={`voice-orb ${
            listening ? 'is-listening' : ''
          }`}
        >
          🎙️
        </div>
      </div>

      <div className="voice-actions">
        {!listening ? (
          <button
            type="button"
            className="voice-primary-button"
            onClick={startListening}
          >
            🎙️ Start Listening
          </button>
        ) : (
          <button
            type="button"
            className="voice-stop-button"
            onClick={stopListening}
          >
            ⏹ Stop Listening
          </button>
        )}

        {!speaking ? (
          <button
            type="button"
            className="voice-secondary-button"
            onClick={() =>
              speakText(
                'Welcome to AI StudyDeck. Speak a topic and I will help you create an interactive study deck.'
              )
            }
          >
            🔊 Test Voice
          </button>
        ) : (
          <button
            type="button"
            className="voice-secondary-button"
            onClick={stopSpeaking}
          >
            🔇 Stop Voice
          </button>
        )}
      </div>

      {listening && (
        <div className="voice-listening">
          <span className="voice-pulse" />
          Listening... Speak your study topic.
        </div>
      )}
    </div>
  )
}

export default VoiceAssistant