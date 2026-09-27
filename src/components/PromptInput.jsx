function PromptInput({
  value,
  onChange,
  onSubmit,
  loading,
}) {
  function handleSubmit(event) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="prompt-card" onSubmit={handleSubmit}>
      <div className="section-label">
        What are you studying?
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Explain JavaScript closures, lexical scope, and common use cases..."
        rows={7}
        disabled={loading}
      />

      <div className="prompt-footer">
        <span>
          {value.length} characters
        </span>

        <button
          type="submit"
          disabled={loading || !value.trim()}
        >
          {loading ? 'Generating...' : 'Generate Study Deck'}
        </button>
      </div>
    </form>
  )
}

export default PromptInput