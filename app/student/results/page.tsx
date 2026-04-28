import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'My Results' }

const gradeColor: Record<string, string> = {
  'A+':'text-green-600', A:'text-green-500', 'B+':'text-blue-600',
  B:'text-blue-500', 'C+':'text-yellow-600', C:'text-yellow-500',
  D:'text-orange-500', F:'text-red-600',
}

export default async function StudentResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: student } = await supabase.from('students').select('id').eq('profile_id', user!.id).single()

  const { data: results } = await supabase
    .from('results')
    .select('id, marks_obtained, full_marks, grade, subjects(name), exams(name, exam_type)')
    .eq('student_id', student?.id ?? '')
    .order('created_at', { ascending: false })

  // Group by exam
  const grouped: Record<string, typeof results> = {}
  results?.forEach(r => {
    const examName = (r.exams as {name:string}[]|null)?.[0]?.name ?? 'Others'
    if (!grouped[examName]) grouped[examName] = []
    grouped[examName]!.push(r)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">My Results</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{results?.length ?? 0} subject results</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No results published yet.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([examName, res]) => {
          const totalObtained = res?.reduce((s,r) => s + Number(r.marks_obtained), 0) ?? 0
          const totalFull     = res?.reduce((s,r) => s + Number(r.full_marks), 0) ?? 0
          const overallPct    = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0
          return (
            <Card key={examName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">{examName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{totalObtained}/{totalFull}</span>
                    <Badge variant={overallPct >= 33 ? 'success' : 'destructive'} className="text-[10px]">
                      {overallPct}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {res?.map((r) => {
                    const subj = (r.subjects as {name:string}[]|null)?.[0]?.name ?? '—'
                    const pct  = Math.round((Number(r.marks_obtained) / Number(r.full_marks)) * 100)
                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <p className="text-sm font-medium">{subj}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm">{r.marks_obtained}/{r.full_marks}</p>
                          <p className="text-xs text-muted-foreground">({pct}%)</p>
                          <span className={`text-sm font-bold ${gradeColor[r.grade ?? 'F'] ?? ''}`}>{r.grade ?? 'F'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
