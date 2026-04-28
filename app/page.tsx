import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RMSPS — Residential Maa Saraswati Public School',
  description: 'School Management System — Kating Chowk, Supaul, Bihar',
}

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('roles(name)').eq('id', user.id).single()
    const role = (profile?.roles as { name: string } | null)?.name ?? 'student'
    redirect(`/${role}`)
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f2167] via-[#1a3a8f] to-[#0f2167] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white font-mono">R</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RMSPS</h1>
            <p className="text-sm text-white/60 mt-0.5">Residential Maa Saraswati Public School</p>
            <p className="text-xs text-white/40 mt-0.5">Kating Chowk, Supaul, Bihar</p>
          </div>
        </div>
        <div className="h-px w-full bg-white/10" />
        <div className="grid grid-cols-2 gap-2 text-left">
          {[
            { icon: '📋', label: 'Attendance' },
            { icon: '📊', label: 'Results & Grades' },
            { icon: '💰', label: 'Fee Management' },
            { icon: '📢', label: 'Announcements' },
            { icon: '📅', label: 'Timetable' },
            { icon: '💬', label: 'Live Chat' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-base">{icon}</span>
              <span className="text-xs text-white/70">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/login" className="block w-full rounded-xl bg-amber-500 hover:bg-amber-400 transition-colors py-3 text-sm font-semibold text-white shadow-lg">
            Login →
          </Link>
          <Link href="/register" className="block w-full rounded-xl bg-white/10 hover:bg-white/20 transition-colors py-3 text-sm font-semibold text-white">
            Student Registration
          </Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-white/25">© {new Date().getFullYear()} RMSPS • Supaul, Bihar</p>
    </main>
  )
}
