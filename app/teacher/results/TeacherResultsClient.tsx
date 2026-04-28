'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart2, Loader2, CheckCircle } from 'lucide-react'

type Exam = { id: string; name: string; exam_type: string; start_date: string; classes: { id: string; name: string } | null }
type TS = {
  subject_id: string; section_id: string
  subjects: { id: string; name: string; full_marks: number; pass_marks: number } | null
  sections: { id: string; name: string; classes: { id: string; name: string } | null } | null
}
type Student = { id: string; full_name: string; admission_no: string }

function gradeCalc(marks: number, full: number): string {
  const pct = (marks / full) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}

export function TeacherResultsClient({ exams, teacherSubjects, teacherId }: {
  exams: Exam[]; teacherSubjects: TS[]; teacherId: string | null
}) {
  const [examId, setExamId]     = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks]       = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<Set<string>>(new Set())
  const [loadingStu, setLoadingStu] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const supabase = createClient()

  const selectedSubject = teacherSubjects.find(ts => ts.subject_id === subjectId)?.subjects ?? null
  const fullMarks = selectedSubject?.full_marks ?? 100

  const sectionOptions = teacherSubjects
    .filter(ts => ts.sections && (!subjectId || ts.subject_id === subjectId))
    .map(ts => ({ id: ts.section_id, label: `Class ${ts.sections?.classes?.name ?? '—'} - Section ${ts.sections?.name}` }))

  const subjectOptions = Array.from(new Map(
    teacherSubjects.filter(ts => ts.subjects).map(ts => [ts.subject_id, ts.subjects!])
  ).entries()).map(([id, s]) => ({ id, name: s.name }))

  async function loadStudents() {
    if (!examId || !subjectId || !sectionId) return
    setLoadingStu(true); setDone(false); setError(null)

    const { data: studs } = await supabase
      .from('students').select('id, admission_no, profiles(full_name)')
      .eq('section_id', sectionId).eq('is_active', true).order('admission_no')

    const { data: existResults } = await supabase
      .from('results').select('student_id, marks_obtained')
      .eq('exam_id', examId).eq('subject_id', subjectId)

    const existMap: Record<string, string> = {}
    const existSet = new Set<string>()
    for (const r of (existResults ?? [])) {
      existMap[r.student_id] = String(r.marks_obtained)
      existSet.add(r.student_id)
    }
    setExisting(existSet)

    const parsed: Student[] = (studs ?? []).map((s: any) => ({
      id: s.id, admission_no: s.admission_no,
      full_name: s.profiles?.[0]?.full_name ?? s.profiles?.full_name ?? '—',
    }))
    setStudents(parsed)
    const defaultMarks: Record<string, string> = {}
    for (const s of parsed) defaultMarks[s.id] = existMap[s.id] ?? ''
    setMarks(defaultMarks)
    setLoadingStu(false)
  }

  async function handleSave() {
    if (!teacherId || students.length === 0) return
    setSaving(true); setError(null)

    const rows = students
      .filter(s => marks[s.id] !== '' && marks[s.id] !== undefined)
      .map(s => {
        const m = parseFloat(marks[s.id])
        return {
          student_id: s.id, exam_id: examId, subject_id: subjectId,
          marks_obtained: m, full_marks: fullMarks,
          grade: gradeCalc(m, fullMarks), entered_by: teacherId,
        }
      })

    const { error: err } = await supabase
      .from('results').upsert(rows, { onConflict: 'student_id,exam_id,subject_id' })

    if (err) { setError(err.message) }
    else { setDone(true) }
    setSaving(false)
  }

  const examTypeLabel: Record<string, string> = {
    unit_test: 'Unit Test', half_yearly: 'Half Yearly', annual: 'Annual', pre_board: 'Pre Board', other: 'Other',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Enter Results</h2>
          <p className="text-sm text-muted-foreground">Students ke marks enter karo</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Select Exam, Subject & Section</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Exam *</label>
              <Select value={examId} onChange={e => { setExamId(e.target.value); setStudents([]) }}>
                <option value="">Select exam</option>
                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({examTypeLabel[e.exam_type] ?? e.exam_type})</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject *</label>
              <Select value={subjectId} onChange={e => { setSubjectId(e.target.value); setStudents([]) }}>
                <option value="">Select subject</option>
                {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Section *</label>
              <Select value={sectionId} onChange={e => { setSectionId(e.target.value); setStudents([]) }}>
                <option value="">Select section</option>
                {sectionOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </Select>
            </div>
          </div>
          <Button onClick={loadStudents} disabled={!examId || !subjectId || !sectionId || loadingStu} size="sm">
            {loadingStu ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : 'Load Students'}
          </Button>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{students.length} Students — Full Marks: {fullMarks}</span>
              {existing.size > 0 && <Badge variant="secondary" className="text-xs">{existing.size} already entered</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {students.map((s, i) => {
                const m = parseFloat(marks[s.id])
                const grade = !isNaN(m) && marks[s.id] !== '' ? gradeCalc(m, fullMarks) : null
                const passed = grade && grade !== 'F'
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">Adm: {s.admission_no}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input type="number" min="0" max={fullMarks} placeholder="Marks"
                        value={marks[s.id] ?? ''}
                        onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-24 text-center h-8 text-sm" />
                      <span className="text-xs text-muted-foreground w-8">/{fullMarks}</span>
                      {grade && (
                        <Badge variant={passed ? 'success' : 'destructive'} className="text-xs w-8 justify-center">{grade}</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
      {done && <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-3 py-2 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Results saved successfully!</p>}

      {students.length > 0 && (
        <Button onClick={handleSave} disabled={saving || !teacherId}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : `Save Results (${students.filter(s => marks[s.id]).length} entered)`}
        </Button>
      )}
    </div>
  )
}
