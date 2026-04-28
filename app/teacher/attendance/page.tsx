import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TeacherAttendanceClient } from './TeacherAttendanceClient'

export const metadata: Metadata = { title: 'Mark Attendance' }

export default async function TeacherAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const teacherId = (teacher as { id: string } | null)?.id ?? null

  // Get sections this teacher is assigned to
  const { data: sections } = await supabase
    .from('teacher_subjects')
    .select('section_id, sections(id, name, classes(id, name))')
    .eq('teacher_id', teacherId ?? '')

  // Unique sections
  type SectionItem = { id: string; name: string; className: string; classId: string }
  const seen = new Set<string>()
  const uniqueSections: SectionItem[] = []
  for (const row of (sections ?? [])) {
    const sec = (row as any).sections
    if (sec && !seen.has(sec.id)) {
      seen.add(sec.id)
      uniqueSections.push({
        id: sec.id, name: sec.name,
        className: sec.classes?.[0]?.name ?? sec.classes?.name ?? '—',
        classId: sec.classes?.[0]?.id ?? sec.classes?.id ?? '',
      })
    }
  }

  return <TeacherAttendanceClient sections={uniqueSections} teacherId={teacherId} />
}
