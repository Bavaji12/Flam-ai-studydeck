import { useEffect, useRef, useState } from 'react'

function PromptInput({ value, onChange, onSubmit, loading }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showMoreUploads, setShowMoreUploads] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')

  const recognitionRef = useRef(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  /*
   * -----------------------------------------
   * VOICE INPUT
   * -----------------------------------------
   */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

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
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()

      if (!transcript) {
        return
      }

      const currentText = valueRef.current?.trim() || ''

      const newText = currentText
        ? `${currentText} ${transcript}`
        : transcript

      onChangeRef.current(newText)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [])

  function toggleListening() {
    const recognition = recognitionRef.current

    if (!recognition || loading) {
      return
    }

    if (listening) {
      recognition.stop()
      return
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Unable to start microphone:', error)
    }
  }

  /*
   * -----------------------------------------
   * UPLOAD MENU
   * -----------------------------------------
   */

  function toggleUploadMenu() {
    if (loading) {
      return
    }

    setShowUploadMenu((current) => !current)
    setShowMoreUploads(false)
    setFileError('')
  }

  function openFilePicker() {
    setShowUploadMenu(false)
    setShowMoreUploads(false)
    setFileError('')

    fileInputRef.current?.click()
  }

  /*
   * -----------------------------------------
   * FILE READING
   * -----------------------------------------
   */

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileError('')

    const maxSize = 10 * 1024 * 1024

    if (file.size > maxSize) {
      setFileError('Please choose a file smaller than 10 MB.')
      event.target.value = ''
      return
    }

    const allowedExtensions = [
      '.txt',
      '.md',
      '.csv',
      '.json',
      '.pdf',
      '.docx',
    ]

    const fileName = file.name.toLowerCase()

    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    )

    if (!isAllowed) {
      setFileError(
        'Supported files: TXT, MD, CSV, JSON, PDF and DOCX.'
      )
      event.target.value = ''
      return
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    /*
     * Plain text files can be read directly in the browser.
     */
    if (
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.json')
    ) {
      try {
        const text = await file.text()

        if (!text.trim()) {
          setFileError('The selected file is empty.')
          return
        }

        const currentText = valueRef.current?.trim() || ''

        const fileContent = `\n\nStudy material from ${file.name}:\n${text}`

        onChangeRef.current(
          currentText
            ? `${currentText}${fileContent}`
            : fileContent.trim()
        )
      } catch (error) {
        console.error('File reading error:', error)

        setFileError(
          'Unable to read this file. Please try another file.'
        )
      }

      event.target.value = ''
      return
    }

    /*
     * PDF/DOCX need server-side extraction.
     *
     * We keep the file selected here. The backend can later
     * receive the file and extract its contents before sending
     * the study material to Gemini.
     */
    if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      setFileError(
        `${file.name} is selected. PDF/DOCX extraction should be handled by the backend.`
      )
    }

    event.target.value = ''
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setFileError('')
  }

  /*
   * -----------------------------------------
   * CLOSE MENU WHEN CLICKING OUTSIDE
   * -----------------------------------------
   */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowUploadMenu(false)
        setShowMoreUploads(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  /*
   * -----------------------------------------
   * SUBMIT
   * -----------------------------------------
   */

  function handleSubmit(event) {
    event.preventDefault()

    if (!value.trim() || loading) {
      return
    }

    onSubmit()
  }

  return (
    <form className="prompt-card" onSubmit={handleSubmit}>
      <div className="section-label">
        What are you studying?
      </div>

      <div className="textarea-wrapper">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Example: Explain JavaScript closures, lexical scope, and common use cases..."
          rows={7}
          disabled={loading}
        />

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-file-input"
          accept=".txt,.md,.csv,.json,.pdf,.docx"
          onChange={handleFileChange}
        />

        {/* Bottom-left controls */}
        <div className="composer-tools" ref={menuRef}>
          <button
            type="button"
            className={`composer-icon-button ${
              showUploadMenu ? 'is-active' : ''
            }`}
            onClick={toggleUploadMenu}
            disabled={loading}
            aria-label="Upload study material"
            title="Upload study material"
          >
            <span className="plus-icon">+</span>
          </button>

          {/* Upload menu */}
          {showUploadMenu && (
            <div className="upload-menu">
              <button
                type="button"
                className="upload-menu-item"
                onClick={openFilePicker}
              >
                <span className="upload-menu-icon">
                  📎
                </span>

                <span>
                  <strong>Upload files</strong>
                  <small>
                    Add notes, PDFs, DOCX and text files
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="upload-menu-item"
                disabled
                title="Google Drive integration is not configured"
              >
                <span className="upload-menu-icon">
                  ◉
                </span>

                <span>
                  <strong>Add from Drive</strong>
                  <small>Google Drive integration</small>
                </span>
              </button>

              <button
                type="button"
                className="upload-menu-item"
                onClick={() =>
                  setShowMoreUploads((current) => !current)
                }
              >
                <span className="upload-menu-icon">
                  •••
                </span>

                <span className="upload-menu-item-grow">
                  <strong>More uploads</strong>
                  <small>
                    More supported study material
                  </small>
                </span>

                <span className="menu-chevron">
                  {showMoreUploads ? '⌃' : '›'}
                </span>
              </button>

              {showMoreUploads && (
                <div className="more-upload-options">
                  <button
                    type="button"
                    onClick={openFilePicker}
                  >
                    📝 Text / Markdown
                  </button>

                  <button
                    type="button"
                    onClick={openFilePicker}
                  >
                    📊 CSV / JSON
                  </button>

                  <button
                    type="button"
                    onClick={openFilePicker}
                  >
                    📄 PDF / DOCX
                  </button>
                </div>
              )}

              <div className="upload-menu-divider" />

              <div className="upload-feature-placeholder">
                <span>🖼️</span>
                <span>
                  <strong>Create image</strong>
                  <small>
                    Not required for StudyDeck
                  </small>
                </span>
              </div>

              <div className="upload-feature-placeholder">
                <span>🎵</span>
                <span>
                  <strong>Create music</strong>
                  <small>
                    Not required for StudyDeck
                  </small>
                </span>
              </div>

              <div className="upload-feature-placeholder">
                <span>▣</span>
                <span>
                  <strong>Canvas</strong>
                  <small>
                    Not required for StudyDeck
                  </small>
                </span>
              </div>

              <div className="upload-feature-placeholder">
                <span>◎</span>
                <span>
                  <strong>Deep research</strong>
                  <small>
                    Not required for StudyDeck
                  </small>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Microphone */}
        {supported && (
          <button
            type="button"
            className={`voice-mic-button ${
              listening ? 'is-listening' : ''
            }`}
            onClick={toggleListening}
            disabled={loading}
            aria-label={
              listening
                ? 'Stop voice input'
                : 'Start voice input'
            }
            title={
              listening
                ? 'Stop listening'
                : 'Speak your study topic'
            }
          >
            {listening && (
              <span
                className="mic-waves"
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </span>
            )}

            <span
              className="mic-icon"
              aria-hidden="true"
            >
              🎙️
            </span>
          </button>
        )}
      </div>

      {/* Selected file */}
      {selectedFile && (
        <div className="selected-file">
          <div className="selected-file-icon">
            📎
          </div>

          <div className="selected-file-info">
            <strong>{selectedFile.name}</strong>

            <span>
              {Math.max(
                1,
                Math.round(selectedFile.size / 1024)
              )}{' '}
              KB
            </span>
          </div>

          <button
            type="button"
            className="remove-file-button"
            onClick={removeSelectedFile}
            aria-label="Remove selected file"
          >
            ×
          </button>
        </div>
      )}

      {/* Voice status */}
      {listening && (
        <div
          className="voice-status"
          role="status"
          aria-live="polite"
        >
          <span className="voice-status-dot" />
          Listening… speak your study topic.
        </div>
      )}

      {!supported && (
        <div className="voice-unsupported">
          Voice input is not supported in this browser.
          Please use Chrome or Edge.
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div
          className="file-error"
          role="alert"
        >
          {fileError}
        </div>
      )}

      <div className="prompt-footer">
        <span>
          {value.length} characters
        </span>

        <button
          type="submit"
          disabled={loading || !value.trim()}
        >
          {loading
            ? 'Generating...'
            : 'Generate Study Deck'}
        </button>
      </div>
    </form>
  )
}

export default PromptInput