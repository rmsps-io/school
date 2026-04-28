import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RequestsClient } from './RequestsClient'

export const metadata: Metadata = { title: 'Pending Requests' }

export default async function AdminRequestsPage() {
  const supabase = createClient()

  const [{ data: regReqs }, { data: annReqs }, { data: profileReqs }] = await Promise.all([
    supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('announcement_requests')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_update_requests')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <RequestsClient
      regRequests={regReqs ?? []}
      annRequests={annReqs ?? []}
      profileRequests={profileReqs ?? []}
    />
  )
}
