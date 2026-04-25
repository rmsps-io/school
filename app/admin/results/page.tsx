import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Results' }

const gradeColor: Record<string, string> = {
  'A+': 'text-green-600', A: 'text-green-500', 'B+': 'text-blue-600',
  B: 'text-blue-500', 'C+': 'text-yellow-600', C: 'text-yellow-500',
  D: 'text-orange-500', F: 'text-red-600',
}

export default async function AdminResultsPage() {
  const supabase = createClient()
  const { data: results } = await supabase
    .from('results')
    .select('id, marks_obtained, full_marks, grade, created_at, students(profiles(full_name), sections(name, classes(name))), subjects(name), exams(name, exam_type)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Results</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{results?.length ?? 0} result records</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Results</CardTitle></CardHeader>
        <CardContent>
          {!results || results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No results entered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Student</th>
                    <th className="pb-3 font-medium text-muted-foreground">Exam</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Subject</th>
                    <th className="pb-3 font-medium text-muted-foreground">Marks</th>
                    <th className="pb-3 font-medium text-muted-foreground">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const stu = (r.students as {profiles:{full_name:string}[]|null;sections:{name:string;classes:{name:string}[]|null}[]|null}[]|null)?.[0]
                    const name = stu?.profiles?.[0]?.full_name ?? '—'
                    const cls  = stu?.sections?.[0]?.classes?.[0]?.name ?? '—'
                    const sec  = stu?.sections?.[0]?.name ?? ''
                    const exam = (r.exams as {name:string;exam_type:string}[]|null)?.[0]
                    const subj = (r.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                    const pct  = Math.round((Number(r.marks_obtained) / Number(r.full_marks)) * 100)
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3">
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">Class {cls}-{sec}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm">{exam?.name ?? '—'}</p>
                          <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">{exam?.exam_type?.replace('_',' ') ?? ''}</Badge>
                        </td>
                        <td className="py-3 hidden md:table-cell">{subj}</td>
                        <td className="py-3">
                          <p className="font-semibold">{r.marks_obtained}/{r.full_marks}</p>
                          <p className="text-xs text-muted-foreground">{pct}%</p>
                        </td>
                        <td className="py-3">
                          <span className={`font-bold text-sm ${gradeColor[r.grade ?? 'F'] ?? 'text-muted-foreground'}`}>
                            {r.grade ?? 'F'}
                          </span>
                        </td>
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
