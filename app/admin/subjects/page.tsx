import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminSubjectsClient } from './AdminSubjectsClient'

export const metadata: Metadata = { title: 'Subjects' }

export default async function AdminSubjectsPage() {
  const supabase = createClient()
  const [{ data: subjects }, { data: classes }] = await Promise.all([
    supabase.from('subjects').select('id, name, code, class_id, full_marks, pass_marks, classes(name)').order('name'),
    supabase.from('classes').select('id, name, numeric_val').order('numeric_val'),
  ])
  return <AdminSubjectsClient subjects={subjects ?? []} classes={classes ?? []} />
}
