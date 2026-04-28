import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Assignments' }

export default async function StudentAssignmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: student } = await supabase.from('students').select('id, section_id').eq('profile_id', user!.id).single()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, max_marks, subjects(name), teachers(profiles(full_name))')
    .eq('section_id', student?.section_id ?? '')
    .eq('is_active', true)
    .order('due_date', { ascending: true })

  const { data: submissions } = await supabase
    .from('submissions')
    .select('assignment_id, status, marks_obtained')
    .eq('student_id', student?.id ?? '')

  const submittedIds = new Set(submissions?.map(s => s.assignment_id))
  const now = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Assignments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{assignments?.length ?? 0} active assignments</p>
      </div>

      {!assignments || assignments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No active assignments.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const sub      = (a.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
            const teacher  = (a.teachers as {profiles:{full_name:string}[]|null}[]|null)?.[0]?.profiles?.[0]?.full_name ?? '—'
            const due      = new Date(a.due_date)
            const overdue  = due < now
            const submitted= submittedIds.has(a.id)
            return (
              <Card key={a.id} className={submitted ? 'border-green-200 dark:border-green-800' : overdue ? 'border-red-200 dark:border-red-800' : ''}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">By {teacher} • {sub}</p>
                    </div>
                    <Badge
                      variant={submitted ? 'success' : overdue ? 'destructive' : 'warning'}
                      className="text-[10px] shrink-0"
                    >
                      {submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
                    </Badge>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Due: {due.toLocaleDateString('en-IN')}</span>
                    <span>Max: {a.max_marks} marks</span>
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
