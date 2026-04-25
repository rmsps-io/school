'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, GraduationCap, Users, School, BookOpen,
  Calendar, ClipboardList, BarChart2, CalendarCheck, IndianRupee,
  CreditCard, Megaphone, MessageSquare, ShieldCheck, LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { type NavItem } from '@/lib/nav-items'
import { type Profile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

// ── Icon resolver ────────────────────────────────────────────
// Maps icon name string → lucide component
const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, GraduationCap, Users, School, BookOpen,
  Calendar, ClipboardList, BarChart2, CalendarCheck, IndianRupee,
  CreditCard, Megaphone, MessageSquare, ShieldCheck,
}

function NavIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard
  return <Icon className="h-4 w-4 shrink-0" />
}

// ── Sidebar item ─────────────────────────────────────────────
function SidebarItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'text-white'
          : 'text-[hsl(var(--sidebar-muted))] hover:text-white hover:bg-[hsl(var(--sidebar-hover))]'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-[hsl(var(--sidebar-active))]"
          style={{ zIndex: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        <NavIcon name={item.icon} />
      </span>
      <span className="relative z-10">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="relative z-10 ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

// ── Props ────────────────────────────────────────────────────
interface SidebarProps {
  navItems: NavItem[]
  profile: Profile
  mobileOpen: boolean
  onMobileClose: () => void
}

// ── Sidebar ──────────────────────────────────────────────────
export function Sidebar({ navItems, profile, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get initials for avatar fallback
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabel =
    (profile.roles?.name?.charAt(0).toUpperCase() ?? '') +
    (profile.roles?.name?.slice(1) ?? '')

  // ── Sidebar inner content (shared between desktop + mobile) ──
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="w-8 h-8 rounded-lg bg-saffron-500 flex items-center justify-center font-display font-bold text-white text-sm shrink-0">
          R
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-none truncate">RMSPS</p>
          <p className="text-[10px] text-[hsl(var(--sidebar-muted))] leading-none mt-0.5 truncate">
            Kating Chowk, Supaul
          </p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="ml-auto text-[hsl(var(--sidebar-muted))] hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={
              item.href === pathname ||
              // Mark parent active for sub-routes
              (item.href !== `/${profile.roles?.name}` && pathname.startsWith(item.href + '/'))
            }
          />
        ))}
      </nav>

      {/* ── Profile + Logout ── */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            )}
            <AvatarFallback className="bg-royal-700 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate leading-none">
              {profile.full_name}
            </p>
            <p className="text-[11px] text-[hsl(var(--sidebar-muted))] leading-none mt-0.5">
              {roleLabel}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[hsl(var(--sidebar-muted))] hover:text-destructive transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-64 bg-[hsl(var(--sidebar-bg))]"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar (drawer) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--sidebar-bg))] lg:hidden flex flex-col"
              aria-label="Mobile sidebar navigation"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
