'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { IndianRupee, Plus, Trash2, X, Loader2 } from 'lucide-react'

type Fee = { id: string; class_id: string; fee_type: string; amount: number; frequency: string; academic_year: string; description: string | null; classes: { name: string } | null }
type Class = { id: string; name: string }

const FEE_TYPES = ['tuition','hostel','transport','library','lab','sports','other']
const FREQUENCIES = ['monthly','quarterly','half_yearly','annual','one_time']

export function AdminFeesClient({ fees: init, classes }: { fees: Fee[]; classes: Class[] }) {
  const [fees, setFees]       = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('')
  const supabase = createClient()

  const [classId, setClassId]   = useState('')
  const [feeType, setFeeType]   = useState('tuition')
  const [amount, setAmount]     = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [year, setYear]         = useState(new Date().getFullYear().toString())
  const [desc, setDesc]         = useState('')

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 3000) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!classId || !amount) { flash('❌ Class aur amount required hai.'); return }
    setLoading('add')
    const { data, error } = await supabase.from('fees').insert({
      class_id: classId, fee_type: feeType, amount: parseFloat(amount),
      frequency, academic_year: year, description: desc.trim() || null,
    }).select('id, class_id, fee_type, amount, frequency, academic_year, description, classes(name)').single()

    if (error) { flash('❌ ' + error.message) }
    else {
      setFees(f => [data as Fee, ...f])
      setClassId(''); setAmount(''); setDesc('')
      setShowForm(false); flash('✅ Fee added!')
    }
    setLoading(null)
  }

  async function deleteFee(id: string) {
    if (!confirm('Delete this fee entry?')) return
    setLoading(id)
    await supabase.from('fees').delete().eq('id', id)
    setFees(f => f.filter(x => x.id !== id))
    setLoading(null)
  }

  const filtered = fees.filter(f => !filterClass || f.class_id === filterClass)
  const totalAmount = filtered.reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Fee Structure</h2>
            <p className="text-sm text-muted-foreground">{fees.length} entries</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? 'Cancel' : 'Add Fee'}
        </Button>
      </div>

      {msg && <p className="text-sm rounded px-3 py-2 bg-muted/40">{msg}</p>}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <Select value={classId} onChange={e => setClassId(e.target.value)} required>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>Class {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fee Type</Label>
                  <Select value={feeType} onChange={e => setFeeType(e.target.value)}>
                    {FEE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₹) *</Label>
                  <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1500" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={frequency} onChange={e => setFrequency(e.target.value)}>
                    {FREQUENCIES.map(f => <option key={f} value={f} className="capitalize">{f.replace('_', ' ')}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Academic Year</Label>
                  <Input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional note" />
                </div>
              </div>
              <Button type="submit" disabled={loading === 'add'} size="sm">
                {loading === 'add' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</> : 'Add Fee'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilterClass('')} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!filterClass ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>All</button>
        {classes.map(c => (
          <button key={c.id} onClick={() => setFilterClass(c.id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterClass === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            Class {c.name}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-sm font-medium">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Year</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Koi fee entry nahi.</td></tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">Class {(f.classes as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{f.fee_type}</td>
                  <td className="px-4 py-3 font-medium">₹{f.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{f.frequency.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.academic_year}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" disabled={loading === f.id} onClick={() => deleteFee(f.id)}>
                      {loading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
