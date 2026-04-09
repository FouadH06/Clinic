'use client'

import { useState, useEffect, useCallback } from 'react'
import { Item, UsageEntry } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import ItemCard from './ItemCard'
import BottomBar from './BottomBar'
import LowStockBanner from './LowStockBanner'

interface Props {
  initialItems: Item[]
}

export default function ItemGrid({ initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selected, setSelected] = useState<Record<string, number>>({}) // item_id → qty to use
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const supabase = createClient()

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(item =>
                item.id === (payload.new as Item).id
                  ? { ...item, ...(payload.new as Item) }
                  : item
              )
            )
          } else if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as Item])
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== (payload.old as Item).id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  function toggleItem(item: Item) {
    setSelected(prev => {
      if (prev[item.id] !== undefined) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: 1 }
    })
  }

  function setQty(itemId: string, qty: number) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const clamped = Math.max(0, Math.min(qty, item.quantity))
    if (clamped === 0) {
      setSelected(prev => { const n = { ...prev }; delete n[itemId]; return n })
    } else {
      setSelected(prev => ({ ...prev, [itemId]: clamped }))
    }
  }

  function clearSelection() {
    setSelected({})
  }

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  async function handleSubmit(entries: UsageEntry[], note: string) {
    if (entries.length === 0) return
    setSubmitting(true)

    try {
      // Deduct quantities & log usage
      await Promise.all(
        entries.map(async ({ item_id, quantity_used }) => {
          const item = items.find(i => i.id === item_id)!
          const newQty = Math.max(0, item.quantity - quantity_used)

          await supabase
            .from('items')
            .update({ quantity: newQty })
            .eq('id', item_id)

          await supabase.from('usage_log').insert({
            item_id,
            quantity_used,
            note: note || null,
          })
        })
      )

      showToast(`✅ Used ${entries.length} item${entries.length !== 1 ? 's' : ''} — logged!`)
      clearSelection()
    } catch (err) {
      showToast('❌ Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedItems = Object.entries(selected).map(([id, qty]) => ({
    item: items.find(i => i.id === id)!,
    qty,
  })).filter(x => x.item)

  return (
    <div className="relative">
      <LowStockBanner items={items} />

      {/* Search / filter could go here */}
      <div className="max-w-6xl mx-auto px-4 py-4 md:px-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selected[item.id] !== undefined}
              onClick={() => toggleItem(item)}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-lg font-medium">No items yet</p>
              <p className="text-sm mt-1">Add items in the Inventory tab</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <BottomBar
        selectedItems={selectedItems}
        onQtyChange={setQty}
        onClear={clearSelection}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl z-50 animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Spacer for bottom bar & nav */}
      <div className={`transition-all ${selectedItems.length > 0 ? 'h-64' : 'h-20'}`} />
    </div>
  )
}
