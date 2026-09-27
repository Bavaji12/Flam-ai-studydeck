import { useState } from 'react'

function Quiz({ questions }) {
  const [quizQuestions, setQuizQuestions] = useState(questions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = quizQuestions[currentIndex]

  const isCorrect = selected === currentQuestion?.answer

  function selectAnswer(option) {
    if (submitted) return
    setSelected(option)
  }

  function checkAnswer() {
    if (!selected) return

    setSubmitted(true)

    if (selected === currentQuestion.answer) {
      setScore((value) => value + 1)
    } else {
      setWrongQuestions((items) => {
        const alreadyAdded = items.some(
          (item) => item.question === currentQuestion.question
        )

        return alreadyAdded ? items : [...items, currentQuestion]
      })
    }
  }

  function nextQuestion() {
    const nextIndex = currentIndex + 1

    if (nextIndex >= quizQuestions.length) {
      setFinished(true)
      return
    }

    setCurrentIndex(nextIndex)
    setSelected('')
    setSubmitted(false)
  }

  function restartQuiz() {
    setQuizQuestions(questions)
    setCurrentIndex(0)
    setSelected('')
    setSubmitted(false)
    setScore(0)
    setWrongQuestions([])
    setFinished(false)
  }

  function retestWrong() {
    if (wrongQuestions.length === 0) {
      restartQuiz()
      return
    }

    setQuizQuestions(wrongQuestions)
    setCurrentIndex(0)
    setSelected('')
    setSubmitted(false)
    setScore(0)
    setWrongQuestions([])
    setFinished(false)
  }

  if (finished) {
    return (
      <section className="study-section quiz-section">
        <div className="section-heading">
          <div>
            <span className="section-label">02</span>
            <h2>Quiz complete</h2>
          </div>
        </div>

        <div className="score-card">
          <div className="score-number">
            {score}/{quizQuestions.length}
          </div>

          <p>
            You answered {score} of {quizQuestions.length}{' '}
            questions correctly.
          </p>

          <div className="quiz-actions">
            {wrongQuestions.length > 0 && (
              <button type="button" onClick={retestWrong}>
                Retest Wrong Answers ({wrongQuestions.length})
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={restartQuiz}
            >
              Restart Quiz
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="study-section quiz-section">
      <div className="section-heading">
        <div>
          <span className="section-label">02</span>
          <h2>Quiz</h2>
        </div>

        <span className="progress">
          {currentIndex + 1} / {quizQuestions.length}
        </span>
      </div>

      <div className="quiz-card">
        <h3>{currentQuestion.question}</h3>

        <div className="options">
          {currentQuestion.options.map((option) => {
            const optionCorrect =
              submitted && option === currentQuestion.answer

            const optionWrong =
              submitted &&
              option === selected &&
              option !== currentQuestion.answer

            return (
              <button
                key={option}
                type="button"
                className={[
                  'quiz-option',
                  selected === option ? 'selected' : '',
                  optionCorrect ? 'correct' : '',
                  optionWrong ? 'wrong' : '',
                ].join(' ')}
                onClick={() => selectAnswer(option)}
              >
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {submitted && (
          <div
            className={`quiz-feedback ${
              isCorrect ? 'feedback-correct' : 'feedback-wrong'
            }`}
          >
            <strong>
              {isCorrect ? 'Correct!' : 'Not quite.'}
            </strong>

            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="quiz-footer">
          {!submitted ? (
            <button
              type="button"
              onClick={checkAnswer}
              disabled={!selected}
            >
              Check Answer
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
            >
              {currentIndex === quizQuestions.length - 1
                ? 'See Results'
                : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Quiz