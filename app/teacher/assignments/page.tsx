import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TeacherAssignmentsClient } from './TeacherAssignmentsClient'

export const metadata: Metadata = { title: 'Assignments' }

export default async function TeacherAssignmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()
  const teacherId = (teacher as { id: string } | null)?.id ?? null

  const [{ data: assignments }, { data: teacherSubjects }] = await Promise.all([
    supabase.from('assignments')
      .select('id, title, description, due_date, max_marks, is_active, created_at, subjects(name), sections(name, classes(name))')
      .eq('teacher_id', teacherId ?? '')
      .order('created_at', { ascending: false }),
    supabase.from('teacher_subjects')
      .select('subject_id, section_id, subjects(id, name), sections(id, name, classes(name))')
      .eq('teacher_id', teacherId ?? ''),
  ])

  return <TeacherAssignmentsClient assignments={assignments ?? []} teacherSubjects={teacherSubjects ?? []} teacherId={teacherId} />
}
