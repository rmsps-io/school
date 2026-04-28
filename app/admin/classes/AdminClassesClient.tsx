'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { School, Plus, Trash2, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

type Section = { id: string; name: string; capacity: number }
type Class   = { id: string; name: string; numeric_val: number; sections: Section[] }

export function AdminClassesClient({ classes: init }: { classes: Class[] }) {
  const [classes, setClasses] = useState(init)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showSecForm, setShowSecForm] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const supabase = createClient()

  // Class form
  const [className, setClassName] = useState('')
  const [classNum, setClassNum]   = useState('')
  // Section form
  const [secName, setSecName]   = useState('')
  const [secCap, setSecCap]     = useState('40')

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  async function addClass(e: React.FormEvent) {
    e.preventDefault()
    setLoading('class')
    const { data, error } = await supabase.from('classes').insert({ name: className.trim(), numeric_val: parseInt(classNum) || 0 }).select('id, name, numeric_val').single()
    if (error) { flash('❌ ' + error.message) }
    else {
      setClasses(c => [...c, { ...(data as Class), sections: [] }].sort((a, b) => a.numeric_val - b.numeric_val))
      setClassName(''); setClassNum(''); setShowClassForm(false)
      flash('✅ Class added!')
    }
    setLoading(null)
  }

  async function deleteClass(id: string) {
    if (!confirm('Delete this class? All sections will also be deleted.')) return
    setLoading(id)
    await supabase.from('classes').delete().eq('id', id)
    setClasses(c => c.filter(x => x.id !== id))
    setLoading(null)
  }

  async function addSection(e: React.FormEvent, classId: string) {
    e.preventDefault()
    setLoading('sec_' + classId)
    const { data, error } = await supabase.from('sections').insert({ class_id: classId, name: secName.trim(), capacity: parseInt(secCap) || 40 }).select('id, name, capacity').single()
    if (error) { flash('❌ ' + error.message) }
    else {
      setClasses(c => c.map(x => x.id === classId ? { ...x, sections: [...x.sections, data as Section] } : x))
      setSecName(''); setSecCap('40'); setShowSecForm(null)
      flash('✅ Section added!')
    }
    setLoading(null)
  }

  async function deleteSection(classId: string, secId: string) {
    if (!confirm('Delete this section?')) return
    setLoading(secId)
    await supabase.from('sections').delete().eq('id', secId)
    setClasses(c => c.map(x => x.id === classId ? { ...x, sections: x.sections.filter(s => s.id !== secId) } : x))
    setLoading(null)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Classes & Sections</h2>
            <p className="text-sm text-muted-foreground">{classes.length} classes</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowClassForm(s => !s)}>
          {showClassForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showClassForm ? 'Cancel' : 'Add Class'}
        </Button>
      </div>

      {msg && <p className="text-sm rounded px-3 py-2 bg-muted/40">{msg}</p>}

      {showClassForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <form onSubmit={addClass} className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <Label>Class Name *</Label>
                <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. 8" required />
              </div>
              <div className="space-y-1.5 w-28">
                <Label>Sort Order</Label>
                <Input type="number" value={classNum} onChange={e => setClassNum(e.target.value)} placeholder="8" />
              </div>
              <Button type="submit" disabled={loading === 'class'} className="mb-0">
                {loading === 'class' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {classes.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Koi class nahi hai. Upar se add karo.</p>
        ) : classes.map(cls => (
          <Card key={cls.id}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <button onClick={() => toggleExpand(cls.id)} className="flex items-center gap-2 text-left flex-1">
                  {expanded.has(cls.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-semibold">Class {cls.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({cls.sections.length} sections)</span>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowSecForm(showSecForm === cls.id ? null : cls.id); setExpanded(e => { const n = new Set(e); n.add(cls.id); return n }) }}>
                    <Plus className="h-3 w-3 mr-1" /> Section
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" disabled={loading === cls.id} onClick={() => deleteClass(cls.id)}>
                    {loading === cls.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expanded.has(cls.id) && (
              <CardContent className="pt-0 pb-3 px-4 space-y-3">
                {showSecForm === cls.id && (
                  <form onSubmit={e => addSection(e, cls.id)} className="flex items-end gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">Section Name</Label>
                      <Input value={secName} onChange={e => setSecName(e.target.value)} placeholder="e.g. A" required className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5 w-24">
                      <Label className="text-xs">Capacity</Label>
                      <Input type="number" value={secCap} onChange={e => setSecCap(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <Button type="submit" size="sm" disabled={loading === 'sec_' + cls.id} className="h-8">
                      {loading === 'sec_' + cls.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setShowSecForm(null)}><X className="h-3 w-3" /></Button>
                  </form>
                )}
                {cls.sections.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Koi section nahi. "+ Section" se add karo.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cls.sections.map(sec => (
                      <div key={sec.id} className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                        <span className="font-medium">Section {sec.name}</span>
                        <span className="text-xs text-muted-foreground">({sec.capacity} seats)</span>
                        <button onClick={() => deleteSection(cls.id, sec.id)} disabled={loading === sec.id} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                          {loading === sec.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
