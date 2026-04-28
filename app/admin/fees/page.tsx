import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminFeesClient } from './AdminFeesClient'

export const metadata: Metadata = { title: 'Fee Structure' }

export default async function AdminFeesPage() {
  const supabase = createClient()
  const [{ data: fees }, { data: classes }] = await Promise.all([
    supabase.from('fees').select('id, class_id, fee_type, amount, frequency, academic_year, description, classes(name)').order('academic_year', { ascending: false }),
    supabase.from('classes').select('id, name, numeric_val').order('numeric_val'),
  ])
  return <AdminFeesClient fees={fees ?? []} classes={classes ?? []} />
}
