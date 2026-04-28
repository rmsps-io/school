import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'My Timetable' }

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TeacherTimetablePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const { data: timetable } = await supabase
    .from('timetable')
    .select('id, day_of_week, start_time, end_time, room_no, sections(name, classes(name)), subjects(name)')
    .eq('teacher_id', teacher?.id ?? '')
    .order('day_of_week').order('start_time')

  const grouped: Record<number, typeof timetable> = {}
  timetable?.forEach((t) => {
    if (!grouped[t.day_of_week]) grouped[t.day_of_week] = []
    grouped[t.day_of_week]!.push(t)
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">My Timetable</h2>
      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No timetable assigned yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([day, slots]) => (
          <Card key={day}>
            <CardHeader className="pb-3"><CardTitle className="text-base">{DAYS[Number(day)]}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {slots?.map((s) => {
                  const sec = (s.sections as {name:string;classes:{name:string}[]|null}[]|null)?.[0]
                  const sub = (s.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{sub}</p>
                        <p className="text-xs text-muted-foreground">Class {sec?.classes?.[0]?.name ?? '—'}-{sec?.name ?? ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono">{s.start_time} – {s.end_time}</p>
                        {s.room_no && <p className="text-xs text-muted-foreground">Room {s.room_no}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
