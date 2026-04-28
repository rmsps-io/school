import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MessagesClient } from '@/components/shared/MessagesClient'

export const metadata: Metadata = { title: 'Messages' }

export default async function StudentMessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: contacts } = await supabase
    .from('profiles')
    .select('id, full_name, email, roles(name)')
    .neq('id', user!.id)
    .eq('is_active', true)
    .in('roles.name' as any, ['teacher', 'admin'])
    .order('full_name')
  return <MessagesClient currentUserId={user!.id} contacts={(contacts ?? []) as any} />
}
