import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-3xl font-display font-bold text-primary">R</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}
