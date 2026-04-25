import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { TEACHER_NAV } from '@/lib/nav-items'
import { type Profile } from '@/lib/types'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')

  if ((profile.roles as { name: string })?.name !== 'teacher') {
    redirect(`/${(profile.roles as { name: string })?.name ?? 'login'}`)
  }

  if (!profile.is_active) redirect('/login')

  return (
    <DashboardShell
      navItems={TEACHER_NAV}
      profile={profile as Profile}
      pageTitle="Teacher Panel"
    >
      {children}
    </DashboardShell>
  )
}
