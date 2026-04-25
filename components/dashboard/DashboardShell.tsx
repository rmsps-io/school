'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { type NavItem } from '@/lib/nav-items'
import { type Profile } from '@/lib/types'

interface DashboardShellProps {
  navItems: NavItem[]
  profile: Profile
  pageTitle: string
  children: React.ReactNode
}

export function DashboardShell({
  navItems,
  profile,
  pageTitle,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        profile={profile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar
          profile={profile}
          pageTitle={pageTitle}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
