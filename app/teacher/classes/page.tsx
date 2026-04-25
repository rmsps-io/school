import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My Classes' }

export default async function TeacherClassesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const { data: ts } = await supabase
    .from('teacher_subjects')
    .select('sections(id,name,capacity,classes(name,numeric_val)), subjects(name,code,full_marks)')
    .eq('teacher_id', teacher?.id ?? '')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">My Classes</h2>
      {!ts || ts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No classes assigned. Contact admin.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ts.map((t, i) => {
            const sec = (t.sections as {id:string;name:string;capacity:number;classes:{name:string}[]|null}[]|null)?.[0]
            const sub = (t.subjects as {name:string;code:string;full_marks:number}[]|null)?.[0]
            return (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">Class {sec?.classes?.[0]?.name ?? '—'} – Sec {sec?.name ?? '—'}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{sub?.name ?? '—'}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">{sub?.code ?? ''}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Capacity: {sec?.capacity ?? '—'}</span>
                    <span>Full Marks: {sub?.full_marks ?? '—'}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
