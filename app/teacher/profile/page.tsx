import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePage } from '@/components/shared/ProfilePage'
import { type Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'My Profile' }

export default async function TeacherProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
  if (!profile) redirect('/login')
  return <ProfilePage profile={profile as Profile} />
}
