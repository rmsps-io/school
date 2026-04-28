import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AddTeacherFormClient } from './AddTeacherFormClient'

export const metadata: Metadata = { title: 'Add New Teacher' }

export default async function AddTeacherPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/teachers"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-display font-semibold">Add New Teacher</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new teacher account and profile
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Teacher Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddTeacherFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
