'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type Profile } from '@/lib/types'

interface Props { profile: Profile }

export function ProfilePage({ profile }: Props) {
  const router  = useRouter()
  const [name,  setName]  = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [msg,   setMsg]   = useState('')

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const role     = profile.roles?.name ?? 'user'
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', profile.id)

    if (error) { setMsg('Failed to save. Please try again.') }
    else       { setMsg('Profile updated successfully!'); router.refresh() }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-display font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your personal information</p>
      </motion.div>

      {/* Avatar card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <Avatar className="h-16 w-16">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Edit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="full_name" value={name} onChange={e => setName(e.target.value)} className="pl-10" placeholder="Your full name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" value={profile.email} disabled className="pl-10 opacity-60" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.includes('success') ? 'text-green-600' : 'text-destructive'}`}>{msg}</p>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
