import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Payments' }

const statusVariant: Record<string, 'success'|'destructive'|'warning'|'secondary'> = {
  completed: 'success', failed: 'destructive', pending: 'warning', refunded: 'secondary',
}

export default async function AdminPaymentsPage() {
  const supabase = createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_paid, payment_date, payment_method, status, receipt_no, students(profiles(full_name)), fees(fee_type)')
    .order('payment_date', { ascending: false })
    .limit(100)

  const totalCompleted = (payments ?? []).filter(p => p.status === 'completed').reduce((s,p) => s + Number(p.amount_paid), 0)
  const totalPending   = (payments ?? []).filter(p => p.status === 'pending').reduce((s,p) => s + Number(p.amount_paid), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Payments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{payments?.length ?? 0} payment records</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{totalCompleted.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold text-red-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Student</th>
                    <th className="pb-3 font-medium text-muted-foreground">Fee Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Receipt</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const name = (p.students as {profiles:{full_name:string}[]|null}[]|null)?.[0]?.profiles?.[0]?.full_name ?? '—'
                    const feeType = (p.fees as {fee_type:string}[]|null)?.[0]?.fee_type?.replace('_',' ') ?? '—'
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-medium">{name}</td>
                        <td className="py-3 capitalize">{feeType}</td>
                        <td className="py-3 font-semibold">₹{Number(p.amount_paid).toLocaleString('en-IN')}</td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">{p.receipt_no ?? '—'}</td>
                        <td className="py-3">
                          <Badge variant={statusVariant[p.status] ?? 'secondary'} className="text-[10px] capitalize">{p.status}</Badge>
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
