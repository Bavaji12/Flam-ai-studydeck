import FlashcardDeck from './FlashcardDeck'
import Quiz from './Quiz'

function ResultView({ result, onReset }) {
  return (
    <section className="results">
      <div className="results-header">
        <div>
          <span className="section-label">
            YOUR STUDY DECK
          </span>

          <h2>{result.topic}</h2>

          {result.summary && (
            <p>{result.summary}</p>
          )}
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onReset}
        >
          New Topic
        </button>
      </div>

      <FlashcardDeck flashcards={result.flashcards} />

      <Quiz questions={result.quiz} />
    </section>
  )
}

export default ResultView