'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function AddTeacherFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    const full_name    = (data.get('full_name') as string).trim()
    const email        = (data.get('email') as string).trim().toLowerCase()
    const password     = data.get('password') as string
    const phone        = (data.get('phone') as string).trim() || null
    const employee_id  = (data.get('employee_id') as string).trim()
    const qualification = (data.get('qualification') as string).trim() || null
    const experience_yrs = Number(data.get('experience_yrs')) || 0
    const joining_date = (data.get('joining_date') as string) || new Date().toISOString().split('T')[0]

    if (!full_name || !email || !password || !employee_id) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } },
      })

      if (authError || !authData.user) {
        setError(authError?.message ?? 'Failed to create user account.')
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // Step 2: Get teacher role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single()

      if (!roleData) {
        setError('Teacher role not found in database.')
        setLoading(false)
        return
      }

      // Step 3: Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone,
          role_id: roleData.id,
          is_active: true,
        })
        .eq('id', userId)

      if (profileError) {
        setError('Failed to update profile: ' + profileError.message)
        setLoading(false)
        return
      }

      // Step 4: Insert teacher record
      const { error: teacherError } = await supabase.from('teachers').insert({
        profile_id:     userId,
        employee_id,
        qualification,
        experience_yrs,
        joining_date,
      })

      if (teacherError) {
        setError('Failed to create teacher: ' + teacherError.message)
        setLoading(false)
        return
      }

      router.push('/admin/teachers')
      router.refresh()
    } catch (err) {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input id="full_name" name="full_name" placeholder="e.g. Priya Sharma" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employee_id">Employee ID *</Label>
          <Input id="employee_id" name="employee_id" placeholder="e.g. EMP001" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="teacher@rmsps.in" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password *</Label>
          <Input id="password" name="password" type="password" placeholder="Min. 6 characters" required minLength={6} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="joining_date">Joining Date</Label>
          <Input id="joining_date" name="joining_date" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" name="qualification" placeholder="e.g. M.Sc, B.Ed" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience_yrs">Experience (Years)</Label>
          <Input id="experience_yrs" name="experience_yrs" type="number" min="0" placeholder="0" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Teacher'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/teachers')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
