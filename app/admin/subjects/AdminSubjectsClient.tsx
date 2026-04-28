'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BookOpen, Plus, Trash2, X, Loader2 } from 'lucide-react'

type Subject = { id: string; name: string; code: string; class_id: string; full_marks: number; pass_marks: number; classes: { name: string } | null }
type Class   = { id: string; name: string; numeric_val: number }

export function AdminSubjectsClient({ subjects: init, classes }: { subjects: Subject[]; classes: Class[] }) {
  const [subjects, setSubjects] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const supabase = createClient()

  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [classId, setClassId] = useState('')
  const [full, setFull]       = useState('100')
  const [pass, setPass]       = useState('33')
  const [filter, setFilter]   = useState('')

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !classId) { flash('❌ Saare required fields fill karo.'); return }
    setLoading('add')
    const { data, error } = await supabase.from('subjects').insert({
      name: name.trim(), code: code.trim().toUpperCase(), class_id: classId,
      full_marks: parseInt(full) || 100, pass_marks: parseInt(pass) || 33,
    }).select('id, name, code, class_id, full_marks, pass_marks, classes(name)').single()

    if (error) { flash('❌ ' + error.message) }
    else {
      setSubjects(s => [...s, data as Subject].sort((a, b) => a.name.localeCompare(b.name)))
      setName(''); setCode(''); setClassId(''); setFull('100'); setPass('33')
      setShowForm(false); flash('✅ Subject added!')
    }
    setLoading(null)
  }

  async function deleteSubject(id: string) {
    if (!confirm('Delete this subject?')) return
    setLoading(id)
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(s => s.filter(x => x.id !== id))
    setLoading(null)
  }

  const filtered = subjects.filter(s =>
    !filter || s.class_id === filter
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Subjects</h2>
            <p className="text-sm text-muted-foreground">{subjects.length} subjects</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'Add Subject'}
        </Button>
      </div>

      {msg && <p className="text-sm rounded px-3 py-2 bg-muted/40">{msg}</p>}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Code *</Label>
                  <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. MATH" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <Select value={classId} onChange={e => setClassId(e.target.value)} required>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-1" />
                <div className="space-y-1.5">
                  <Label>Full Marks</Label>
                  <Input type="number" value={full} onChange={e => setFull(e.target.value)} min="1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pass Marks</Label>
                  <Input type="number" value={pass} onChange={e => setPass(e.target.value)} min="1" />
                </div>
              </div>
              <Button type="submit" disabled={loading === 'add'} size="sm">
                {loading === 'add' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add Subject'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter by class */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>All</button>
        {classes.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Class {c.name}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Full / Pass</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Koi subject nahi.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">Class {(s.classes as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.full_marks} / {s.pass_marks}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" disabled={loading === s.id} onClick={() => deleteSubject(s.id)}>
                      {loading === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
