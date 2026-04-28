'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface ClassWithSections {
  id: string
  name: string
  numeric_val: number
  sections: { id: string; name: string }[] | null
}

interface Props {
  classes: ClassWithSections[]
}

export function AddStudentFormClient({ classes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const sections = selectedClass?.sections ?? []

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
    const section_id   = data.get('section_id') as string
    const admission_no = (data.get('admission_no') as string).trim()
    const gender       = data.get('gender') as string
    const dob          = (data.get('dob') as string) || null
    const academic_year = new Date().getFullYear().toString()

    if (!full_name || !email || !password || !section_id || !admission_no) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Step 1: Create auth user via sign-up
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

      // Step 2: Get student role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single()

      if (!roleData) {
        setError('Student role not found in database. Please run the SQL schema first.')
        setLoading(false)
        return
      }

      // Step 3: Update profile (created by trigger)
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

      // Step 4: Insert student record
      const { error: studentError } = await supabase.from('students').insert({
        profile_id:    userId,
        admission_no,
        section_id,
        gender:        gender || null,
        date_of_birth: dob,
        admission_date: new Date().toISOString().split('T')[0],
        academic_year,
        is_active: true,
      })

      if (studentError) {
        setError('Failed to create student: ' + studentError.message)
        setLoading(false)
        return
      }

      router.push('/admin/students')
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
          <Input id="full_name" name="full_name" placeholder="e.g. Rahul Kumar" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admission_no">Admission No *</Label>
          <Input id="admission_no" name="admission_no" placeholder="e.g. 2024001" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="student@rmsps.in" required />
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
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" name="dob" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="class_id">Class *</Label>
          <select
            id="class_id"
            name="class_id"
            required
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="section_id">Section *</Label>
        <select
          id="section_id"
          name="section_id"
          required
          disabled={!selectedClassId}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {selectedClassId ? 'Select section' : 'Select class first'}
          </option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              Section {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Student'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/students')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
