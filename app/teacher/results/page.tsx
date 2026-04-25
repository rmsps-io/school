import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Enter Results' }

const gradeColor: Record<string, string> = {
  'A+': 'text-green-600', A: 'text-green-500', 'B+': 'text-blue-600',
  B: 'text-blue-500', 'C+': 'text-yellow-600', C: 'text-yellow-500',
  D: 'text-orange-500', F: 'text-red-600',
}

export default async function TeacherResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', user!.id).single()

  const { data: results } = await supabase
    .from('results')
    .select('id, marks_obtained, full_marks, grade, created_at, students(profiles(full_name)), subjects(name), exams(name)')
    .eq('entered_by', teacher?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Results</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{results?.length ?? 0} results entered by you</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Entered Results</CardTitle></CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No results entered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Student</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Exam</th>
                    <th className="pb-3 font-medium text-muted-foreground">Subject</th>
                    <th className="pb-3 font-medium text-muted-foreground">Marks</th>
                    <th className="pb-3 font-medium text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const name = (r.students as {profiles:{full_name:string}[]|null}[]|null)?.[0]?.profiles?.[0]?.full_name ?? '—'
                    const exam = (r.exams as {name:string}[]|null)?.[0]?.name ?? '—'
                    const subj = (r.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                    const pct  = Math.round((Number(r.marks_obtained) / Number(r.full_marks)) * 100)
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">{name}</td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">{exam}</td>
                        <td className="py-3">{subj}</td>
                        <td className="py-3 font-semibold">{r.marks_obtained}/{r.full_marks} <span className="font-normal text-muted-foreground text-xs">({pct}%)</span></td>
                        <td className={`py-3 font-bold ${gradeColor[r.grade ?? 'F'] ?? ''}`}>{r.grade ?? 'F'}</td>
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
