import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ParentDashboardClient } from '@/components/parent/ParentDashboardClient'

export const metadata: Metadata = { title: 'Parent Dashboard' }

export default async function ParentDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: parent } = await supabase
    .from('parents')
    .select('relation, student_id')
    .eq('profile_id', user.id)
    .single()

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground text-sm">Parent profile not linked. Contact admin.</p>
      </div>
    )
  }

  const studentId = parent.student_id

  const [
    { data: studentData },
    { data: attendance },
    { data: results },
    { data: payments },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('students')
      .select('admission_no, roll_no, sections(name, classes(name)), profiles(full_name)')
      .eq('id', studentId).single(),
    supabase.from('attendance').select('status, date')
      .eq('student_id', studentId).order('date', { ascending: false }).limit(30),
    supabase.from('results')
      .select('marks_obtained, full_marks, grade, subjects(name), exams(name)')
      .eq('student_id', studentId).order('created_at', { ascending: false }).limit(8),
    supabase.from('payments')
      .select('amount_paid, status, payment_date, receipt_no, fees(fee_type)')
      .eq('student_id', studentId).order('payment_date', { ascending: false }).limit(5),
    supabase.from('announcements')
      .select('id, title, type, content, created_at')
      .or('target_role.eq.parent,target_role.eq.all').eq('is_published', true)
      .order('created_at', { ascending: false }).limit(5),
  ])

  // Safely extract nested data (Supabase returns arrays for joins)
  type StudRaw = {
    admission_no: string; roll_no: string | null
    sections: { name: string; classes: { name: string }[] | null }[] | null
    profiles: { full_name: string }[] | null
  }
  const s = studentData as StudRaw | null

  const childName   = s?.profiles?.[0]?.full_name ?? 'Your Child'
  const admissionNo = s?.admission_no ?? '—'
  const rollNo      = s?.roll_no ?? null
  const sectionName = s?.sections?.[0]?.name ?? '—'
  const className   = s?.sections?.[0]?.classes?.[0]?.name ?? '—'

  const presentDays   = (attendance ?? []).filter(a => a.status === 'present').length
  const totalDays     = (attendance ?? []).length
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  const totalPaid     = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount_paid), 0)
  const totalPending  = (payments ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_paid), 0)

  return (
    <ParentDashboardClient
      childName={childName}
      relation={parent.relation}
      admissionNo={admissionNo}
      rollNo={rollNo}
      className={className}
      sectionName={sectionName}
      attendancePct={attendancePct}
      presentDays={presentDays}
      totalDays={totalDays}
      results={(results ?? []) as Parameters<typeof ParentDashboardClient>[0]['results']}
      payments={(payments ?? []) as Parameters<typeof ParentDashboardClient>[0]['payments']}
      totalPaid={totalPaid}
      totalPending={totalPending}
      announcements={announcements ?? []}
    />
  )
}
