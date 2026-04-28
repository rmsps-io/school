import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Manage Students' }

export default async function AdminStudentsPage() {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, admission_no, roll_no, is_active, admission_date, gender, profiles(full_name, email, phone), sections(name, classes(name))')
    .order('created_at', { ascending: false })

  const total  = students?.length ?? 0
  const active = students?.filter((s) => s.is_active).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Students</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{active} active of {total} total</p>
        </div>
        <Link
          href="/admin/students/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Add Student
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Students</CardTitle>
        </CardHeader>
        <CardContent>
          {!students || students.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No students found. Add your first student.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 font-medium text-muted-foreground">Adm No</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Class</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Gender</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const profile = (s.profiles as {full_name:string;email:string;phone:string|null}[]|null)?.[0]
                    const section = (s.sections as {name:string;classes:{name:string}[]|null}[]|null)?.[0]
                    return (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{profile?.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email ?? ''}</p>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                        <td className="py-3 hidden md:table-cell">
                          {section?.classes?.[0]?.name ?? '—'} {section?.name ?? ''}
                        </td>
                        <td className="py-3 capitalize hidden lg:table-cell">{s.gender ?? '—'}</td>
                        <td className="py-3 hidden lg:table-cell">{profile?.phone ?? '—'}</td>
                        <td className="py-3">
                          <Badge variant={s.is_active ? 'success' : 'secondary'} className="text-[10px]">
                            {s.is_active ? 'Active' : 'Inactive'}
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
