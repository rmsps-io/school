import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ADMIN_NAV } from '@/lib/nav-items'
import { type Profile } from '@/lib/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // 1. Verify session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Fetch profile with role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')

  // 3. Guard: only admin can access /admin/*
  if ((profile.roles as { name: string })?.name !== 'admin') {
    redirect(`/${(profile.roles as { name: string })?.name ?? 'login'}`)
  }

  // 4. Guard: inactive account
  if (!profile.is_active) redirect('/login')

  return (
    <DashboardShell
      navItems={ADMIN_NAV}
      profile={profile as Profile}
      pageTitle="Admin Panel"
    >
      {children}
    </DashboardShell>
  )
}
