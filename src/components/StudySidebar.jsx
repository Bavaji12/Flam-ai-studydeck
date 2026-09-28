import StudyTimeTable from './StudyTimeTable'
import Reminders from './Reminders'
import StudyTasks from './StudyTasks'

function StudySidebar({ result }) {
  return (
    <aside className="study-sidebar">
      <StudyTimeTable />

      <Reminders />

      <StudyTasks result={result} />
    </aside>
  )
}

export default StudySidebar