export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
}

export interface Item {
  id: string
  name: string
  icon: string
  quantity: number
  min_stock_threshold: number
  unit: string
  category: string | null
  supplier_id: string | null
  created_at: string
  supplier?: Supplier | null
}

export interface UsageLog {
  id: string
  item_id: string
  quantity_used: number
  used_at: string
  note: string | null
  item?: Pick<Item, 'id' | 'name' | 'icon' | 'unit'>
}

export interface UsageEntry {
  item_id: string
  quantity_used: number
  note?: string
}
