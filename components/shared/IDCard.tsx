'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Download, Loader2, CheckCircle } from 'lucide-react'

type IDCardProps = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatarUrl: string | null
  detail1?: string  // e.g. "Employee ID: EMP001"
  detail2?: string  // e.g. "Class 8-A"
  detail3?: string  // e.g. "Admission: 2024"
  showImageUpdate?: boolean
}

export function IDCard({ id, name, email, phone, role, avatarUrl: initAvatar, detail1, detail2, detail3, showImageUpdate = true }: IDCardProps) {
  const [avatarUrl, setAvatarUrl] = useState(initAvatar)
  const [imageInput, setImageInput] = useState('')
  const [savingImg, setSavingImg]   = useState(false)
  const [imgDone, setImgDone]       = useState(false)
  const supabase = createClient()

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const roleColors: Record<string, { bg: string; badge: string; text: string }> = {
    admin:   { bg: 'from-purple-700 to-purple-900', badge: 'bg-purple-500', text: 'text-purple-100' },
    teacher: { bg: 'from-blue-700 to-blue-900',     badge: 'bg-blue-500',   text: 'text-blue-100'   },
    student: { bg: 'from-green-700 to-green-900',   badge: 'bg-green-500',  text: 'text-green-100'  },
    parent:  { bg: 'from-amber-700 to-amber-900',   badge: 'bg-amber-500',  text: 'text-amber-100'  },
  }
  const colors = roleColors[role] ?? roleColors.student

  async function updateAvatar() {
    if (!imageInput.trim()) return
    setSavingImg(true)
    await supabase.from('profiles').update({ avatar_url: imageInput.trim() }).eq('id', id)
    setAvatarUrl(imageInput.trim())
    setImageInput('')
    setImgDone(true)
    setTimeout(() => setImgDone(false), 3000)
    setSavingImg(false)
  }

  return (
    <div className="space-y-4 max-w-sm">
      {/* The Card */}
      <div className={`relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br ${colors.bg} text-white`}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest opacity-70">RMSPS</p>
            <p className="text-[10px] opacity-50">Residential Maa Saraswati Public School</p>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colors.badge} text-white`}>{role}</span>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/20" />

        {/* Main content */}
        <div className="px-5 py-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-xl object-cover border-2 border-white/30" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold border-2 border-white/30">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight truncate">{name}</h3>
            <p className="text-xs opacity-70 mt-0.5 truncate">{email}</p>
            {phone && <p className="text-xs opacity-60 mt-0.5">{phone}</p>}
            {detail1 && <p className="text-xs opacity-80 mt-1 font-medium">{detail1}</p>}
            {detail2 && <p className="text-xs opacity-70">{detail2}</p>}
            {detail3 && <p className="text-xs opacity-60">{detail3}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
            <p className="text-[10px] opacity-60">Kating Chowk, Supaul, Bihar</p>
            <p className="text-[10px] opacity-60">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
      </div>

      {/* Image update */}
      {showImageUpdate && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Photo URL se update karo
          </p>
          {imgDone && (
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Photo updated!</p>
          )}
          <div className="flex gap-2">
            <Input value={imageInput} onChange={e => setImageInput(e.target.value)}
              placeholder="https://example.com/photo.jpg" className="text-xs h-8 flex-1" />
            <Button size="sm" onClick={updateAvatar} disabled={!imageInput.trim() || savingImg} className="h-8 px-3">
              {savingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
