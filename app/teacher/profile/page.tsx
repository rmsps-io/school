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
  const { data: teacher } = await supabase
    .from('teachers').select('employee_id, qualification, experience_yrs, joining_date').eq('profile_id', user.id).single()
  return (
    <ProfilePage
      profile={profile as Profile}
      useRequestFlow={true}
      extraDetail1={teacher ? `Employee ID: ${teacher.employee_id}` : undefined}
      extraDetail2={teacher?.qualification ?? undefined}
      extraDetail3={teacher ? `Exp: ${teacher.experience_yrs} yrs` : undefined}
    />
  )
}
