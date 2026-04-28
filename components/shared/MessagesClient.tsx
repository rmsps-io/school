'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, Search } from 'lucide-react'

type Profile = { id: string; full_name: string; email: string; roles: { name: string } | null }
type Message = { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string }

export function MessagesClient({ currentUserId, contacts }: { currentUserId: string; contacts: Profile[] }) {
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [newMsg, setNewMsg]       = useState('')
  const [sending, setSending]     = useState(false)
  const [search, setSearch]       = useState('')
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedContact) return
    loadMessages(selectedContact.id)

    const channel = supabase
      .channel('messages:' + selectedContact.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, payload => {
        const msg = payload.new as Message
        if (msg.sender_id === selectedContact.id) {
          setMessages(m => [...m, msg])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedContact])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages(contactId: string) {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${contactId}),` +
        `and(sender_id.eq.${contactId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true })

    setMessages((data ?? []) as Message[])

    // Mark as read
    await supabase.from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', contactId).eq('receiver_id', currentUserId).eq('is_read', false)

    setLoadingMsgs(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !selectedContact || sending) return
    setSending(true)

    const msg = { sender_id: currentUserId, receiver_id: selectedContact.id, content: newMsg.trim() }
    const { data, error } = await supabase.from('messages').insert(msg).select('*').single()

    if (!error && data) {
      setMessages(m => [...m, data as Message])
      setNewMsg('')
    }
    setSending(false)
  }

  const filteredContacts = contacts.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(ts: string) {
    const d = new Date(ts)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    return isToday
      ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Messages</h2>
          <p className="text-sm text-muted-foreground">Direct messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        {/* Contact list */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted-foreground">No contacts</p>
            ) : filteredContacts.map(c => (
              <button key={c.id} onClick={() => setSelectedContact(c)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/40 transition-colors text-left border-b border-border/50 ${selectedContact?.id === c.id ? 'bg-muted/60' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.roles?.name ?? '—'}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Chat window */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedContact ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Koi contact select karo</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {selectedContact.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedContact.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedContact.roles?.name ?? '—'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">Koi message nahi. Pehla message bhejo!</p>
                ) : messages.map(m => {
                  const isMe = m.sender_id === currentUserId
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                        <p className="text-sm break-words">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t border-border">
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Message likho..." className="flex-1 h-9 text-sm" autoComplete="off" />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMsg.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
