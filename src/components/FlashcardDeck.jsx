import { useState } from 'react'

function FlashcardDeck({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const currentCard = flashcards[currentIndex]

  function previousCard() {
    setFlipped(false)

    setCurrentIndex((index) =>
      index === 0 ? flashcards.length - 1 : index - 1
    )
  }

  function nextCard() {
    setFlipped(false)

    setCurrentIndex((index) =>
      index === flashcards.length - 1 ? 0 : index + 1
    )
  }

  return (
    <section className="study-section">
      <div className="section-heading">
        <div>
          <span className="section-label">01</span>
          <h2>Flashcards</h2>
        </div>

        <span className="progress">
          {currentIndex + 1} / {flashcards.length}
        </span>
      </div>

      <button
        type="button"
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((value) => !value)}
        aria-label={
          flipped
            ? 'Show flashcard question'
            : 'Reveal flashcard answer'
        }
      >
        <div className="flashcard-content">
          <span className="flashcard-type">
            {flipped ? 'ANSWER' : 'QUESTION'}
          </span>

          <p>
            {flipped
              ? currentCard.answer
              : currentCard.question}
          </p>

          <small>
            {flipped
              ? 'Click to see the question'
              : 'Click to reveal the answer'}
          </small>
        </div>
      </button>

      <div className="card-controls">
        <button type="button" onClick={previousCard}>
          ← Previous
        </button>

        <button type="button" onClick={nextCard}>
          Next →
        </button>
      </div>
    </section>
  )
}

export default FlashcardDeck