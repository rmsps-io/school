'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Moon, Sun, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [current,    setCurrent]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [confirmPass,setConfirmPass]= useState('')
  const [loading,    setLoading]    = useState(false)
  const [msg,        setMsg]        = useState('')

  async function handlePasswordChange() {
    if (!newPass || newPass !== confirmPass) {
      setMsg('Passwords do not match.')
      return
    }
    if (newPass.length < 6) {
      setMsg('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) setMsg(error.message)
    else {
      setMsg('Password changed successfully!')
      setCurrent(''); setNewPass(''); setConfirmPass('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-display font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings</p>
      </motion.div>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently: {theme === 'dark' ? 'Dark' : 'Light'} mode
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <><Sun className="h-4 w-4 mr-1.5" /> Light</> : <><Moon className="h-4 w-4 mr-1.5" /> Dark</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_pass">New Password</Label>
            <Input id="new_pass" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_pass">Confirm New Password</Label>
            <Input id="confirm_pass" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repeat new password" />
          </div>
          {msg && (
            <p className={`text-sm ${msg.includes('success') ? 'text-green-600' : 'text-destructive'}`}>{msg}</p>
          )}
          <Button onClick={handlePasswordChange} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><ShieldCheck className="h-4 w-4" /> Update Password</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
