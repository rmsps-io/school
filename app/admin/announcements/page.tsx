import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Announcements' }

export default async function AdminAnnouncementsPage() {
  const supabase = createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, type, target_role, is_published, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  const typeColor: Record<string, 'default'|'destructive'|'warning'|'secondary'|'success'> = {
    urgent: 'destructive', exam: 'warning', holiday: 'secondary',
    general: 'default', event: 'default', fee: 'warning',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold">Announcements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{announcements?.length ?? 0} total</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> All Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!announcements || announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => {
                const author = (a.profiles as {full_name:string}[]|null)?.[0]?.full_name ?? 'System'
                return (
                  <div key={a.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{a.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={typeColor[a.type] ?? 'default'} className="text-[10px] capitalize">{a.type}</Badge>
                        <Badge variant={a.is_published ? 'success' : 'secondary'} className="text-[10px]">
                          {a.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>By: {author}</span>
                      <span>For: {a.target_role ?? 'All'}</span>
                      <span>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
