import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminTimetableClient } from './AdminTimetableClient'

export const metadata: Metadata = { title: 'Timetable' }

export default async function AdminTimetablePage() {
  const supabase = createClient()
  const [{ data: timetable }, { data: sections }, { data: subjects }, { data: teachers }] = await Promise.all([
    supabase.from('timetable').select('id, section_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, sections(name, classes(name)), subjects(name), teachers(profiles(full_name))').order('day_of_week').order('period_no'),
    supabase.from('sections').select('id, name, classes(id, name)').order('name'),
    supabase.from('subjects').select('id, name, class_id').order('name'),
    supabase.from('teachers').select('id, profiles(full_name)').order('id'),
  ])
  return <AdminTimetableClient timetable={timetable ?? []} sections={sections ?? []} subjects={subjects ?? []} teachers={teachers ?? []} />
}
