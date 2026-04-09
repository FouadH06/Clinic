'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Item, UsageEntry } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import ItemCard from './ItemCard'
import BottomBar from './BottomBar'
import LowStockSidebar from './LowStockSidebar'

interface Props {
  initialItems: Item[]
}

export default function ItemGrid({ initialItems }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const supabase = createClient()

  // Categories derived from items
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))] as string[]
    return cats.sort()
  }, [items])

  // Filtered items
  const visibleItems = useMemo(() => {
    let list = items
    if (activeCategory !== 'all') list = list.filter(i => i.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q))
    }
    return list
  }, [items, activeCategory, search])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item =>
            item.id === (payload.new as Item).id ? { ...item, ...(payload.new as Item) } : item
          ))
        } else if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, payload.new as Item])
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== (payload.old as Item).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Quantity helpers
  function addOne(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item || item.quantity === 0) return
    setSelected(prev => {
      const current = prev[itemId] ?? 0
      const next = Math.min(current + 1, item.quantity)
      return { ...prev, [itemId]: next }
    })
  }

  function removeOne(itemId: string) {
    setSelected(prev => {
      const current = prev[itemId] ?? 0
      if (current <= 1) {
        const n = { ...prev }
        delete n[itemId]
        return n
      }
      return { ...prev, [itemId]: current - 1 }
    })
  }

  function clearItem(itemId: string) {
    setSelected(prev => {
      const n = { ...prev }
      delete n[itemId]
      return n
    })
  }

  function clearSelection() { setSelected({}) }

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }, [])

  async function handleSubmit(entries: UsageEntry[], note: string) {
    if (entries.length === 0) return
    setSubmitting(true)

    // Optimistically update stock counts immediately
    setItems(prev => {
      const next = [...prev]
      entries.forEach(({ item_id, quantity_used }) => {
        const idx = next.findIndex(i => i.id === item_id)
        if (idx !== -1) {
          next[idx] = { ...next[idx], quantity: Math.max(0, next[idx].quantity - quantity_used) }
        }
      })
      return next
    })

    try {
      await Promise.all(
        entries.map(async ({ item_id, quantity_used }) => {
          const item = items.find(i => i.id === item_id)!
          const newQty = Math.max(0, item.quantity - quantity_used)
          await supabase.from('items').update({ quantity: newQty }).eq('id', item_id)
          await supabase.from('usage_log').insert({ item_id, quantity_used, note: note || null })
        })
      )
      showToast(`${entries.length} item${entries.length !== 1 ? 's' : ''} deducted`, true)
      clearSelection()
    } catch {
      showToast('Something went wrong. Please try again.', false)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedItems = useMemo(() =>
    Object.entries(selected).map(([id, qty]) => {
      const item = items.find(i => i.id === id)
      if (!item) return null
      return { item, qty: Math.min(qty, item.quantity) }
    }).filter(Boolean) as { item: Item; qty: number }[]
  , [selected, items])

  const hasItems = items.length > 0

  return (
    <div className="relative">
      <div className="w-full px-4 md:px-4 pt-5 pb-4 flex flex-col md:flex-row gap-4 items-start">

        {/* ── Left Sidebar ── */}
        <div className="w-full md:w-52 shrink-0 flex flex-col gap-2">

          {/* Low stock compact alert — above search */}
          <LowStockSidebar items={items} />

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 h-10 text-sm font-medium bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-400 text-slate-900 transition-shadow hover:border-slate-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category buttons */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible scrollbar-hide">
            {(['all', ...categories] as string[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 text-left px-3.5 py-2.5 text-sm rounded-xl transition-all font-semibold ${
                  activeCategory === cat
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-500 hover:text-teal-700'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right Grid ── */}
        <div className="flex-1 min-w-0 w-full">
          {visibleItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  qty={selected[item.id] ?? 0}
                  onAdd={() => addOne(item.id)}
                  onRemove={() => removeOne(item.id)}
                />
              ))}
            </div>
          ) : hasItems ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
              <p className="text-[15px] text-slate-500 font-semibold">No items match your search</p>
              <button onClick={() => { setSearch(''); setActiveCategory('all') }} className="text-[13px] font-bold text-teal-700 hover:text-teal-800 hover:underline mt-2">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl text-center py-24 shadow-sm">
              <div className="flex justify-center mb-4 text-slate-300">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-[15px] font-bold text-slate-700">No items in inventory</p>
              <p className="text-[13px] font-medium text-slate-500 mt-1">Add items from the Inventory tab to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Bottom Action Bar */}
      <BottomBar
        selectedItems={selectedItems}
        onClear={clearSelection}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-[120px] md:bottom-20 left-1/2 -translate-x-1/2 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl z-50 animate-fade-in whitespace-nowrap ${
          toast.ok ? 'bg-slate-900' : 'bg-red-700'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Spacer for bottom bar */}
      <div className={`transition-all duration-300 ${selectedItems.length > 0 ? 'h-24' : 'h-20'}`} />
    </div>
  )
}
