import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Attendance' }

const statusVariant: Record<string, 'success'|'destructive'|'warning'|'secondary'> = {
  present: 'success', absent: 'destructive', late: 'warning', holiday: 'secondary',
}

export default async function AdminAttendancePage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, date, status, remarks, students(profiles(full_name), sections(name, classes(name)))')
    .eq('date', today)
    .order('created_at', { ascending: false })

  const presentCount = attendance?.filter(a => a.status === 'present').length ?? 0
  const absentCount  = attendance?.filter(a => a.status === 'absent').length ?? 0
  const lateCount    = attendance?.filter(a => a.status === 'late').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Attendance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Today — {new Date().toLocaleDateString('en-IN', {dateStyle:'full'})}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present', value: presentCount, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Absent',  value: absentCount,  color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950/30'   },
          { label: 'Late',    value: lateCount,    color: 'text-yellow-600',bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
        ].map(s => (
          <Card key={s.label} className={`border-0 ${s.bg}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Today&apos;s Attendance</CardTitle></CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attendance marked for today yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Student</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Class</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => {
                    const stu = (a.students as {profiles:{full_name:string}[]|null;sections:{name:string;classes:{name:string}[]|null}[]|null}[]|null)?.[0]
                    const name = stu?.profiles?.[0]?.full_name ?? '—'
                    const cls  = stu?.sections?.[0]?.classes?.[0]?.name ?? '—'
                    const sec  = stu?.sections?.[0]?.name ?? ''
                    return (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">{name}</td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">Class {cls}-{sec}</td>
                        <td className="py-3">
                          <Badge variant={statusVariant[a.status] ?? 'secondary'} className="text-[10px] capitalize">{a.status}</Badge>
                        </td>
                        <td className="py-3 hidden lg:table-cell text-muted-foreground text-xs">{a.remarks ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
