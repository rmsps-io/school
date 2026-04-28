import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePage } from '@/components/shared/ProfilePage'
import { type Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'My Profile' }

export default async function StudentProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, roles(name)').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const { data: student } = await supabase
    .from('students')
    .select('admission_no, roll_no, academic_year, sections(name, classes(name))')
    .eq('profile_id', user.id).single()
  const sec = (student as any)?.sections
  const cls = sec?.classes?.name ?? sec?.classes?.[0]?.name ?? '—'
  return (
    <ProfilePage
      profile={profile as Profile}
      useRequestFlow={true}
      extraDetail1={student ? `Admission: ${student.admission_no}` : undefined}
      extraDetail2={student ? `Class ${cls} - Section ${sec?.name ?? '—'}` : undefined}
      extraDetail3={student ? `Academic Year: ${student.academic_year}` : undefined}
    />
  )
}
