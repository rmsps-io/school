import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Timetable' }

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function StudentTimetablePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: student } = await supabase.from('students').select('section_id').eq('profile_id', user!.id).single()

  const { data: timetable } = await supabase
    .from('timetable')
    .select('id, day_of_week, start_time, end_time, room_no, subjects(name), teachers(profiles(full_name))')
    .eq('section_id', student?.section_id ?? '')
    .order('day_of_week').order('start_time')

  const grouped: Record<number, typeof timetable> = {}
  timetable?.forEach(t => {
    if (!grouped[t.day_of_week]) grouped[t.day_of_week] = []
    grouped[t.day_of_week]!.push(t)
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">My Timetable</h2>
      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No timetable available yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([day, slots]) => (
          <Card key={day}>
            <CardHeader className="pb-3"><CardTitle className="text-base">{DAYS[Number(day)]}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {slots?.map(s => {
                  const sub     = (s.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                  const teacher = (s.teachers as {profiles:{full_name:string}[]|null}[]|null)?.[0]?.profiles?.[0]?.full_name ?? '—'
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{sub}</p>
                        <p className="text-xs text-muted-foreground">{teacher}</p>
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
