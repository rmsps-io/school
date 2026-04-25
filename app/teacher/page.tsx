import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TeacherDashboardClient } from '@/components/teacher/TeacherDashboardClient'

export const metadata: Metadata = { title: 'Teacher Dashboard' }

export default async function TeacherDashboardPage() {
  const supabase = createClient()
  const today    = new Date().toISOString().split('T')[0]

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: teacher } = await supabase
    .from('teachers').select('id').eq('profile_id', user.id).single()

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Teacher profile not set up yet. Contact admin.</p>
      </div>
    )
  }

  const [
    { data: teacherSubjects },
    { data: todayAttendance },
    { data: assignmentsRaw },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('teacher_subjects')
      .select('sections(id, name, classes(name)), subjects(name)')
      .eq('teacher_id', teacher.id),
    supabase.from('attendance').select('status')
      .eq('teacher_id', teacher.id).eq('date', today),
    supabase.from('assignments')
      .select('id, title, due_date, subjects(name)')
      .eq('teacher_id', teacher.id).eq('is_active', true)
      .order('due_date', { ascending: true }).limit(5),
    supabase.from('announcements')
      .select('id, title, type, created_at')
      .or('target_role.eq.teacher,target_role.eq.all')
      .eq('is_published', true)
      .order('created_at', { ascending: false }).limit(5),
  ])

  // Build flat sections array with unique section IDs
  type TSRaw = {
    sections: { id: string; name: string; classes: { name: string }[] | null }[] | null
    subjects:  { name: string }[] | null
  }
  const tsTyped = (teacherSubjects ?? []) as TSRaw[]

  const sectionMap = new Map<string, { id: string; name: string; className: string; subjects: string[] }>()
  tsTyped.forEach(ts => {
    const sec = ts.sections?.[0]
    const sub = ts.subjects?.[0]?.name
    if (!sec) return
    if (!sectionMap.has(sec.id)) {
      sectionMap.set(sec.id, {
        id:        sec.id,
        name:      sec.name,
        className: sec.classes?.[0]?.name ?? '—',
        subjects:  [],
      })
    }
    if (sub) sectionMap.get(sec.id)!.subjects.push(sub)
  })
  const sections = Array.from(sectionMap.values())

  // Build flat assignments
  type AssignRaw = {
    id: string; title: string; due_date: string
    subjects: { name: string }[] | null
  }
  const assignments = ((assignmentsRaw ?? []) as AssignRaw[]).map(a => ({
    id:          a.id,
    title:       a.title,
    due_date:    a.due_date,
    subjectName: a.subjects?.[0]?.name ?? '—',
  }))

  const presentCount = (todayAttendance ?? []).filter(a => a.status === 'present').length
  const absentCount  = (todayAttendance ?? []).filter(a => a.status === 'absent').length

  return (
    <TeacherDashboardClient
      sections={sections}
      presentCount={presentCount}
      absentCount={absentCount}
      totalMarked={(todayAttendance ?? []).length}
      assignments={assignments}
      announcements={announcements ?? []}
    />
  )
}
