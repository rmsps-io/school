import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TeacherResultsClient } from './TeacherResultsClient'

export const metadata: Metadata = { title: 'Enter Results' }

export default async function TeacherResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()
  const teacherId = (teacher as { id: string } | null)?.id ?? null

  const [{ data: exams }, { data: teacherSubjects }] = await Promise.all([
    supabase.from('exams').select('id, name, exam_type, start_date, end_date, classes(id, name)').eq('is_published', true).order('start_date', { ascending: false }),
    supabase.from('teacher_subjects')
      .select('subject_id, section_id, subjects(id, name, full_marks, pass_marks), sections(id, name, classes(id, name))')
      .eq('teacher_id', teacherId ?? ''),
  ])

  return <TeacherResultsClient exams={exams ?? []} teacherSubjects={teacherSubjects ?? []} teacherId={teacherId} />
}
