import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Subjects' }

export default async function AdminSubjectsPage() {
  const supabase = createClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, code, full_marks, pass_marks, classes(name, numeric_val)')
    .order('created_at', { ascending: true })

  // Group by class
  const grouped: Record<string, typeof subjects> = {}
  subjects?.forEach((s) => {
    const cls = (s.classes as {name:string;numeric_val:number}[]|null)?.[0]?.name ?? 'Unknown'
    if (!grouped[cls]) grouped[cls] = []
    grouped[cls]!.push(s)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Subjects</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subjects?.length ?? 0} total subjects</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No subjects found.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([className, subs]) => (
          <Card key={className}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Class {className}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Subject</th>
                      <th className="pb-2 font-medium text-muted-foreground">Code</th>
                      <th className="pb-2 font-medium text-muted-foreground">Full Marks</th>
                      <th className="pb-2 font-medium text-muted-foreground">Pass Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs?.map((sub) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 font-medium">{sub.name}</td>
                        <td className="py-2"><Badge variant="outline" className="text-[10px] font-mono">{sub.code}</Badge></td>
                        <td className="py-2">{sub.full_marks}</td>
                        <td className="py-2">{sub.pass_marks}</td>
                      </tr>
                    ))}
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
