'use client'

import { useState } from 'react'
import { UsageLog } from '@/lib/types'

interface Props {
  logs: UsageLog[]
  items: { id: string; name: string; icon: string }[]
}

export default function UsageLogTable({ logs, items }: Props) {
  const [filterItem, setFilterItem] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const filtered = logs.filter(log => {
    if (filterItem && log.item_id !== filterItem) return false
    if (filterFrom && new Date(log.used_at) < new Date(filterFrom)) return false
    if (filterTo && new Date(log.used_at) > new Date(filterTo + 'T23:59:59')) return false
    return true
  })

  const totalUsed = filtered.reduce((sum, l) => sum + l.quantity_used, 0)

  function fmt(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Item</label>
          <select
            value={filterItem}
            onChange={e => setFilterItem(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          >
            <option value="">All items</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.icon} {i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">From</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">To</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        {(filterItem || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterItem(''); setFilterFrom(''); setFilterTo('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors"
          >
            Clear filters
          </button>
        )}
        <div className="flex-1 text-right text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{filtered.length}</span> entries · <span className="font-semibold text-teal-600">{totalUsed}</span> total units used
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty Used</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {log.item ? (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{log.item.icon}</span>
                      {log.item.name}
                    </span>
                  ) : <span className="text-gray-400 italic">Deleted item</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-teal-600">{log.quantity_used}</span>
                  {log.item?.unit && <span className="text-gray-400 text-xs ml-1">{log.item.unit}</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {fmt(log.used_at)}
                </td>
                <td className="px-4 py-3 text-gray-400 italic">
                  {log.note ?? '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="font-medium">No usage records{(filterItem || filterFrom || filterTo) ? ' for selected filters' : ' yet'}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
