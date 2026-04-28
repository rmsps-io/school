import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminExamsClient } from './AdminExamsClient'

export const metadata: Metadata = { title: 'Exams' }

export default async function AdminExamsPage() {
  const supabase = createClient()
  const [{ data: exams }, { data: classes }] = await Promise.all([
    supabase.from('exams').select('id, name, exam_type, class_id, start_date, end_date, academic_year, is_published, classes(name)').order('start_date', { ascending: false }),
    supabase.from('classes').select('id, name, numeric_val').order('numeric_val'),
  ])
  return <AdminExamsClient exams={exams ?? []} classes={classes ?? []} />
}
