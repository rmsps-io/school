import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminClassesClient } from './AdminClassesClient'

export const metadata: Metadata = { title: 'Classes & Sections' }

export default async function AdminClassesPage() {
  const supabase = createClient()
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, numeric_val, sections(id, name, capacity)')
    .order('numeric_val')
  return <AdminClassesClient classes={classes ?? []} />
}
