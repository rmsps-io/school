import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Fee Structure' }

export default async function AdminFeesPage() {
  const supabase = createClient()
  const { data: fees } = await supabase
    .from('fees')
    .select('id, fee_type, amount, frequency, academic_year, description, classes(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Fee Structure</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{fees?.length ?? 0} fee entries</p>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Fee Categories</CardTitle></CardHeader>
        <CardContent>
          {!fees || fees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No fee structure defined yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Class</th>
                    <th className="pb-3 font-medium text-muted-foreground">Fee Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Frequency</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => {
                    const cls = (f.classes as {name:string}[]|null)?.[0]?.name ?? '—'
                    return (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">Class {cls}</td>
                        <td className="py-3 capitalize">{f.fee_type.replace('_',' ')}</td>
                        <td className="py-3 font-semibold text-green-600">₹{Number(f.amount).toLocaleString('en-IN')}</td>
                        <td className="py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="text-[10px] capitalize">{f.frequency.replace('_',' ')}</Badge>
                        </td>
                        <td className="py-3 hidden lg:table-cell text-muted-foreground">{f.academic_year}</td>
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
