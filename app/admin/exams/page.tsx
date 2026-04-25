import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Exams' }

export default async function AdminExamsPage() {
  const supabase = createClient()
  const { data: exams } = await supabase
    .from('exams')
    .select('id, name, exam_type, start_date, end_date, academic_year, is_published, classes(name)')
    .order('start_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Exams</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{exams?.length ?? 0} total exams</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Exams</CardTitle></CardHeader>
        <CardContent>
          {!exams || exams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No exams scheduled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Exam Name</th>
                    <th className="pb-3 font-medium text-muted-foreground">Type</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Class</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Dates</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e) => {
                    const cls = (e.classes as {name:string}[]|null)?.[0]?.name ?? '—'
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">{e.name}</td>
                        <td className="py-3"><Badge variant="secondary" className="text-[10px] capitalize">{e.exam_type.replace('_',' ')}</Badge></td>
                        <td className="py-3 hidden md:table-cell">Class {cls}</td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground text-xs">
                          {new Date(e.start_date).toLocaleDateString('en-IN')} – {new Date(e.end_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3">
                          <Badge variant={e.is_published ? 'success' : 'secondary'} className="text-[10px]">
                            {e.is_published ? 'Published' : 'Draft'}
                          </Badge>
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
