'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle } from 'lucide-react'

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const payload = {
      full_name:          (fd.get('full_name') as string).trim(),
      email:              (fd.get('email') as string).trim().toLowerCase(),
      phone:              (fd.get('phone') as string).trim() || null,
      gender:             fd.get('gender') as string || null,
      date_of_birth:      fd.get('dob') as string || null,
      class_requested:    fd.get('class_requested') as string,
      address:            (fd.get('address') as string).trim() || null,
      guardian_name:      (fd.get('guardian_name') as string).trim() || null,
      guardian_phone:     (fd.get('guardian_phone') as string).trim() || null,
      guardian_relation:  fd.get('guardian_relation') as string || null,
    }

    if (!payload.full_name || !payload.email || !payload.class_requested) {
      setError('Full name, email aur class required hai.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: err } = await supabase.from('registration_requests').insert(payload)

    if (err) {
      if (err.code === '23505') {
        setError('Is email se pehle se request submit ho chuki hai.')
      } else {
        setError('Kuch galat hua: ' + err.message)
      }
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Registration Request Submitted!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Aapki request admin ke paas bhej di gayi hai. Approve hone par notification milega.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b">
        Student Information
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input id="full_name" name="full_name" placeholder="Rahul Kumar" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="rahul@gmail.com" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="+91 98765..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gender">Gender</Label>
          <select name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" name="dob" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="class_requested">Class Applying For *</Label>
          <select name="class_requested" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select Class</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="Village, District, State" />
        </div>
      </div>

      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b pt-2">
        Guardian Information
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="guardian_name">Guardian Name</Label>
          <Input id="guardian_name" name="guardian_name" placeholder="Father / Mother name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="guardian_phone">Guardian Phone</Label>
          <Input id="guardian_phone" name="guardian_phone" placeholder="+91 98765..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="guardian_relation">Relation</Label>
          <select name="guardian_relation" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Registration Request'}
      </Button>
    </form>
  )
}
