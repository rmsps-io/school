import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Assignments' }

export default async function TeacherAssignmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, max_marks, is_active, subjects(name), sections(name, classes(name))')
    .eq('teacher_id', teacher?.id ?? '')
    .order('created_at', { ascending: false })

  const now = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Assignments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{assignments?.length ?? 0} total assignments</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No assignments created yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const sub = (a.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                const sec = (a.sections as {name:string;classes:{name:string}[]|null}[]|null)?.[0]
                const due = new Date(a.due_date)
                const overdue = due < now && a.is_active
                return (
                  <div key={a.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sub} • Class {sec?.classes?.[0]?.name ?? '—'}-{sec?.name ?? ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                        <Badge variant={a.is_active ? 'success' : 'secondary'} className="text-[10px]">
                          {a.is_active ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                    </div>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Due: {due.toLocaleDateString('en-IN')}</span>
                      <span>Max Marks: {a.max_marks}</span>
                    </div>
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
