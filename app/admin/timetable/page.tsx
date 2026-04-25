import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Timetable' }

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AdminTimetablePage() {
  const supabase = createClient()
  const { data: timetable } = await supabase
    .from('timetable')
    .select('id, day_of_week, start_time, end_time, room_no, sections(name, classes(name)), subjects(name), teachers(profiles(full_name))')
    .order('day_of_week').order('start_time')

  const grouped: Record<number, typeof timetable> = {}
  timetable?.forEach((t) => {
    if (!grouped[t.day_of_week]) grouped[t.day_of_week] = []
    grouped[t.day_of_week]!.push(t)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Timetable</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{timetable?.length ?? 0} periods scheduled</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No timetable entries yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([day, slots]) => (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{DAYS[Number(day)]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Time</th>
                      <th className="pb-2 font-medium text-muted-foreground">Subject</th>
                      <th className="pb-2 font-medium text-muted-foreground">Class</th>
                      <th className="pb-2 font-medium text-muted-foreground hidden md:table-cell">Teacher</th>
                      <th className="pb-2 font-medium text-muted-foreground hidden lg:table-cell">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots?.map((s) => {
                      const sec     = (s.sections as {name:string;classes:{name:string}[]|null}[]|null)?.[0]
                      const subject = (s.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                      const teacher = (s.teachers as {profiles:{full_name:string}[]|null}[]|null)?.[0]?.profiles?.[0]?.full_name ?? '—'
                      return (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 font-mono text-xs">{s.start_time} – {s.end_time}</td>
                          <td className="py-2 font-medium">{subject}</td>
                          <td className="py-2">Class {sec?.classes?.[0]?.name ?? '—'}-{sec?.name ?? ''}</td>
                          <td className="py-2 hidden md:table-cell text-muted-foreground">{teacher}</td>
                          <td className="py-2 hidden lg:table-cell text-muted-foreground">{s.room_no ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
