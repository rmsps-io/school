'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { CalendarCheck, Loader2, CheckCircle, XCircle, Clock, Sun } from 'lucide-react'

type SectionItem = { id: string; name: string; className: string; classId: string }
type Student = { id: string; full_name: string; admission_no: string; roll_no: string | null }
type AttRow = Record<string, 'present' | 'absent' | 'late' | 'holiday'>

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-600' },
  { value: 'absent',  label: 'Absent',  icon: XCircle,     color: 'text-red-500'   },
  { value: 'late',    label: 'Late',    icon: Clock,       color: 'text-amber-500' },
  { value: 'holiday', label: 'Holiday', icon: Sun,         color: 'text-blue-500'  },
]

export function TeacherAttendanceClient({ sections, teacherId }: { sections: SectionItem[]; teacherId: string | null }) {
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(sections[0] ?? null)
  const [students, setStudents]   = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttRow>({})
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!selectedSection) return
    loadStudents(selectedSection.id)
  }, [selectedSection])

  async function loadStudents(sectionId: string) {
    setLoadingStudents(true); setDone(false); setError(null)
    const { data: studs } = await supabase
      .from('students')
      .select('id, admission_no, roll_no, profiles(full_name)')
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .order('admission_no')

    const { data: existing } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('section_id', sectionId)
      .eq('date', today)

    const existMap: AttRow = {}
    const existSet = new Set<string>()
    for (const e of (existing ?? [])) {
      existMap[e.student_id] = e.status as 'present'
      existSet.add(e.student_id)
    }
    setExistingIds(existSet)

    const parsed: Student[] = (studs ?? []).map((s: any) => ({
      id: s.id, admission_no: s.admission_no, roll_no: s.roll_no,
      full_name: s.profiles?.[0]?.full_name ?? s.profiles?.full_name ?? '—',
    }))
    setStudents(parsed)

    // Default: present for all, override with existing
    const defaultAtt: AttRow = {}
    for (const s of parsed) { defaultAtt[s.id] = existMap[s.id] ?? 'present' }
    setAttendance(defaultAtt)
    setLoadingStudents(false)
  }

  function setAll(status: 'present' | 'absent' | 'late' | 'holiday') {
    setAttendance(prev => {
      const next = { ...prev }
      for (const s of students) next[s.id] = status
      return next
    })
  }

  async function handleSubmit() {
    if (!teacherId || !selectedSection || students.length === 0) return
    setSaving(true); setError(null)

    const rows = students.map(s => ({
      student_id: s.id, section_id: selectedSection.id,
      teacher_id: teacherId, date: today,
      status: attendance[s.id] ?? 'present',
    }))

    const { error: err } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,date' })

    if (err) { setError(err.message) }
    else { setDone(true) }
    setSaving(false)
  }

  const counts = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent:  Object.values(attendance).filter(v => v === 'absent').length,
    late:    Object.values(attendance).filter(v => v === 'late').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Mark Attendance</h2>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>
      </div>

      {!teacherId && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          ⚠️ Teacher profile nahi mila. Admin se teacher account setup karwao.
        </div>
      )}

      {sections.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Aapko koi section assign nahi kiya gaya. Admin se contact karo.</CardContent></Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium shrink-0">Select Section:</label>
            <Select value={selectedSection?.id ?? ''} onChange={e => setSelectedSection(sections.find(s => s.id === e.target.value) ?? null)} className="max-w-xs">
              {sections.map(s => <option key={s.id} value={s.id}>Class {s.className} — Section {s.name}</option>)}
            </Select>
          </div>

          {/* Quick stats */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Present', count: counts.present, color: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
                { label: 'Absent',  count: counts.absent,  color: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'       },
                { label: 'Late',    count: counts.late,    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
              ].map(({ label, count, color }) => (
                <Card key={label} className="border-0">
                  <CardContent className={`p-3 text-center ${color} rounded-lg`}>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs mt-0.5">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">
                {loadingStudents ? 'Loading...' : `${students.length} Students`}
              </CardTitle>
              {students.length > 0 && (
                <div className="flex gap-1">
                  {['present', 'absent', 'holiday'].map(s => (
                    <Button key={s} size="sm" variant="outline" onClick={() => setAll(s as 'present')} className="text-xs capitalize h-7">
                      All {s}
                    </Button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">Is section mein koi student nahi hai.</p>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">Adm: {s.admission_no}{s.roll_no && ` • Roll: ${s.roll_no}`}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {STATUS_OPTIONS.map(({ value, label, color }) => (
                          <button key={value} onClick={() => setAttendance(prev => ({ ...prev, [s.id]: value as 'present' }))}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${attendance[s.id] === value ? `border-current ${color} bg-current/10` : 'border-border text-muted-foreground hover:border-current'} ${color}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
          {done && <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-3 py-2 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Attendance saved successfully!</p>}

          {students.length > 0 && (
            <Button onClick={handleSubmit} disabled={saving || !teacherId} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : `Save Attendance (${students.length} students)`}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
