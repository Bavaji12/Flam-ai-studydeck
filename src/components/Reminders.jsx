import { useState } from 'react'

function Reminders() {
  const [reminders, setReminders] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('studydeck-reminders') || '[]'
      )
    } catch {
      return []
    }
  })

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    text: '',
    date: '',
    time: '',
  })

  function saveReminders(updatedReminders) {
    setReminders(updatedReminders)

    localStorage.setItem(
      'studydeck-reminders',
      JSON.stringify(updatedReminders)
    )
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.text.trim() || !form.date || !form.time) {
      return
    }

    const newReminder = {
      id: Date.now(),
      text: form.text.trim(),
      date: form.date,
      time: form.time,
      completed: false,
    }

    saveReminders([...reminders, newReminder])

    setForm({
      text: '',
      date: '',
      time: '',
    })

    setShowForm(false)
  }

  function toggleReminder(id) {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id
        ? {
            ...reminder,
            completed: !reminder.completed,
          }
        : reminder
    )

    saveReminders(updatedReminders)
  }

  function deleteReminder(id) {
    saveReminders(
      reminders.filter((reminder) => reminder.id !== id)
    )
  }

  const sortedReminders = [...reminders].sort(
    (a, b) =>
      `${a.date} ${a.time}`.localeCompare(
        `${b.date} ${b.time}`
      )
  )

  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <div>
          <span className="sidebar-label">REMINDERS</span>
          <h3>Study Reminders</h3>
        </div>

        <button
          type="button"
          className="sidebar-add-button"
          onClick={() => setShowForm((value) => !value)}
        >
          +
        </button>
      </div>

      {showForm && (
        <form
          className="sidebar-form"
          onSubmit={handleSubmit}
        >
          <input
            name="text"
            value={form.text}
            onChange={handleChange}
            placeholder="Reminder..."
          />

          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />

          <input
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="sidebar-primary-button"
          >
            Add Reminder
          </button>
        </form>
      )}

      {sortedReminders.length === 0 ? (
        <div className="sidebar-empty">
          <span>🔔</span>
          <p>No reminders yet.</p>
          <small>Add a reminder for your study plan.</small>
        </div>
      ) : (
        <div className="reminder-list">
          {sortedReminders.map((reminder) => (
            <div
              className={`reminder-item ${
                reminder.completed ? 'is-completed' : ''
              }`}
              key={reminder.id}
            >
              <button
                type="button"
                className="reminder-check"
                onClick={() => toggleReminder(reminder.id)}
                aria-label="Complete reminder"
              >
                {reminder.completed ? '✓' : ''}
              </button>

              <div className="reminder-details">
                <strong>{reminder.text}</strong>
                <span>
                  {reminder.date} · {reminder.time}
                </span>
              </div>

              <button
                type="button"
                className="sidebar-delete-button"
                onClick={() => deleteReminder(reminder.id)}
                aria-label="Delete reminder"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Reminders