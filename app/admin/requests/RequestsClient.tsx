'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardList, CheckCircle, XCircle, Loader2, User, Megaphone, UserCog } from 'lucide-react'

type RegReq = {
  id: string; full_name: string; email: string; phone: string | null
  gender: string | null; date_of_birth: string | null; class_requested: string
  address: string | null; guardian_name: string | null; guardian_phone: string | null
  guardian_relation: string | null; status: string; created_at: string
}
type AnnReq = {
  id: string; title: string; content: string; type: string
  target_role: string | null; status: string; created_at: string
  profiles: { full_name: string; email: string } | null
}
type ProfileReq = {
  id: string; field_name: string; old_value: string | null; new_value: string
  status: string; created_at: string
  profiles: { full_name: string; email: string } | null
}

const STATUS_BADGE: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'default', approved: 'success', rejected: 'destructive',
}

export function RequestsClient({ regRequests, annRequests, profileRequests }: {
  regRequests: RegReq[]; annRequests: AnnReq[]; profileRequests: ProfileReq[]
}) {
  const [tab, setTab] = useState<'reg' | 'ann' | 'profile'>('reg')
  const [reg, setReg]     = useState(regRequests)
  const [ann, setAnn]     = useState(annRequests)
  const [prof, setProf]   = useState(profileRequests)
  const [loading, setLoading]   = useState<string | null>(null)
  const [rejReason, setRejReason] = useState<Record<string, string>>({})
  const [showRej, setShowRej]     = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  function flash(type: 'success' | 'error', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  // ── Registration requests ────────────────────────────────────
  async function approveReg(req: RegReq) {
    setLoading(req.id)
    // 1. Get student role
    const { data: role } = await supabase.from('roles').select('id').eq('name', 'student').single()
    if (!role) { flash('error', 'Student role not found'); setLoading(null); return }

    // 2. Create auth user via admin — we just update status; actual account created separately
    const { error } = await supabase
      .from('registration_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', req.id)

    if (error) { flash('error', error.message) }
    else {
      setReg(r => r.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
      flash('success', `${req.full_name} ki registration approved! Ab Admin > Add Student se account banao.`)
    }
    setLoading(null)
  }

  async function rejectReg(id: string) {
    setLoading(id)
    const reason = rejReason[id] ?? ''
    const { error } = await supabase
      .from('registration_requests')
      .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { flash('error', error.message) }
    else {
      setReg(r => r.map(x => x.id === id ? { ...x, status: 'rejected' } : x))
      setShowRej(null)
      flash('success', 'Request rejected.')
    }
    setLoading(null)
  }

  // ── Announcement requests ────────────────────────────────────
  async function approveAnn(req: AnnReq) {
    setLoading(req.id)
    const { data: { user } } = await supabase.auth.getUser()
    // Create the actual announcement
    const { error: annErr } = await supabase.from('announcements').insert({
      title: req.title, content: req.content, type: req.type as 'general',
      target_role: req.target_role, is_published: true,
      published_at: new Date().toISOString(), created_by: user!.id,
    })
    if (annErr) { flash('error', annErr.message); setLoading(null); return }

    await supabase.from('announcement_requests')
      .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.id)

    setAnn(a => a.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
    flash('success', 'Announcement approved aur publish ho gayi!')
    setLoading(null)
  }

  async function rejectAnn(id: string) {
    setLoading(id)
    const { data: { user } } = await supabase.auth.getUser()
    const reason = rejReason[id] ?? ''
    await supabase.from('announcement_requests')
      .update({ status: 'rejected', rejection_reason: reason, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setAnn(a => a.map(x => x.id === id ? { ...x, status: 'rejected' } : x))
    setShowRej(null)
    flash('success', 'Request rejected.')
    setLoading(null)
  }

  // ── Profile update requests ──────────────────────────────────
  async function approveProfile(req: ProfileReq) {
    setLoading(req.id)
    const { data: { user } } = await supabase.auth.getUser()
    const profileId = req.profiles ? (req as any).profile_id : null

    // Get profile_id from the join
    const { data: reqData } = await supabase
      .from('profile_update_requests').select('profile_id').eq('id', req.id).single()

    if (reqData) {
      const updateObj: Record<string, string> = { [req.field_name]: req.new_value }
      await supabase.from('profiles').update(updateObj).eq('id', (reqData as any).profile_id)
    }
    await supabase.from('profile_update_requests')
      .update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.id)
    setProf(p => p.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
    flash('success', 'Profile update approved!')
    setLoading(null)
  }

  async function rejectProfile(id: string) {
    setLoading(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profile_update_requests')
      .update({ status: 'rejected', rejection_reason: rejReason[id] ?? '', reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setProf(p => p.map(x => x.id === id ? { ...x, status: 'rejected' } : x))
    setShowRej(null)
    flash('success', 'Request rejected.')
    setLoading(null)
  }

  const pendingReg  = reg.filter(r => r.status === 'pending').length
  const pendingAnn  = ann.filter(a => a.status === 'pending').length
  const pendingProf = prof.filter(p => p.status === 'pending').length

  const tabs = [
    { key: 'reg' as const,     label: 'Registrations', icon: User,     count: pendingReg  },
    { key: 'ann' as const,     label: 'Announcements', icon: Megaphone, count: pendingAnn  },
    { key: 'profile' as const, label: 'Profile Updates',icon: UserCog,  count: pendingProf },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Pending Requests</h2>
          <p className="text-sm text-muted-foreground">Saari requests ek jagah — approve ya reject karo</p>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
          {msg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5">{count}</span>}
          </button>
        ))}
      </div>

      {/* Registration Requests */}
      {tab === 'reg' && (
        <div className="space-y-3">
          {reg.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Koi registration request nahi hai</p>
          ) : reg.map(r => (
            <Card key={r.id} className={r.status !== 'pending' ? 'opacity-60' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.email} {r.phone && `• ${r.phone}`}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[r.status] ?? 'secondary'} className="capitalize shrink-0">{r.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span><b>Class:</b> {r.class_requested}</span>
                  <span><b>Gender:</b> {r.gender ?? '—'}</span>
                  <span><b>DOB:</b> {r.date_of_birth ?? '—'}</span>
                  <span><b>Guardian:</b> {r.guardian_name ?? '—'} ({r.guardian_relation ?? '—'})</span>
                  {r.address && <span className="col-span-2"><b>Address:</b> {r.address}</span>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => approveReg(r)} disabled={loading === r.id}>
                      {loading === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Approve
                    </Button>
                    {showRej === r.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea placeholder="Rejection reason (optional)" value={rejReason[r.id] ?? ''} onChange={e => setRejReason(prev => ({ ...prev, [r.id]: e.target.value }))} className="text-xs h-16" />
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => rejectReg(r.id)} disabled={loading === r.id}>Confirm Reject</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowRej(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setShowRej(r.id)}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Announcement Requests */}
      {tab === 'ann' && (
        <div className="space-y-3">
          {ann.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Koi announcement request nahi hai</p>
          ) : ann.map(a => (
            <Card key={a.id} className={a.status !== 'pending' ? 'opacity-60' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">By: {a.profiles?.full_name ?? '—'} • Type: {a.type} • For: {a.target_role ?? 'All'}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[a.status] ?? 'secondary'} className="capitalize shrink-0">{a.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 rounded p-2">{a.content}</p>
                {a.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => approveAnn(a)} disabled={loading === a.id}>
                      {loading === a.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Approve & Publish
                    </Button>
                    {showRej === a.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea placeholder="Rejection reason" value={rejReason[a.id] ?? ''} onChange={e => setRejReason(prev => ({ ...prev, [a.id]: e.target.value }))} className="text-xs h-16" />
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => rejectAnn(a.id)} disabled={loading === a.id}>Confirm Reject</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowRej(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setShowRej(a.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Update Requests */}
      {tab === 'profile' && (
        <div className="space-y-3">
          {prof.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Koi profile update request nahi hai</p>
          ) : prof.map(p => (
            <Card key={p.id} className={p.status !== 'pending' ? 'opacity-60' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{p.profiles?.email}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[p.status] ?? 'secondary'} className="capitalize shrink-0">{p.status}</Badge>
                </div>
                <div className="text-xs space-y-1 bg-muted/30 rounded p-2">
                  <p><b>Field:</b> {p.field_name}</p>
                  <p><b>Old Value:</b> {p.old_value ?? '—'}</p>
                  <p><b>New Value:</b> <span className="text-primary font-medium">{p.new_value}</span></p>
                </div>
                {p.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => approveProfile(p)} disabled={loading === p.id}>
                      {loading === p.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Approve
                    </Button>
                    {showRej === p.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea placeholder="Rejection reason" value={rejReason[p.id] ?? ''} onChange={e => setRejReason(prev => ({ ...prev, [p.id]: e.target.value }))} className="text-xs h-16" />
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => rejectProfile(p.id)} disabled={loading === p.id}>Confirm Reject</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowRej(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setShowRej(p.id)}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
