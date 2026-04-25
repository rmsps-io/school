import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: "Child's Attendance" }

const statusVariant: Record<string, 'success'|'destructive'|'warning'|'secondary'> = {
  present:'success', absent:'destructive', late:'warning', holiday:'secondary',
}

export default async function ParentAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: parent } = await supabase.from('parents').select('student_id').eq('profile_id', user!.id).single()

  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, date, status, remarks')
    .eq('student_id', parent?.student_id ?? '')
    .order('date', { ascending: false })
    .limit(60)

  const present = attendance?.filter(a => a.status === 'present').length ?? 0
  const absent  = attendance?.filter(a => a.status === 'absent').length ?? 0
  const total   = attendance?.length ?? 0
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Child&apos;s Attendance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Last {total} days</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:`${pct}%`, sub:'Attendance', color: pct >= 75 ? 'text-green-600' : 'text-red-600', bg: pct >= 75 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30' },
          { label:String(present), sub:'Present', color:'text-green-600', bg:'bg-green-50 dark:bg-green-950/30' },
          { label:String(absent),  sub:'Absent',  color:'text-red-600',   bg:'bg-red-50 dark:bg-red-950/30'   },
        ].map(s => (
          <Card key={s.sub} className={`border-0 ${s.bg}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pct < 75 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          ⚠️ Your child&apos;s attendance is below 75%. Please ensure regular attendance.
        </div>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Attendance Details</CardTitle></CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attendance records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Day</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 font-mono text-xs">{new Date(a.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 text-muted-foreground">{new Date(a.date).toLocaleDateString('en-IN', {weekday:'short'})}</td>
                      <td className="py-3"><Badge variant={statusVariant[a.status] ?? 'secondary'} className="text-[10px] capitalize">{a.status}</Badge></td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground text-xs">{a.remarks ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
