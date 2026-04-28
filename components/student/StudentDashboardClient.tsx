'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, BarChart2, IndianRupee, ClipboardList, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Use loose types to match Supabase join returns
interface Props {
  student: {
    admission_no: string
    roll_no: string | null
    section_id: string
    sections: { name: string; classes: { name: string }[] | null }[] | null
  }
  attendancePct: number
  presentDays:   number
  totalDays:     number
  results: Array<{
    marks_obtained: number; full_marks: number; grade: string | null
    subjects: { name: string }[] | null
    exams:    { name: string; exam_type: string; academic_year?: string }[] | null
  }>
  totalPaid:    number
  totalPending: number
  assignments: Array<{
    id: string; title: string; due_date: string
    subjects: { name: string }[] | null
  }>
  announcements: Array<{ id: string; title: string; type: string; created_at: string }>
}

const cardV = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const gradeColor: Record<string, string> = {
  'A+': 'text-green-600', A: 'text-green-500', 'B+': 'text-blue-600',
  B: 'text-blue-500', 'C+': 'text-yellow-600', C: 'text-yellow-500',
  D: 'text-orange-500', F: 'text-red-600',
}

export function StudentDashboardClient({
  student, attendancePct, presentDays, totalDays,
  results, totalPaid, totalPending, assignments, announcements,
}: Props) {
  const section = student.sections?.[0]

  return (
    <div className="space-y-6">
      {/* Profile banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-royal-700 to-royal-900 p-5 text-white flex flex-wrap gap-4 items-center justify-between"
      >
        <div>
          <p className="text-white/60 text-xs">Class & Section</p>
          <p className="text-xl font-display font-semibold">
            Class {section?.classes?.[0]?.name ?? '—'} – Section {section?.name ?? '—'}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-white/60 text-xs">Admission No</p>
            <p className="font-mono font-semibold">{student.admission_no}</p>
          </div>
          {student.roll_no && (
            <div>
              <p className="text-white/60 text-xs">Roll No</p>
              <p className="font-mono font-semibold">{student.roll_no}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={cardV}>
          <Card className="border-0 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className={cn('text-2xl font-bold mt-1', attendancePct >= 75 ? 'text-green-600' : 'text-red-600')}>
                    {attendancePct}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">{presentDays}/{totalDays} days</p>
                </div>
                <div className="rounded-xl bg-green-500 p-2.5">
                  <CalendarCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-green-100 dark:bg-green-900">
                <div
                  className={cn('h-1.5 rounded-full', attendancePct >= 75 ? 'bg-green-500' : 'bg-red-500')}
                  style={{ width: `${attendancePct}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Results</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{results.length}</p>
                <p className="text-[11px] text-muted-foreground">subjects graded</p>
              </div>
              <div className="rounded-xl bg-blue-500 p-2.5"><BarChart2 className="h-5 w-5 text-white" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className="border-0 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fees Paid</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl bg-emerald-500 p-2.5"><IndianRupee className="h-5 w-5 text-white" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className={`border-0 ${totalPending > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Fees</p>
                <p className={cn('text-2xl font-bold mt-1', totalPending > 0 ? 'text-red-600' : 'text-green-600')}>
                  {totalPending > 0 ? `₹${totalPending.toLocaleString('en-IN')}` : 'Clear ✓'}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${totalPending > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Two column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No results yet.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{r.subjects?.[0]?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.exams?.[0]?.name ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{r.marks_obtained}/{r.full_marks}</p>
                        <p className={cn('text-xs font-bold', gradeColor[r.grade ?? 'F'] ?? 'text-muted-foreground')}>
                          {r.grade ?? 'F'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-start justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.subjects?.[0]?.name ?? '—'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-2 shrink-0">
                        {new Date(a.due_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements.</p>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize ml-2 shrink-0">{a.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
