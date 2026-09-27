function ErrorState({ message, onRetry }) {
  return (
    <section className="state-card error-card">
      <div className="error-icon">!</div>

      <h2>We couldn't create your deck</h2>

      <p>{message}</p>

      <button type="button" onClick={onRetry}>
        Try Again
      </button>
    </section>
  )
}

export default ErrorState