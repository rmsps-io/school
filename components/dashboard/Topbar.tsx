'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Sun, Moon, Bell, BellDot, CheckCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type Notification, type Profile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Notification dropdown ────────────────────────────────────
function NotificationPanel({
  notifications,
  onMarkAllRead,
  onClose,
}: {
  notifications: Notification[]
  onMarkAllRead: () => void
  onClose: () => void
}) {
  const unread = notifications.filter((n) => !n.is_read)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-popover text-popover-foreground shadow-lg z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">
          Notifications{' '}
          {unread.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread.length}
            </span>
          )}
        </span>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50',
                !n.is_read && 'bg-primary/5'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                  !n.is_read ? 'bg-primary' : 'bg-transparent'
                )}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {n.body}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

// ── Props ────────────────────────────────────────────────────
interface TopbarProps {
  profile: Profile
  pageTitle: string
  onMobileMenuOpen: () => void
}

// ── Topbar ───────────────────────────────────────────────────
export function Topbar({ profile, pageTitle, onMobileMenuOpen }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Avoid SSR hydration mismatch for theme icon
  useEffect(() => { setMounted(true) }, [])

  // ── Load notifications ──
  const loadNotifications = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotifications(data)
  }, [profile.id])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // ── Realtime: listen for new notifications ──
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  // ── Mark all read ──
  async function handleMarkAllRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      {/* ── Hamburger (mobile) ── */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Page title ── */}
      <h1 className="flex-1 text-base font-semibold text-foreground truncate">
        {pageTitle}
      </h1>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 0 ? (
              <>
                <BellDot className="h-4 w-4 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </AnimatePresence>

          {/* Click outside to close */}
          {showNotifications && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
