import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Audit Logs' }

const actionVariant: Record<string, 'success' | 'destructive' | 'warning' | 'default'> = {
  INSERT: 'success', DELETE: 'destructive', UPDATE: 'warning',
}

export default async function AdminAuditPage() {
  const supabase = createClient()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, table_name, record_id, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold">Audit Logs</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Last {logs?.length ?? 0} actions</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No audit records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Action</th>
                    <th className="pb-3 font-medium text-muted-foreground">Table</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">By</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Record ID</th>
                    <th className="pb-3 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    // FIX: Supabase returns join as array — access [0]
                    const by = (l.profiles as { full_name: string }[] | null)?.[0]?.full_name ?? 'System'
                    return (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3">
                          <Badge variant={actionVariant[l.action] ?? 'default'} className="text-[10px]">
                            {l.action}
                          </Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">{l.table_name}</td>
                        <td className="py-3 hidden md:table-cell">{by}</td>
                        <td className="py-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">
                          {l.record_id ? l.record_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short', timeStyle: 'short',
                          })}
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
