import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Mark Attendance' }

const statusVariant: Record<string, 'success'|'destructive'|'warning'|'secondary'> = {
  present: 'success', absent: 'destructive', late: 'warning', holiday: 'secondary',
}

export default async function TeacherAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const today = new Date().toISOString().split('T')[0]

  const { data: attendance } = await supabase
    .from('attendance')
    .select('id, date, status, students(profiles(full_name), sections(name, classes(name)))')
    .eq('teacher_id', teacher?.id ?? '')
    .eq('date', today)
    .order('created_at', { ascending: false })

  const presentCount = attendance?.filter(a => a.status === 'present').length ?? 0
  const absentCount  = attendance?.filter(a => a.status === 'absent').length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Mark Attendance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Today — {new Date().toLocaleDateString('en-IN', {dateStyle:'full'})}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Present</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Absent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Today&apos;s Records</CardTitle></CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No attendance marked for today yet.</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((a) => {
                const stu  = (a.students as {profiles:{full_name:string}[]|null;sections:{name:string;classes:{name:string}[]|null}[]|null}[]|null)?.[0]
                const name = stu?.profiles?.[0]?.full_name ?? '—'
                const cls  = stu?.sections?.[0]?.classes?.[0]?.name ?? '—'
                const sec  = stu?.sections?.[0]?.name ?? ''
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">Class {cls}-{sec}</p>
                    </div>
                    <Badge variant={statusVariant[a.status] ?? 'secondary'} className="text-[10px] capitalize">{a.status}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
