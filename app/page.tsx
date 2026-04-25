import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This page is mostly handled by middleware, but as a fallback:
// Authenticated users get redirected by middleware to their dashboard.
// Unauthenticated users get redirected to /login.
export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch role and redirect (middleware handles this on most requests)
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles(name)')
    .eq('id', user.id)
    .single()

  const roleName = (profile?.roles as { name: string } | null)?.name ?? 'student'
  redirect(`/${roleName}`)
}
