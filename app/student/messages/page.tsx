import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export const metadata: Metadata = { title: 'Messages' }

export default async function StudentMessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, is_read, created_at, sender:sender_id(full_name), receiver:receiver_id(full_name)')
    .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">Messages</h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> My Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!messages || messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {messages.map(m => {
                const sender   = (m.sender as {full_name:string}[]|null)?.[0]?.full_name ?? '—'
                const receiver = (m.receiver as {full_name:string}[]|null)?.[0]?.full_name ?? '—'
                return (
                  <div key={m.id} className={`rounded-lg border p-3 ${!m.is_read ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{sender}</span> → {receiver}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString('en-IN', {dateStyle:'short',timeStyle:'short'})}</p>
                    </div>
                    <p className="text-sm line-clamp-2">{m.content}</p>
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
