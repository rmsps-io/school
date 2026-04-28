import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePage } from '@/components/shared/ProfilePage'
import { type Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ParentProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const { data: parent } = await supabase
    .from('parents').select('relation, occupation').eq('profile_id', user.id).single()
  return (
    <ProfilePage
      profile={profile as Profile}
      useRequestFlow={true}
      extraDetail1={parent ? `Relation: ${parent.relation}` : undefined}
      extraDetail2={parent?.occupation ?? undefined}
    />
  )
}
