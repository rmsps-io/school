import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminAnnouncementsClient } from './AdminAnnouncementsClient'

export const metadata: Metadata = { title: 'Announcements' }

export default async function AdminAnnouncementsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, type, target_role, is_published, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  return <AdminAnnouncementsClient announcements={announcements ?? []} adminId={user!.id} />
}
