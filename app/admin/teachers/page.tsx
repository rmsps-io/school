import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Manage Teachers' }

export default async function AdminTeachersPage() {
  const supabase = createClient()
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, employee_id, qualification, experience_yrs, joining_date, profiles(full_name, email, phone, is_active)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Teachers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{teachers?.length ?? 0} total teachers</p>
        </div>
        <Link href="/admin/teachers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <UserPlus className="h-4 w-4" /> Add Teacher
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Teachers</CardTitle></CardHeader>
        <CardContent>
          {!teachers || teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No teachers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 font-medium text-muted-foreground">Employee ID</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Qualification</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Experience</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Joining Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => {
                    const p = (t.profiles as {full_name:string;email:string;phone:string|null;is_active:boolean}[]|null)?.[0]
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <p className="font-medium">{p?.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{p?.email ?? ''}</p>
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{t.employee_id}</td>
                        <td className="py-3 hidden md:table-cell">{t.qualification ?? '—'}</td>
                        <td className="py-3 hidden lg:table-cell">{t.experience_yrs} yr{t.experience_yrs !== 1 ? 's' : ''}</td>
                        <td className="py-3 hidden lg:table-cell">{new Date(t.joining_date).toLocaleDateString('en-IN')}</td>
                        <td className="py-3">
                          <Badge variant={p?.is_active ? 'success' : 'secondary'} className="text-[10px]">
                            {p?.is_active ? 'Active' : 'Inactive'}
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
