'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Save, Loader2, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IDCard } from '@/components/shared/IDCard'
import { type Profile } from '@/lib/types'

interface Props {
  profile: Profile
  extraDetail1?: string
  extraDetail2?: string
  extraDetail3?: string
  useRequestFlow?: boolean   // student/teacher use request flow
}

export function ProfilePage({ profile, extraDetail1, extraDetail2, extraDetail3, useRequestFlow = false }: Props) {
  const router    = useRouter()
  const [name,  setName]  = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [msg,   setMsg]   = useState('')
  const [reqDone, setReqDone] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true); setMsg('')

    if (useRequestFlow) {
      // Submit profile update requests for each changed field
      const requests: { field_name: string; old_value: string | null; new_value: string }[] = []
      if (name.trim() !== profile.full_name) requests.push({ field_name: 'full_name', old_value: profile.full_name, new_value: name.trim() })
      if (phone.trim() !== (profile.phone ?? '')) requests.push({ field_name: 'phone', old_value: profile.phone, new_value: phone.trim() })

      if (requests.length === 0) { setMsg('Koi changes nahi kiye.'); setSaving(false); return }

      for (const req of requests) {
        await supabase.from('profile_update_requests').insert({ profile_id: profile.id, ...req })
      }
      setMsg(''); setReqDone(true)
      setTimeout(() => setReqDone(false), 5000)
    } else {
      // Admin: direct save
      const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: phone.trim() || null }).eq('id', profile.id)
      setMsg(error ? '❌ ' + error.message : '✅ Profile updated successfully!')
      if (!error) router.refresh()
    }
    setSaving(false)
  }

  const role = profile.roles?.name ?? 'user'

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">My Profile</h2>
          <p className="text-sm text-muted-foreground capitalize">{role} account</p>
        </div>
      </div>

      {/* ID Card */}
      <IDCard
        id={profile.id}
        name={profile.full_name}
        email={profile.email}
        phone={profile.phone}
        role={role}
        avatarUrl={profile.avatar_url}
        detail1={extraDetail1}
        detail2={extraDetail2}
        detail3={extraDetail3}
        showImageUpdate={!useRequestFlow}
      />

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {useRequestFlow ? 'Request Profile Update' : 'Edit Profile'}
          </CardTitle>
          {useRequestFlow && (
            <p className="text-xs text-muted-foreground mt-0.5">Changes request mein jayenge — admin approve karega</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {reqDone && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
              <Send className="h-4 w-4 shrink-0" />
              Request submit ho gayi! Admin approve karega.
            </div>
          )}
          {msg && <p className="text-sm text-muted-foreground bg-muted/30 rounded px-3 py-2">{msg}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="full_name" value={name} onChange={e => setName(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" value={profile.email} disabled className="pl-9 opacity-60" />
            </div>
            <p className="text-xs text-muted-foreground">Email change nahi ho sakta.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="pl-9" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              : useRequestFlow
                ? <><Send className="h-4 w-4 mr-2" />Submit Request</>
                : <><Save className="h-4 w-4 mr-2" />Save Changes</>
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
