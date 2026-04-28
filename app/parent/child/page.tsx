import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = { title: 'My Child' }

export default async function ParentChildPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: parent } = await supabase
    .from('parents')
    .select('relation, student_id, students(id, admission_no, roll_no, gender, blood_group, address, date_of_birth, admission_date, academic_year, sections(name, classes(name)), profiles(full_name, email, phone))')
    .eq('profile_id', user!.id).single()

  const student = (parent?.students as {id:string;admission_no:string;roll_no:string|null;gender:string|null;blood_group:string|null;address:string|null;date_of_birth:string|null;admission_date:string;academic_year:string;sections:{name:string;classes:{name:string}[]|null}[]|null;profiles:{full_name:string;email:string;phone:string|null}[]|null}|null)
  const profile = student?.profiles?.[0]
  const section = student?.sections?.[0]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">My Child</h2>

      {!student ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Child profile not linked. Contact admin.</CardContent></Card>
      ) : (
        <>
          <Card className="bg-gradient-to-r from-royal-700 to-royal-900 border-0">
            <CardContent className="p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold">{profile?.full_name ?? '—'}</h3>
                  <p className="text-white/70 text-sm mt-0.5">Class {section?.classes?.[0]?.name ?? '—'} – Section {section?.name ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">Adm: {student.admission_no}</Badge>
                    {student.roll_no && <Badge className="bg-white/20 text-white border-0 text-[10px]">Roll: {student.roll_no}</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label:'Date of Birth',    value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : '—' },
              { label:'Gender',           value: student.gender ?? '—' },
              { label:'Blood Group',      value: student.blood_group ?? '—' },
              { label:'Admission Date',   value: new Date(student.admission_date).toLocaleDateString('en-IN') },
              { label:'Academic Year',    value: student.academic_year },
              { label:'Contact',          value: profile?.phone ?? '—' },
              { label:'Email',            value: profile?.email ?? '—' },
              { label:'Address',          value: student.address ?? '—' },
            ].map(field => (
              <Card key={field.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="text-sm font-medium mt-1 capitalize">{field.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
