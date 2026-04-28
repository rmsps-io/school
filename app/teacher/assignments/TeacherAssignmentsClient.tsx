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
import { ClipboardList, Plus, X, Loader2, Trash2 } from 'lucide-react'

type Assignment = {
  id: string; title: string; description: string | null; due_date: string
  max_marks: number; is_active: boolean; created_at: string
  subjects: { name: string } | null; sections: { name: string; classes: { name: string } | null } | null
}
type TeacherSubject = {
  subject_id: string; section_id: string
  subjects: { id: string; name: string } | null
  sections: { id: string; name: string; classes: { name: string } | null } | null
}

export function TeacherAssignmentsClient({ assignments: init, teacherSubjects, teacherId }: {
  assignments: Assignment[]; teacherSubjects: TeacherSubject[]; teacherId: string | null
}) {
  const [list, setList]       = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const supabase = createClient()

  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [maxMarks, setMaxMarks] = useState('100')

  // Available unique combinations
  const subjectOptions = Array.from(new Map(
    teacherSubjects.filter(ts => ts.subjects).map(ts => [ts.subject_id, ts.subjects!])
  ).entries()).map(([id, sub]) => ({ id, name: sub.name }))

  const sectionOptions = teacherSubjects
    .filter(ts => ts.section_id && ts.sections)
    .filter(ts => !subjectId || ts.subject_id === subjectId)
    .map(ts => ({
      id: ts.section_id,
      label: `Class ${ts.sections?.classes?.name ?? '—'} — Section ${ts.sections?.name}`,
    }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !subjectId || !sectionId || !dueDate) { setError('Saare required fields fill karo.'); return }
    if (!teacherId) { setError('Teacher profile nahi mila.'); return }
    setSaving(true); setError(null)

    const { data, error: err } = await supabase.from('assignments').insert({
      title: title.trim(), description: desc.trim() || null,
      subject_id: subjectId, section_id: sectionId, teacher_id: teacherId,
      due_date: new Date(dueDate).toISOString(), max_marks: parseInt(maxMarks) || 100,
    }).select('id, title, description, due_date, max_marks, is_active, created_at, subjects(name), sections(name, classes(name))').single()

    if (err) { setError(err.message) }
    else if (data) {
      setList(l => [data as Assignment, ...l])
      setTitle(''); setDesc(''); setSubjectId(''); setSectionId(''); setDueDate(''); setMaxMarks('100')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function deleteAssignment(id: string) {
    if (!confirm('Delete this assignment?')) return
    setDeleting(id)
    await supabase.from('assignments').delete().eq('id', id)
    setList(l => l.filter(a => a.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Assignments</h2>
            <p className="text-sm text-muted-foreground">{list.length} total</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'New Assignment'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3"><CardTitle className="text-base">Create Assignment</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Exercise" required />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Assignment details..." className="min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Select value={subjectId} onChange={e => { setSubjectId(e.target.value); setSectionId('') }} required>
                    <option value="">Select subject</option>
                    {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Section *</Label>
                  <Select value={sectionId} onChange={e => setSectionId(e.target.value)} required disabled={!subjectId}>
                    <option value="">Select section</option>
                    {sectionOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date *</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Marks</Label>
                  <Input type="number" min="1" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Koi assignment nahi hai. Upar se banao.</p>
        ) : list.map(a => {
          const isOverdue = new Date(a.due_date) < new Date()
          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-sm">{a.title}</h3>
                      <Badge variant={isOverdue ? 'destructive' : 'success'} className="text-[10px]">
                        {isOverdue ? 'Overdue' : 'Active'}
                      </Badge>
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{a.description}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{(a.subjects as any)?.name ?? '—'}</span>
                      <span>Class {(a.sections as any)?.classes?.name ?? '—'}-{(a.sections as any)?.name ?? '—'}</span>
                      <span>Due: {new Date(a.due_date).toLocaleDateString('en-IN')}</span>
                      <span>Max: {a.max_marks}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    disabled={deleting === a.id} onClick={() => deleteAssignment(a.id)}>
                    {deleting === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
