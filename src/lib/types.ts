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

export interface Category {
  id: string
  name: string
}

export interface ItemSupplierJoin {
  id: string
  item_id: string
  supplier_id: string
  supplier?: Supplier | null
}

export interface Item {
  id: string
  name: string
  icon: string
  quantity: number
  min_stock_threshold: number
  unit: string
  category: string | null
  supplier_id: string | null   // kept for migration compatibility, prefer item_suppliers
  created_at: string
  // Many-to-many suppliers via junction table
  item_suppliers?: ItemSupplierJoin[]
  // Legacy single-supplier join (may still appear in some queries)
  supplier?: Supplier | null
}

export interface UsageLog {
  id: string
  item_id: string
  quantity_used: number
  used_at: string
  note: string | null
  type?: string
  cost_per_unit?: number | null
  supplier_id?: string | null
  // Joined fields
  item?: Pick<Item, 'id' | 'name' | 'icon' | 'unit'>
  supplier?: Pick<Supplier, 'id' | 'name'> | null
}

export interface UsageEntry {
  item_id: string
  quantity_used: number
  note?: string
}

export interface RestockOrderItem {
  item_name: string
  quantity: number
  cost_per_unit: number
  line_total: number
}

export interface RestockOrder {
  id: string
  date: string
  supplier_name: string
  item_count: number
  total_cost: number
  items: RestockOrderItem[]
}
