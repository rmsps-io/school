import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StudentDashboardClient } from '@/components/student/StudentDashboardClient'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, admission_no, roll_no, academic_year, section_id, sections(id, name, classes(name))')
    .eq('profile_id', user.id)
    .single()

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Student profile not set up yet. Contact admin.</p>
      </div>
    )
  }

  const currentYear = student.academic_year ?? new Date().getFullYear().toString()

  const [
    { data: attendance },
    { data: results },
    { data: payments },
    { data: assignments },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('attendance').select('status, date')
      .eq('student_id', student.id).order('date', { ascending: false }).limit(30),
    supabase.from('results')
      .select('marks_obtained, full_marks, grade, subjects(name), exams(name, exam_type, academic_year)')
      .eq('student_id', student.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('amount_paid, status, payment_date, fees(fee_type)')
      .eq('student_id', student.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('assignments').select('id, title, due_date, subjects(name)')
      .eq('section_id', student.section_id).eq('is_active', true)
      .order('due_date', { ascending: true }).limit(5),
    supabase.from('announcements').select('id, title, type, created_at')
      .or('target_role.eq.student,target_role.eq.all').eq('is_published', true)
      .order('created_at', { ascending: false }).limit(5),
  ])

  const presentDays   = (attendance ?? []).filter(a => a.status === 'present').length
  const totalDays     = (attendance ?? []).length
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  const totalPaid     = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount_paid), 0)
  const totalPending  = (payments ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_paid), 0)

  const filteredResults = (results ?? []).filter(r => {
    const yr = (r.exams as {academic_year?: string}[] | null)?.[0]?.academic_year
    return !yr || yr === currentYear
  })

  return (
    <StudentDashboardClient
      student={student as Parameters<typeof StudentDashboardClient>[0]['student']}
      attendancePct={attendancePct}
      presentDays={presentDays}
      totalDays={totalDays}
      results={filteredResults as Parameters<typeof StudentDashboardClient>[0]['results']}
      totalPaid={totalPaid}
      totalPending={totalPending}
      assignments={assignments as Parameters<typeof StudentDashboardClient>[0]['assignments'] ?? []}
      announcements={announcements ?? []}
    />
  )
}
