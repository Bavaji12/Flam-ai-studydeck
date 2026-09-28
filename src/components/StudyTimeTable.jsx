import { useState } from 'react'

function StudyTimeTable() {
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('studydeck-sessions') || '[]'
      )
    } catch {
      return []
    }
  })

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
  })

  function saveSessions(updatedSessions) {
    setSessions(updatedSessions)

    localStorage.setItem(
      'studydeck-sessions',
      JSON.stringify(updatedSessions)
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

    if (
      !form.subject.trim() ||
      !form.date ||
      !form.startTime
    ) {
      return
    }

    const newSession = {
      id: Date.now(),
      subject: form.subject.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
    }

    saveSessions([...sessions, newSession])

    setForm({
      subject: '',
      date: '',
      startTime: '',
      endTime: '',
    })

    setShowForm(false)
  }

  function deleteSession(id) {
    saveSessions(
      sessions.filter((session) => session.id !== id)
    )
  }

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(
        `${b.date} ${b.startTime}`
      )
  )

  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <div>
          <span className="sidebar-label">SCHEDULE</span>
          <h3>Study Timetable</h3>
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
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject or topic"
          />

          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />

          <div className="time-inputs">
            <input
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={handleChange}
            />

            <input
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="sidebar-primary-button"
          >
            Add Session
          </button>
        </form>
      )}

      {sortedSessions.length === 0 ? (
        <div className="sidebar-empty">
          <span>📅</span>
          <p>No study sessions yet.</p>
          <small>Add your first session.</small>
        </div>
      ) : (
        <div className="schedule-list">
          {sortedSessions.map((session) => (
            <div
              className="schedule-item"
              key={session.id}
            >
              <div className="schedule-time">
                {session.startTime}
                {session.endTime && ` – ${session.endTime}`}
              </div>

              <div className="schedule-details">
                <strong>{session.subject}</strong>
                <span>{session.date}</span>
              </div>

              <button
                type="button"
                className="sidebar-delete-button"
                onClick={() => deleteSession(session.id)}
                aria-label={`Delete ${session.subject}`}
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

export default StudyTimeTable