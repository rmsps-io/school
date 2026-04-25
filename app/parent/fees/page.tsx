import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: "Child's Fees" }

const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  completed: 'success', failed: 'destructive', pending: 'warning', refunded: 'secondary',
}

export default async function ParentFeesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: parent } = await supabase
    .from('parents').select('student_id').eq('profile_id', user!.id).single()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_paid, payment_date, payment_method, status, receipt_no, fees(fee_type, frequency)')
    .eq('student_id', parent?.student_id ?? '')
    .order('payment_date', { ascending: false })

  const totalPaid    = (payments ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount_paid), 0)
  const totalPending = (payments ?? []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount_paid), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Fee Status</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Child&apos;s fee payment history</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 ${totalPending > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className={`text-2xl font-bold mt-1 ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalPending > 0 ? `₹${totalPending.toLocaleString('en-IN')}` : 'Clear ✓'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payment records found.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => {
                const fee = (p.fees as { fee_type: string; frequency: string }[] | null)?.[0]
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-3">
                    <div>
                      <p className="text-sm font-medium capitalize">{fee?.fee_type?.replace('_', ' ') ?? '—'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {fee?.frequency?.replace('_', ' ')} • {new Date(p.payment_date).toLocaleDateString('en-IN')}
                      </p>
                      {p.receipt_no && <p className="text-[10px] font-mono text-muted-foreground">{p.receipt_no}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{Number(p.amount_paid).toLocaleString('en-IN')}</p>
                      <Badge variant={statusVariant[p.status] ?? 'secondary'} className="text-[10px] capitalize mt-1">{p.status}</Badge>
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
