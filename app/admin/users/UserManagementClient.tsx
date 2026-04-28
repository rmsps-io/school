'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Role = { id: string; name: string }
type Profile = {
  id: string; full_name: string | null; email: string | null
  phone: string | null; is_active: boolean; created_at: string
  roles: { id: string; name: string } | null
}

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent',
  teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent',
  student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent',
  parent:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent',
}

export function UserManagementClient({ profiles: init, roles }: { profiles: Profile[]; roles: Role[] }) {
  const [profiles, setProfiles] = useState(init)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  function flash(type: 'success' | 'error', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  async function changeRole(profileId: string, roleId: string) {
    setLoadingId(profileId)
    const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', profileId)
    if (error) { flash('error', 'Role change failed: ' + error.message) }
    else {
      const roleName = roles.find(r => r.id === roleId)?.name ?? ''
      setProfiles(p => p.map(x => x.id === profileId ? { ...x, roles: { id: roleId, name: roleName } } : x))
      flash('success', `Role changed to "${roleName}" successfully!`)
    }
    setLoadingId(null)
  }

  async function toggleActive(profileId: string, current: boolean) {
    setLoadingId(profileId + '_a')
    const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', profileId)
    if (error) { flash('error', 'Status change failed.') }
    else {
      setProfiles(p => p.map(x => x.id === profileId ? { ...x, is_active: !current } : x))
      flash('success', `Account ${!current ? 'activated' : 'deactivated'}!`)
    }
    setLoadingId(null)
  }

  const filtered = profiles.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = !search || p.full_name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s)
    const matchRole = filterRole === 'all' || p.roles?.name === filterRole || (filterRole === 'none' && !p.roles)
    return matchSearch && matchRole
  })

  const counts = {
    all: profiles.length,
    admin: profiles.filter(p => p.roles?.name === 'admin').length,
    teacher: profiles.filter(p => p.roles?.name === 'teacher').length,
    student: profiles.filter(p => p.roles?.name === 'student').length,
    parent: profiles.filter(p => p.roles?.name === 'parent').length,
    none: profiles.filter(p => !p.roles).length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Role aur status directly yahan se change karo</p>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { k: 'all', l: `All (${counts.all})` },
          { k: 'admin', l: `Admin (${counts.admin})` },
          { k: 'teacher', l: `Teacher (${counts.teacher})` },
          { k: 'student', l: `Student (${counts.student})` },
          { k: 'parent', l: `Parent (${counts.parent})` },
          ...(counts.none > 0 ? [{ k: 'none', l: `No Role (${counts.none})` }] : []),
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setFilterRole(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterRole === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Naam ya email se search..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role Change</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">Koi user nahi mila</td></tr>
                ) : filtered.map(p => {
                  const busy = loadingId === p.id || loadingId === p.id + '_a'
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(p.full_name ?? p.email ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{p.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {loadingId === p.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          <select value={p.roles?.id ?? ''} disabled={busy}
                            onChange={e => changeRole(p.id, e.target.value)}
                            className={`text-xs rounded-lg border px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer ${p.roles?.name ? ROLE_COLORS[p.roles.name] : 'border-input bg-background text-muted-foreground'}`}>
                            <option value="" disabled>— Role choose karo —</option>
                            {roles.map(r => (
                              <option key={r.id} value={r.id} className="bg-background text-foreground capitalize">{r.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button disabled={busy} onClick={() => toggleActive(p.id, p.is_active)}
                          className="flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                          {loadingId === p.id + '_a'
                            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            : p.is_active
                              ? <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span></>
                              : <><XCircle className="h-4 w-4 text-red-400" /><span className="text-xs text-red-500 dark:text-red-400 font-medium">Inactive</span></>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">💡 Role change ke baad user ko logout karke wapas login karna hoga.</p>
    </div>
  )
}
