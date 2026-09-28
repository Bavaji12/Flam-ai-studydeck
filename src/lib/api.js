import { validateStudyResult } from './validateResult'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function generateStudyDeck(prompt, signal) {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
    signal,
  })

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error(
      'The server returned an invalid response. Please try again.'
    )
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || 'Unable to generate your study deck.'
    )
  }

  const validation = validateStudyResult(result.data)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return validation.data
}