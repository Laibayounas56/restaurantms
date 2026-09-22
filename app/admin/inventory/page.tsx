'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import type { InventoryItem, StockMovement } from '@/types/database'

type View = 'stock' | 'stock-in' | 'stock-out' | 'history'

const STOCK_OUT_REASONS = [
  { value: 'Used in restaurant', label: 'Used in restaurant' },
  { value: 'Damaged',  label: 'Damaged' },
  { value: 'Expired',  label: 'Expired' },
  { value: 'Wasted',   label: 'Wasted' },
  { value: 'Other',    label: 'Other' },
]

const UNIT_OPTIONS = [
  { value: 'kg',    label: 'Kilograms (kg)' },
  { value: 'g',     label: 'Grams (g)' },
  { value: 'L',     label: 'Liters (L)' },
  { value: 'ml',    label: 'Milliliters (ml)' },
  { value: 'pcs',   label: 'Pieces (pcs)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box',   label: 'Box' },
  { value: 'pack',  label: 'Pack' },
  { value: 'other', label: 'Other' },
]

export default function AdminInventoryPage() {
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [view,      setView]      = useState<View>('stock')
  const [items,     setItems]     = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading,   setLoading]   = useState(true)

  // Item modal
  const [itemModal,    setItemModal]    = useState(false)
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null)
  const [itemForm,     setItemForm]     = useState({ name: '', category: '', unit: 'kg', minimum_quantity: '0', purchase_price: '', supplier_name: '' })

  // Stock-in form
  const [stockInForm,  setStockInForm]  = useState({ item_id: '', quantity: '', purchase_price: '', notes: '', date: new Date().toISOString().split('T')[0] })

  // Stock-out form
  const [stockOutForm, setStockOutForm] = useState({ item_id: '', quantity: '', reason: 'Used in restaurant', notes: '', date: new Date().toISOString().split('T')[0] })

  const [saving,   setSaving]   = useState(false)

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('inventory_items').select('*').eq('is_active', true).order('name')
    setItems(
      (data ?? []).map((i: any) => ({ ...i, is_low_stock: i.current_quantity <= i.minimum_quantity }))
    )
    setLoading(false)
  }, [supabase])

  const loadMovements = useCallback(async () => {
    const { data } = await supabase
      .from('stock_movements')
      .select('*, inventory_items(id, name, unit), profiles(id, name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setMovements(data ?? [])
  }, [supabase])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { if (view === 'history') loadMovements() }, [view, loadMovements])

  const openAddItem = () => {
    setEditItem(null)
    setItemForm({ name: '', category: '', unit: 'kg', minimum_quantity: '0', purchase_price: '', supplier_name: '' })
    setItemModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name) { showError('Item name is required'); return }
    setSaving(true)
    try {
      const payload = {
        name:             itemForm.name.trim(),
        category:         itemForm.category.trim() || null,
        unit:             itemForm.unit,
        minimum_quantity: parseFloat(itemForm.minimum_quantity) || 0,
        purchase_price:   itemForm.purchase_price ? parseFloat(itemForm.purchase_price) : null,
        supplier_name:    itemForm.supplier_name.trim() || null,
      }
      if (editItem) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editItem.id)
        if (error) throw error
        success('Item updated')
      } else {
        const { error } = await supabase.from('inventory_items').insert({ ...payload, current_quantity: 0 })
        if (error) throw error
        success('Item added')
      }
      setItemModal(false)
      loadItems()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockInForm.item_id || !stockInForm.quantity) { showError('Item and quantity are required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc('record_stock_movement', {
        p_item_id:      stockInForm.item_id,
        p_type:         'IN',
        p_quantity:     parseFloat(stockInForm.quantity),
        p_reason:       `Purchase – ${stockInForm.date}`,
        p_notes:        stockInForm.notes || null,
        p_performed_by: user?.id,
      })
      if (error) throw error
      success('Stock added successfully')
      setStockInForm(f => ({ ...f, item_id: '', quantity: '', notes: '' }))
      loadItems()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockOutForm.item_id || !stockOutForm.quantity) { showError('Item and quantity are required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.rpc('record_stock_movement', {
        p_item_id:      stockOutForm.item_id,
        p_type:         'OUT',
        p_quantity:     parseFloat(stockOutForm.quantity),
        p_reason:       stockOutForm.reason,
        p_notes:        stockOutForm.notes || null,
        p_performed_by: user?.id,
      })
      if (error) throw error
      success('Stock removed successfully')
      setStockOutForm(f => ({ ...f, item_id: '', quantity: '', notes: '' }))
      loadItems()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const itemOptions = items.map((i) => ({ value: i.id, label: `${i.name} (${i.current_quantity} ${i.unit})` }))

  const VIEWS: { key: View; label: string }[] = [
    { key: 'stock',     label: 'Current Stock' },
    { key: 'stock-in',  label: '+ Stock In' },
    { key: 'stock-out', label: '− Stock Out' },
    { key: 'history',   label: 'History' },
  ]

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {items.length} items · {items.filter((i) => i.is_low_stock).length} low stock
          </p>
        </div>
        {view === 'stock' && (
          <button className="btn btn-primary" onClick={openAddItem}>+ Add Item</button>
        )}
      </div>

      <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`tab-item${view === v.key ? ' active' : ''}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Current Stock */}
      {view === 'stock' && (
        loading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th><th>Category</th><th>Current Qty</th>
                  <th>Min Level</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.category ?? '—'}</td>
                    <td style={{ fontWeight: 600, color: item.is_low_stock ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {item.current_quantity} {item.unit}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.minimum_quantity} {item.unit}</td>
                    <td>
                      {item.is_low_stock ? (
                        <span className="badge badge-danger">⚠ Low Stock</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditItem(item)
                          setItemForm({
                            name: item.name, category: item.category ?? '',
                            unit: item.unit,
                            minimum_quantity: String(item.minimum_quantity),
                            purchase_price: item.purchase_price != null ? String(item.purchase_price) : '',
                            supplier_name: item.supplier_name ?? '',
                          })
                          setItemModal(true)
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Stock In */}
      {view === 'stock-in' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Record Stock In</h3>
          <form onSubmit={handleStockIn} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Select label="Item" required options={itemOptions} placeholder="Select item…"
              value={stockInForm.item_id}
              onChange={(e) => setStockInForm(f => ({ ...f, item_id: e.target.value }))} />
            <div className="form-grid form-grid-2">
              <Input label="Quantity" required type="number" min="0.001" step="any"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm(f => ({ ...f, quantity: e.target.value }))} />
              <Input label="Purchase Price (Rs.)" type="number" min="0" step="any" placeholder="Optional"
                value={stockInForm.purchase_price}
                onChange={(e) => setStockInForm(f => ({ ...f, purchase_price: e.target.value }))} />
            </div>
            <Input label="Date" required type="date" value={stockInForm.date}
              onChange={(e) => setStockInForm(f => ({ ...f, date: e.target.value }))} />
            <Textarea label="Notes" placeholder="e.g. Weekly purchase" value={stockInForm.notes}
              onChange={(e) => setStockInForm(f => ({ ...f, notes: e.target.value }))} />
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Saving…' : '+ Record Stock In'}
            </button>
          </form>
        </div>
      )}

      {/* Stock Out */}
      {view === 'stock-out' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Record Stock Out</h3>
          <form onSubmit={handleStockOut} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Select label="Item" required options={itemOptions} placeholder="Select item…"
              value={stockOutForm.item_id}
              onChange={(e) => setStockOutForm(f => ({ ...f, item_id: e.target.value }))} />
            <div className="form-grid form-grid-2">
              <Input label="Quantity" required type="number" min="0.001" step="any"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm(f => ({ ...f, quantity: e.target.value }))} />
              <Select label="Reason" required options={STOCK_OUT_REASONS}
                value={stockOutForm.reason}
                onChange={(e) => setStockOutForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <Input label="Date" required type="date" value={stockOutForm.date}
              onChange={(e) => setStockOutForm(f => ({ ...f, date: e.target.value }))} />
            <Textarea label="Notes" placeholder="Optional" value={stockOutForm.notes}
              onChange={(e) => setStockOutForm(f => ({ ...f, notes: e.target.value }))} />
            <button type="submit" className="btn btn-danger" disabled={saving}>
              {saving ? 'Saving…' : '− Record Stock Out'}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      {view === 'history' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Item</th><th>Type</th>
                <th>Qty</th><th>Before</th><th>After</th>
                <th>Reason</th><th>By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(m.created_at).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{(m as any).inventory_items?.name ?? '—'}</td>
                  <td>
                    <span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                      {m.type === 'IN' ? '+ IN' : '− OUT'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{m.quantity} {(m as any).inventory_items?.unit}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.previous_quantity}</td>
                  <td style={{ color: m.type === 'IN' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {m.new_quantity}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{m.reason ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {(m as any).profiles?.name ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setItemModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveItem} disabled={saving}>
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input label="Item Name" required placeholder="e.g. Cooking Oil"
            value={itemForm.name}
            onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Input label="Category" placeholder="e.g. Ingredients"
              value={itemForm.category}
              onChange={(e) => setItemForm(f => ({ ...f, category: e.target.value }))} />
            <Select label="Unit" required options={UNIT_OPTIONS}
              value={itemForm.unit}
              onChange={(e) => setItemForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <Input label="Minimum Stock Level" type="number" min="0" step="any"
            hint="Alert when stock falls below this"
            value={itemForm.minimum_quantity}
            onChange={(e) => setItemForm(f => ({ ...f, minimum_quantity: e.target.value }))} />
          <Input label="Supplier Name" placeholder="Optional"
            value={itemForm.supplier_name}
            onChange={(e) => setItemForm(f => ({ ...f, supplier_name: e.target.value }))} />
        </form>
      </Modal>
    </div>
  )
}
