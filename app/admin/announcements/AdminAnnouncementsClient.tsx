'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Megaphone, Plus, Trash2, Eye, EyeOff, Loader2, X } from 'lucide-react'

type Ann = {
  id: string; title: string; content: string; type: string
  target_role: string | null; is_published: boolean; created_at: string
  profiles: { full_name: string } | null
}

const TYPE_COLORS: Record<string, string> = {
  urgent: 'destructive', exam: 'warning', holiday: 'secondary',
  general: 'default', event: 'default', fee: 'warning',
}

export function AdminAnnouncementsClient({ announcements: init, adminId }: { announcements: Ann[]; adminId: string }) {
  const [list, setList]       = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]  = useState<string | null>(null)
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState<string | null>(null)
  const supabase = createClient()

  // Form state
  const [title, setTitle]           = useState('')
  const [content, setContent]       = useState('')
  const [type, setType]             = useState('general')
  const [targetRole, setTargetRole] = useState('all')
  const [isPublished, setIsPublished] = useState(true)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setError('Title aur content required hai.'); return }
    setSaving(true); setError(null)
    const { data, error: err } = await supabase.from('announcements').insert({
      title: title.trim(), content: content.trim(), type, target_role: targetRole,
      is_published: isPublished, published_at: isPublished ? new Date().toISOString() : null,
      created_by: adminId,
    }).select('id, title, content, type, target_role, is_published, created_at, profiles(full_name)').single()

    if (err) { setError(err.message) }
    else if (data) {
      setList(l => [data as Ann, ...l])
      setTitle(''); setContent(''); setType('general'); setTargetRole('all'); setIsPublished(true)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function togglePublish(id: string, current: boolean) {
    setLoading(id)
    await supabase.from('announcements').update({ is_published: !current }).eq('id', id)
    setList(l => l.map(a => a.id === id ? { ...a, is_published: !current } : a))
    setLoading(null)
  }

  async function deleteAnn(id: string) {
    if (!confirm('Are you sure? This cannot be undone.')) return
    setLoading(id + '_del')
    await supabase.from('announcements').delete().eq('id', id)
    setList(l => l.filter(a => a.id !== id))
    setLoading(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Announcements</h2>
            <p className="text-sm text-muted-foreground">{list.length} total</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(s => !s)} size="sm">
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="ann-title">Title *</Label>
                <Input id="ann-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Sports Day" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-content">Content *</Label>
                <Textarea id="ann-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Announcement details..." required className="min-h-[100px]" />
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
                    <option value="fee">Fee</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Select value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                    <option value="all">All</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="parent">Parents</option>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="publish-now" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded" />
                <Label htmlFor="publish-now" className="cursor-pointer">Abhi publish karo</Label>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Create Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Koi announcement nahi hai. Upar se banao.</p>
        ) : list.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-sm">{a.title}</h3>
                    <Badge variant={(TYPE_COLORS[a.type] as 'default') ?? 'default'} className="text-[10px] capitalize">{a.type}</Badge>
                    <Badge variant={a.is_published ? 'success' : 'secondary'} className="text-[10px]">
                      {a.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>For: {a.target_role ?? 'All'}</span>
                    <span>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title={a.is_published ? 'Unpublish' : 'Publish'}
                    disabled={loading === a.id} onClick={() => togglePublish(a.id, a.is_published)}>
                    {loading === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : a.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={loading === a.id + '_del'} onClick={() => deleteAnn(a.id)}>
                    {loading === a.id + '_del' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
