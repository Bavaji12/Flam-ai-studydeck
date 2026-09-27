export function validateStudyResult(result) {
  if (!result || typeof result !== 'object') {
    return {
      valid: false,
      error: 'The AI returned an invalid result.',
    }
  }

  if (typeof result.topic !== 'string' || !result.topic.trim()) {
    return {
      valid: false,
      error: 'The AI response is missing a valid topic.',
    }
  }

  if (!Array.isArray(result.flashcards) || result.flashcards.length === 0) {
    return {
      valid: false,
      error: 'The AI response did not contain any flashcards.',
    }
  }

  for (const card of result.flashcards) {
    if (
      !card ||
      typeof card.question !== 'string' ||
      typeof card.answer !== 'string' ||
      !card.question.trim() ||
      !card.answer.trim()
    ) {
      return {
        valid: false,
        error: 'One or more flashcards have an invalid format.',
      }
    }
  }

  if (!Array.isArray(result.quiz) || result.quiz.length === 0) {
    return {
      valid: false,
      error: 'The AI response did not contain any quiz questions.',
    }
  }

  for (const question of result.quiz) {
    if (
      !question ||
      typeof question.question !== 'string' ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      typeof question.answer !== 'string' ||
      typeof question.explanation !== 'string'
    ) {
      return {
        valid: false,
        error: 'One or more quiz questions have an invalid format.',
      }
    }

    if (!question.options.includes(question.answer)) {
      return {
        valid: false,
        error: 'A quiz answer does not match any of its options.',
      }
    }
  }

  return {
    valid: true,
    data: result,
  }
}