import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AddStudentFormClient } from './AddStudentFormClient'

export const metadata: Metadata = { title: 'Add New Student' }

export default async function AddStudentPage() {
  const supabase = createClient()

  // Fetch classes and sections for the form
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, numeric_val, sections(id, name)')
    .order('numeric_val', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/students"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-display font-semibold">Add New Student</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new student account and profile
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddStudentFormClient classes={classes ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
