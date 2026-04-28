import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { UserManagementClient } from './UserManagementClient'

export const metadata: Metadata = { title: 'User Management' }

export default async function AdminUsersPage() {
  const supabase = createClient()
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, is_active, created_at, roles(id, name)')
      .order('created_at', { ascending: false }),
    supabase.from('roles').select('id, name').order('name'),
  ])

  return <UserManagementClient profiles={profiles ?? []} roles={roles ?? []} />
}
