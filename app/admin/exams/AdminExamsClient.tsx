'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Plus, Trash2, X, Loader2, Eye, EyeOff } from 'lucide-react'

type Exam  = { id: string; name: string; exam_type: string; class_id: string; start_date: string; end_date: string; academic_year: string; is_published: boolean; classes: { name: string } | null }
type Class = { id: string; name: string; numeric_val: number }

const EXAM_TYPES = [
  { value: 'unit_test',   label: 'Unit Test'    },
  { value: 'half_yearly', label: 'Half Yearly'  },
  { value: 'annual',      label: 'Annual'       },
  { value: 'pre_board',   label: 'Pre Board'    },
  { value: 'other',       label: 'Other'        },
]

export function AdminExamsClient({ exams: init, classes }: { exams: Exam[]; classes: Class[] }) {
  const [exams, setExams]     = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const supabase = createClient()

  const [name, setName]           = useState('')
  const [examType, setExamType]   = useState('unit_test')
  const [classId, setClassId]     = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [year, setYear]           = useState(new Date().getFullYear().toString())

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !classId || !startDate || !endDate) { flash('❌ Saare required fields fill karo.'); return }
    setLoading('add')
    const { data, error } = await supabase.from('exams').insert({
      name: name.trim(), exam_type: examType, class_id: classId,
      start_date: startDate, end_date: endDate, academic_year: year, is_published: false,
    }).select('id, name, exam_type, class_id, start_date, end_date, academic_year, is_published, classes(name)').single()

    if (error) { flash('❌ ' + error.message) }
    else {
      setExams(e => [data as Exam, ...e])
      setName(''); setClassId(''); setStartDate(''); setEndDate('')
      setShowForm(false); flash('✅ Exam added!')
    }
    setLoading(null)
  }

  async function togglePublish(id: string, current: boolean) {
    setLoading(id)
    await supabase.from('exams').update({ is_published: !current }).eq('id', id)
    setExams(e => e.map(x => x.id === id ? { ...x, is_published: !current } : x))
    setLoading(null)
  }

  async function deleteExam(id: string) {
    if (!confirm('Delete this exam? All results linked to it will also be affected.')) return
    setLoading(id + '_del')
    await supabase.from('exams').delete().eq('id', id)
    setExams(e => e.filter(x => x.id !== id))
    setLoading(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Exams</h2>
            <p className="text-sm text-muted-foreground">{exams.length} exams</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'Add Exam'}
        </Button>
      </div>

      {msg && <p className="text-sm rounded px-3 py-2 bg-muted/40">{msg}</p>}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Exam Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Unit Test 1" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={examType} onChange={e => setExamType(e.target.value)}>
                    {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <Select value={classId} onChange={e => setClassId(e.target.value)} required>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Year</Label>
                  <Input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
                </div>
              </div>
              <Button type="submit" disabled={loading === 'add'} size="sm">
                {loading === 'add' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add Exam'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {exams.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Koi exam nahi hai. Upar se add karo.</p>
        ) : exams.map(exam => (
          <Card key={exam.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-sm">{exam.name}</h3>
                    <Badge variant="secondary" className="text-[10px] capitalize">{EXAM_TYPES.find(t => t.value === exam.exam_type)?.label ?? exam.exam_type}</Badge>
                    <Badge variant={exam.is_published ? 'success' : 'secondary'} className="text-[10px]">{exam.is_published ? 'Published' : 'Draft'}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Class {(exam.classes as any)?.name ?? '—'}</span>
                    <span>{new Date(exam.start_date).toLocaleDateString('en-IN')} – {new Date(exam.end_date).toLocaleDateString('en-IN')}</span>
                    <span>{exam.academic_year}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title={exam.is_published ? 'Unpublish' : 'Publish'}
                    disabled={loading === exam.id} onClick={() => togglePublish(exam.id, exam.is_published)}>
                    {loading === exam.id ? <Loader2 className="h-3 w-3 animate-spin" /> : exam.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={loading === exam.id + '_del'} onClick={() => deleteExam(exam.id)}>
                    {loading === exam.id + '_del' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
