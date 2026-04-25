import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient, type RecentStudent } from '@/components/admin/AdminDashboardClient'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalClasses },
    { count: presentToday },
    { data: payments },
    { count: announcements },
    { data: recentStudents },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*',  { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
    supabase.from('payments').select('amount_paid, status'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('students')
      .select('id, admission_no, admission_date, profiles(full_name), sections(name, classes(name))')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount_paid), 0)
  const pendingFees  = (payments ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_paid), 0)

  const stats = {
    totalStudents: totalStudents ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalClasses:  totalClasses  ?? 0,
    presentToday:  presentToday  ?? 0,
    totalRevenue,
    pendingFees,
    activeAnnouncements: announcements ?? 0,
  }

  return (
    <AdminDashboardClient
      stats={stats}
      recentStudents={(recentStudents ?? []) as unknown as RecentStudent[]}
    />
  )
}
