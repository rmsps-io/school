import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { School } from 'lucide-react'

export const metadata: Metadata = { title: 'Classes & Sections' }

export default async function AdminClassesPage() {
  const supabase = createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, numeric_val, sections(id, name, capacity)')
    .order('numeric_val', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Classes & Sections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{classes?.length ?? 0} classes</p>
        </div>
      </div>

      {!classes || classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No classes found. Please run the SQL schema first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const sections = cls.sections as {id:string;name:string;capacity:number}[] | null ?? []
            return (
              <Card key={cls.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <School className="h-4 w-4 text-primary" />
                    Class {cls.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sections</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sections.map((sec) => (
                        <div key={sec.id} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5">
                          <Badge variant="secondary" className="text-[10px]">Section {sec.name}</Badge>
                          <span className="text-xs text-muted-foreground">Cap: {sec.capacity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
