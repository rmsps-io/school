'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Plus, X, Loader2, Send } from 'lucide-react'

type Published = { id: string; title: string; content: string; type: string; target_role: string | null; created_at: string; profiles: { full_name: string } | null }
type MyReq = { id: string; title: string; content: string; type: string; target_role: string | null; status: string; created_at: string }

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'default', approved: 'success', rejected: 'destructive',
}

export function TeacherAnnouncementsClient({ published, myRequests: initReqs, userId }: {
  published: Published[]; myRequests: MyReq[]; userId: string
}) {
  const [tab, setTab]         = useState<'view' | 'request'>('view')
  const [reqs, setReqs]       = useState(initReqs)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const [title, setTitle]           = useState('')
  const [content, setContent]       = useState('')
  const [type, setType]             = useState('general')
  const [targetRole, setTargetRole] = useState('all')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setError('Title aur content required hai.'); return }
    setSaving(true); setError(null)

    const { data, error: err } = await supabase.from('announcement_requests').insert({
      title: title.trim(), content: content.trim(), type, target_role: targetRole, requested_by: userId,
    }).select('id, title, content, type, target_role, status, created_at').single()

    if (err) { setError(err.message) }
    else if (data) {
      setReqs(r => [data as MyReq, ...r])
      setTitle(''); setContent(''); setType('general'); setTargetRole('all')
      setShowForm(false); setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Announcements</h2>
          <p className="text-sm text-muted-foreground">Published announcements aur apni requests dekho</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <Send className="h-4 w-4" /> Request submit ho gayi! Admin approve karega.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: 'view' as const, label: `Published (${published.length})` },
          { key: 'request' as const, label: `My Requests (${reqs.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Published */}
      {tab === 'view' && (
        <div className="space-y-3">
          {published.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Koi published announcement nahi hai.</p>
          ) : published.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{a.title}</h3>
                  <Badge className="text-[10px] capitalize shrink-0">{a.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{a.content}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>By: {a.profiles?.full_name ?? 'Admin'}</span>
                  <span>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* My Requests */}
      {tab === 'request' && (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setShowForm(s => !s)}>
            {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showForm ? 'Cancel' : 'Request New Announcement'}
          </Button>

          {showForm && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3"><CardTitle className="text-base">New Announcement Request</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Content *</Label>
                    <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content..." required className="min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select value={type} onChange={e => setType(e.target.value)}>
                        <option value="general">General</option>
                        <option value="exam">Exam</option>
                        <option value="holiday">Holiday</option>
                        <option value="event">Event</option>
                        <option value="urgent">Urgent</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target</Label>
                      <Select value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                        <option value="all">All</option>
                        <option value="student">Students</option>
                        <option value="parent">Parents</option>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} size="sm">
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <><Send className="h-4 w-4 mr-2" />Submit Request</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {reqs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Koi request submit nahi ki.</p>
            ) : reqs.map(r => (
              <Card key={r.id} className={r.status !== 'pending' ? 'opacity-70' : ''}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm">{r.title}</h3>
                    <Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'} className="capitalize text-[10px] shrink-0">{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
