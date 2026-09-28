import { useEffect, useState } from 'react'

function StudyTasks({ result }) {
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('studydeck-tasks') || '[]'
      )
    } catch {
      return []
    }
  })

  const [newTask, setNewTask] = useState('')

  // Automatically create useful tasks when a new study deck is generated.
  useEffect(() => {
    if (!result?.topic) return

    const defaultTasks = [
      'Review the study summary',
      'Complete the flashcards',
      'Complete the quiz',
      'Retest the questions you got wrong',
    ]

    setTasks((currentTasks) => {
      const existingTasks = currentTasks.filter(
        (task) => task.topic === result.topic
      )

      const missingTasks = defaultTasks
        .filter(
          (text) =>
            !existingTasks.some(
              (task) => task.text === text
            )
        )
        .map((text) => ({
          id: `${Date.now()}-${Math.random()}`,
          text,
          topic: result.topic,
          completed: false,
        }))

      if (missingTasks.length === 0) {
        return currentTasks
      }

      const updatedTasks = [
        ...currentTasks,
        ...missingTasks,
      ]

      localStorage.setItem(
        'studydeck-tasks',
        JSON.stringify(updatedTasks)
      )

      return updatedTasks
    })
  }, [result?.topic])

  function saveTasks(updatedTasks) {
    setTasks(updatedTasks)

    localStorage.setItem(
      'studydeck-tasks',
      JSON.stringify(updatedTasks)
    )
  }

  function addTask(event) {
    event.preventDefault()

    if (!newTask.trim()) return

    const task = {
      id: `${Date.now()}-${Math.random()}`,
      text: newTask.trim(),
      topic: result?.topic || null,
      completed: false,
    }

    saveTasks([...tasks, task])
    setNewTask('')
  }

  function toggleTask(id) {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
          }
        : task
    )

    saveTasks(updatedTasks)
  }

  function deleteTask(id) {
    saveTasks(
      tasks.filter((task) => task.id !== id)
    )
  }

  const visibleTasks = tasks.filter(
    (task) =>
      !task.topic ||
      !result?.topic ||
      task.topic === result.topic
  )

  const completedCount = visibleTasks.filter(
    (task) => task.completed
  ).length

  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <div>
          <span className="sidebar-label">PRODUCTIVITY</span>
          <h3>Study Tasks</h3>
        </div>

        <span className="task-count">
          {completedCount}/{visibleTasks.length}
        </span>
      </div>

      <form
        className="task-add-form"
        onSubmit={addTask}
      >
        <input
          value={newTask}
          onChange={(event) =>
            setNewTask(event.target.value)
          }
          placeholder="Add a study task..."
        />

        <button type="submit">+</button>
      </form>

      {visibleTasks.length === 0 ? (
        <div className="sidebar-empty">
          <span>✅</span>
          <p>No tasks yet.</p>
          <small>
            Generate a study deck to create tasks automatically.
          </small>
        </div>
      ) : (
        <div className="task-list">
          {visibleTasks.map((task) => (
            <div
              className={`task-item ${
                task.completed ? 'is-completed' : ''
              }`}
              key={task.id}
            >
              <button
                type="button"
                className="task-checkbox"
                onClick={() => toggleTask(task.id)}
                aria-label={
                  task.completed
                    ? 'Mark task incomplete'
                    : 'Mark task complete'
                }
              >
                {task.completed ? '✓' : ''}
              </button>

              <span className="task-text">
                {task.text}
              </span>

              <button
                type="button"
                className="sidebar-delete-button"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {visibleTasks.length > 0 && (
        <div className="task-progress">
          <div
            className="task-progress-bar"
            style={{
              width: `${
                (completedCount /
                  visibleTasks.length) *
                100
              }%`,
            }}
          />
        </div>
      )}
    </section>
  )
}

export default StudyTasks