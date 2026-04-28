import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Announcements' }

export default async function StudentAnnouncementsPage() {
  const supabase = createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, type, created_at, profiles(full_name)')
    .eq('is_published', true)
    .in('target_role', ['student', 'all'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Megaphone className="h-5 w-5 text-primary" /></div>
        <div><h2 className="text-xl font-display font-semibold">Announcements</h2><p className="text-sm text-muted-foreground">{announcements?.length ?? 0} announcements</p></div>
      </div>
      <div className="space-y-3">
        {!announcements?.length ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Koi announcement nahi hai.</p>
        ) : announcements.map(a => (
          <Card key={a.id}><CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm">{a.title}</h3>
              <Badge className="text-[10px] capitalize shrink-0">{a.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{a.content}</p>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>By: {(a.profiles as any)?.full_name ?? 'Admin'}</span>
              <span>{new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}
