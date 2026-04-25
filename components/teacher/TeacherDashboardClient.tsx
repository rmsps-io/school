'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, ClipboardList, School, Megaphone, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  sections: Array<{ id: string; name: string; className: string; subjects: string[] }>
  presentCount: number
  absentCount:  number
  totalMarked:  number
  assignments: Array<{ id: string; title: string; due_date: string; subjectName: string }>
  announcements: Array<{ id: string; title: string; type: string; created_at: string }>
}

const cardV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const typeColors: Record<string, 'default'|'destructive'|'warning'|'secondary'> = {
  urgent: 'destructive', exam: 'warning', holiday: 'secondary', general: 'default',
}

export function TeacherDashboardClient({
  sections, presentCount, absentCount, totalMarked, assignments, announcements,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {[
          { label: 'My Sections',        value: sections.length,  icon: School,        bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600',   color: 'bg-blue-500' },
          { label: 'Present Today',      value: presentCount,     icon: CheckCircle2,  bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600',  color: 'bg-green-500' },
          { label: 'Absent Today',       value: absentCount,      icon: XCircle,       bg: 'bg-red-50 dark:bg-red-950/30',     text: 'text-red-600',    color: 'bg-red-500' },
          { label: 'Attendance Marked',  value: totalMarked,      icon: CalendarCheck, bg: 'bg-violet-50 dark:bg-violet-950/30',text: 'text-violet-600',color: 'bg-violet-500' },
        ].map(s => (
          <motion.div key={s.label} variants={cardV}>
            <Card className={`border-0 ${s.bg}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.text}`}>{s.value}</p>
                </div>
                <div className={`rounded-xl ${s.color} p-2.5`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* My Sections */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <School className="h-4 w-4 text-primary" /> My Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sections assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {sections.map(sec => (
                    <div key={sec.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-sm font-medium">Class {sec.className} – Section {sec.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{sec.subjects.join(', ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assignments */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Active Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active assignments.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <div key={a.id} className="flex items-start justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium leading-none">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.subjectName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(a.due_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Latest Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements.</p>
              ) : (
                <div className="space-y-2">
                  {announcements.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge variant={typeColors[a.type] ?? 'default'} className="text-[10px] capitalize">{a.type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
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
