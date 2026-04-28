import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to RMSPS School Management System',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[hsl(var(--sidebar-bg))] p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron-500 flex items-center justify-center font-display font-bold text-white text-lg">
            R
          </div>
          <span className="font-display text-xl text-white">RMSPS</span>
        </div>

        {/* Quote */}
        <div className="space-y-4">
          <blockquote className="text-2xl font-display leading-snug text-white/90">
            &ldquo;Education is the most powerful weapon which you can use to
            change the world.&rdquo;
          </blockquote>
          <p className="text-white/50 text-sm">— Nelson Mandela</p>
        </div>

        {/* School info */}
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Residential Maa Saraswati Public School
          </p>
          <p className="text-white/50 text-sm">Kating Chowk, Supaul, Bihar</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-display font-bold text-white">
              R
            </div>
            <span className="font-display text-lg text-foreground">RMSPS</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-display text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your school account
            </p>
          </div>

          {/* Client form */}
          <LoginForm />

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Having trouble?{' '}
            <a
              href="mailto:admin@rmsps.in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Contact administrator
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
