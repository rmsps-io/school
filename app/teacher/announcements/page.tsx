import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Announcements' }

export default async function TeacherAnnouncementsPage() {
  const supabase = createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, content, type, created_at')
    .or('target_role.eq.teacher,target_role.eq.all')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">Announcements</h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> For Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!announcements || announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-sm">{a.title}</p>
                    <Badge variant="secondary" className="text-[10px] capitalize">{a.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
