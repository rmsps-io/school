'use client'

import { motion } from 'framer-motion'
import {
  GraduationCap, Users, School, CalendarCheck,
  IndianRupee, Megaphone, TrendingUp, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Stats {
  totalStudents: number; totalTeachers: number; totalClasses: number
  presentToday: number; totalRevenue: number; pendingFees: number
  activeAnnouncements: number
}

// Use index-signature types — Supabase always returns joined tables as arrays
export interface RecentStudent {
  id: string
  admission_no: string
  admission_date: string
  profiles: Array<{ full_name: string }> | null
  sections: Array<{ name: string; classes: Array<{ name: string }> | null }> | null
}

interface Props { stats: Stats; recentStudents: RecentStudent[] }

function getStatCards(stats: Stats) {
  return [
    { label:'Total Students', value:stats.totalStudents.toLocaleString('en-IN'),   icon:GraduationCap, color:'bg-blue-500',   bg:'bg-blue-50 dark:bg-blue-950/30',   text:'text-blue-600 dark:text-blue-400' },
    { label:'Total Teachers', value:stats.totalTeachers.toLocaleString('en-IN'),   icon:Users,         color:'bg-violet-500', bg:'bg-violet-50 dark:bg-violet-950/30',text:'text-violet-600 dark:text-violet-400' },
    { label:'Total Classes',  value:stats.totalClasses.toLocaleString('en-IN'),    icon:School,        color:'bg-emerald-500',bg:'bg-emerald-50 dark:bg-emerald-950/30',text:'text-emerald-600 dark:text-emerald-400' },
    { label:'Present Today',  value:stats.presentToday.toLocaleString('en-IN'),    icon:CalendarCheck, color:'bg-green-500',  bg:'bg-green-50 dark:bg-green-950/30',  text:'text-green-600 dark:text-green-400' },
    { label:'Total Revenue',  value:'₹'+stats.totalRevenue.toLocaleString('en-IN'),icon:TrendingUp,    color:'bg-yellow-500', bg:'bg-yellow-50 dark:bg-yellow-950/30',text:'text-yellow-600 dark:text-yellow-400' },
    { label:'Pending Fees',   value:'₹'+stats.pendingFees.toLocaleString('en-IN'), icon:AlertCircle,   color:'bg-red-500',    bg:'bg-red-50 dark:bg-red-950/30',      text:'text-red-600 dark:text-red-400' },
    { label:'Announcements',  value:stats.activeAnnouncements.toLocaleString('en-IN'),icon:Megaphone,  color:'bg-pink-500',   bg:'bg-pink-50 dark:bg-pink-950/30',    text:'text-pink-600 dark:text-pink-400' },
    { label:'Fee Collection',
      value: stats.totalRevenue > 0
        ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.pendingFees)) * 100) + '%'
        : '0%',
      icon:IndianRupee, color:'bg-teal-500', bg:'bg-teal-50 dark:bg-teal-950/30', text:'text-teal-600 dark:text-teal-400' },
  ]
}

const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const cardV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export function AdminDashboardClient({ stats, recentStudents }: Props) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-xl bg-gradient-to-r from-royal-700 to-royal-900 p-6 text-white"
      >
        <h2 className="text-xl font-display font-semibold">Residential Maa Saraswati Public School</h2>
        <p className="text-white/70 text-sm mt-1">Kating Chowk, Supaul, Bihar — Admin Overview</p>
      </motion.div>

      <motion.div variants={containerV} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {getStatCards(stats).map((card) => (
          <motion.div key={card.label} variants={cardV}>
            <Card className={`border-0 ${card.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${card.text}`}>{card.value}</p>
                  </div>
                  <div className={`rounded-xl ${card.color} p-2.5`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Recently Admitted Students</CardTitle></CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No students admitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left pb-3 font-medium text-muted-foreground">Admission No</th>
                      <th className="text-left pb-3 font-medium text-muted-foreground hidden sm:table-cell">Class</th>
                      <th className="text-left pb-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="text-left pb-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStudents.map((student, i) => {
                      const name    = student.profiles?.[0]?.full_name ?? '—'
                      const secName = student.sections?.[0]?.name ?? ''
                      const clsName = student.sections?.[0]?.classes?.[0]?.name ?? '—'
                      return (
                        <motion.tr key={student.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 font-medium">{name}</td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">{student.admission_no}</td>
                          <td className="py-3 text-muted-foreground hidden sm:table-cell">{clsName} {secName}</td>
                          <td className="py-3 text-muted-foreground hidden md:table-cell">{new Date(student.admission_date).toLocaleDateString('en-IN')}</td>
                          <td className="py-3"><Badge variant="success" className="text-[10px]">Active</Badge></td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
