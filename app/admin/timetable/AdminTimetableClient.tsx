'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Calendar, Plus, Trash2, X, Loader2 } from 'lucide-react'

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type TT = {
  id: string; section_id: string; subject_id: string; teacher_id: string
  day_of_week: number; period_no: number; start_time: string; end_time: string
  sections: { name: string; classes: { name: string } | null } | null
  subjects: { name: string } | null
  teachers: { profiles: { full_name: string } | null } | null
}
type Section = { id: string; name: string; classes: { id: string; name: string } | null }
type Subject = { id: string; name: string; class_id: string }
type Teacher = { id: string; profiles: { full_name: string } | null }

export function AdminTimetableClient({ timetable: init, sections, subjects, teachers }: {
  timetable: TT[]; sections: Section[]; subjects: Subject[]; teachers: Teacher[]
}) {
  const [timetable, setTimetable] = useState(init)
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState<string | null>(null)
  const [msg, setMsg]             = useState<string | null>(null)
  const [filterSection, setFilterSection] = useState('')
  const [filterDay, setFilterDay] = useState(0)
  const supabase = createClient()

  const [sectionId, setSectionId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [day, setDay]             = useState('1')
  const [period, setPeriod]       = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime]     = useState('08:45')

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  // Filter subjects by selected section's class
  const selectedSection = sections.find(s => s.id === sectionId)
  const classId = (selectedSection?.classes as any)?.id ?? ''
  const filteredSubjects = classId ? subjects.filter(s => s.class_id === classId) : subjects

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!sectionId || !subjectId || !teacherId) { flash('❌ Section, subject aur teacher required hai.'); return }
    setLoading('add')
    const { data, error } = await supabase.from('timetable').insert({
      section_id: sectionId, subject_id: subjectId, teacher_id: teacherId,
      day_of_week: parseInt(day), period_no: parseInt(period),
      start_time: startTime, end_time: endTime,
    }).select('id, section_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, sections(name, classes(name)), subjects(name), teachers(profiles(full_name))').single()

    if (error) { flash('❌ ' + (error.code === '23505' ? 'Is slot mein already entry hai.' : error.message)) }
    else {
      setTimetable(t => [...t, data as TT])
      setShowForm(false); flash('✅ Entry added!')
    }
    setLoading(null)
  }

  async function deleteEntry(id: string) {
    setLoading(id)
    await supabase.from('timetable').delete().eq('id', id)
    setTimetable(t => t.filter(x => x.id !== id))
    setLoading(null)
  }

  const filtered = timetable.filter(t =>
    (!filterSection || t.section_id === filterSection) &&
    (!filterDay || t.day_of_week === filterDay)
  )

  // Group by day
  const grouped: Record<number, TT[]> = {}
  for (const entry of filtered) {
    if (!grouped[entry.day_of_week]) grouped[entry.day_of_week] = []
    grouped[entry.day_of_week].push(entry)
    grouped[entry.day_of_week].sort((a, b) => a.period_no - b.period_no)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Timetable</h2>
            <p className="text-sm text-muted-foreground">{timetable.length} entries</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'Add Entry'}
        </Button>
      </div>

      {msg && <p className="text-sm rounded px-3 py-2 bg-muted/40">{msg}</p>}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Section *</Label>
                  <Select value={sectionId} onChange={e => { setSectionId(e.target.value); setSubjectId('') }} required>
                    <option value="">Select section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>Class {(s.classes as any)?.name} - Section {s.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Select value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!sectionId}>
                    <option value="">Select subject</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Teacher *</Label>
                  <Select value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                    <option value="">Select teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{(t.profiles as any)?.full_name ?? t.id}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Day *</Label>
                  <Select value={day} onChange={e => setDay(e.target.value)}>
                    {DAYS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Period No</Label>
                  <Input type="number" min="1" max="10" value={period} onChange={e => setPeriod(e.target.value)} />
                </div>
                <div className="space-y-1.5 col-span-1" />
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={loading === 'add'} size="sm">
                {loading === 'add' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add Entry'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-auto text-xs h-8">
          <option value="">All Sections</option>
          {sections.map(s => <option key={s.id} value={s.id}>Class {(s.classes as any)?.name}-{s.name}</option>)}
        </Select>
        <Select value={filterDay ? String(filterDay) : ''} onChange={e => setFilterDay(parseInt(e.target.value) || 0)} className="w-auto text-xs h-8">
          <option value="">All Days</option>
          {DAYS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
        </Select>
      </div>

      {/* Timetable grid by day */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Koi timetable entry nahi.</p>
      ) : Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([dayNum, entries]) => (
        <Card key={dayNum}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">{DAYS[Number(dayNum)]}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">P{entry.period_no} • {entry.start_time}–{entry.end_time}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{(entry.subjects as any)?.name ?? '—'}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Class {(entry.sections as any)?.classes?.name ?? '—'}-{(entry.sections as any)?.name ?? '—'} •{' '}
                      {(entry.teachers as any)?.profiles?.full_name ?? '—'}
                    </span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                    disabled={loading === entry.id} onClick={() => deleteEntry(entry.id)}>
                    {loading === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
