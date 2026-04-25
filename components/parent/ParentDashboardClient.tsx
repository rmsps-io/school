'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, BarChart2, IndianRupee, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  childName:     string
  relation:      string
  admissionNo:   string
  rollNo:        string | null
  className:     string
  sectionName:   string
  attendancePct: number
  presentDays:   number
  totalDays:     number
  results: Array<{
    marks_obtained: number; full_marks: number; grade: string | null
    subjects: { name: string }[] | null
    exams:    { name: string }[] | null
  }>
  payments: Array<{
    amount_paid: number; status: string; payment_date: string
    receipt_no:  string | null
    fees: { fee_type: string }[] | null
  }>
  totalPaid:    number
  totalPending: number
  announcements: Array<{ id: string; title: string; type: string; content: string; created_at: string }>
}

const cardV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const gradeColor: Record<string, string> = {
  'A+': 'text-green-600', A: 'text-green-500', 'B+': 'text-blue-600',
  B: 'text-blue-500', 'C+': 'text-yellow-600', C: 'text-yellow-500',
  D: 'text-orange-500', F: 'text-red-600',
}

export function ParentDashboardClient({
  childName, relation, admissionNo, rollNo, className, sectionName,
  attendancePct, presentDays, totalDays,
  results, payments, totalPaid, totalPending, announcements,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Child banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-royal-700 to-royal-900 p-5 text-white"
      >
        <p className="text-white/60 text-xs capitalize">{relation}&apos;s ward</p>
        <h2 className="text-xl font-display font-semibold mt-0.5">{childName}</h2>
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div><span className="text-white/60">Class: </span><span className="font-medium">{className} – {sectionName}</span></div>
          <div><span className="text-white/60">Adm No: </span><span className="font-mono font-medium">{admissionNo}</span></div>
          {rollNo && <div><span className="text-white/60">Roll: </span><span className="font-mono font-medium">{rollNo}</span></div>}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={cardV}>
          <Card className={`border-0 ${attendancePct >= 75 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className={cn('text-2xl font-bold mt-1', attendancePct >= 75 ? 'text-green-600' : 'text-red-600')}>{attendancePct}%</p>
                  <p className="text-[11px] text-muted-foreground">{presentDays}/{totalDays} days</p>
                </div>
                <div className={`rounded-xl p-2.5 ${attendancePct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}>
                  <CalendarCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted">
                <div className={cn('h-1.5 rounded-full', attendancePct >= 75 ? 'bg-green-500' : 'bg-red-500')} style={{ width: `${attendancePct}%` }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Results</p><p className="text-2xl font-bold mt-1 text-blue-600">{results.length}</p></div>
              <div className="rounded-xl bg-blue-500 p-2.5"><BarChart2 className="h-5 w-5 text-white" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className="border-0 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Fees Paid</p><p className="text-2xl font-bold mt-1 text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p></div>
              <div className="rounded-xl bg-emerald-500 p-2.5"><IndianRupee className="h-5 w-5 text-white" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardV}>
          <Card className={`border-0 ${totalPending > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Due Fees</p>
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

      {/* Results + Payments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" /> Child&apos;s Results</CardTitle></CardHeader>
            <CardContent>
              {results.length === 0 ? <p className="text-sm text-muted-foreground">No results yet.</p> : (
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{r.subjects?.[0]?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{r.exams?.[0]?.name ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{r.marks_obtained}/{r.full_marks}</p>
                        <p className={cn('text-xs font-bold', gradeColor[r.grade ?? 'F'] ?? '')}>{r.grade ?? 'F'}</p>
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
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary" /> Recent Payments</CardTitle></CardHeader>
            <CardContent>
              {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments found.</p> : (
                <div className="space-y-2">
                  {payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium capitalize">{p.fees?.[0]?.fee_type?.replace('_', ' ') ?? 'Fee'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{Number(p.amount_paid).toLocaleString('en-IN')}</p>
                        <Badge variant={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'destructive'} className="text-[10px] capitalize">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Announcements</CardTitle></CardHeader>
            <CardContent>
              {announcements.length === 0 ? <p className="text-sm text-muted-foreground">No announcements.</p> : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{a.title}</p>
                        <Badge variant="secondary" className="text-[10px] capitalize ml-2 shrink-0">{a.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
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
