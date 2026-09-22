'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { formatCurrency } from '@/lib/utils'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Plus, Search, UtensilsCrossed, Trash2 } from 'lucide-react'
import type { Product, ProductCategory } from '@/types/database'

const EMPTY_FORM = {
  name: '', description: '', category_id: '', selling_price: '',
  cost_price: '', is_available: true,
}

export default function AdminProductsPage() {
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [products,    setProducts]    = useState<Product[]>([])
  const [categories,  setCategories]  = useState<ProductCategory[]>([])
  const [search,      setSearch]      = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [loading,     setLoading]     = useState(true)

  // Add/edit modal
  const [modal,       setModal]       = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  const loadData = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, product_categories(name)').order('name'),
      supabase.from('product_categories').select('*').order('name'),
    ])
    setProducts((prods as any) ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const openAdd = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  const openEdit = (product: Product) => {
    setEditProduct(product)
    setForm({
      name:          product.name,
      description:   product.description ?? '',
      category_id:   product.category_id ?? '',
      selling_price: String(product.selling_price),
      cost_price:    product.cost_price != null ? String(product.cost_price) : '',
      is_available:  product.is_available,
    })
    setModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.selling_price) {
      showError('Name and Selling Price are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim() || null,
        category_id:   form.category_id || null,
        selling_price: parseFloat(form.selling_price),
        cost_price:    form.cost_price ? parseFloat(form.cost_price) : null,
        is_available:  form.is_available,
      }

      if (editProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
        if (error) throw error
        success('Product updated')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        success('Product added')
      }
      setModal(false)
      loadData()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.product) return
    try {
      // Unlink product from order items if needed so order history is preserved
      await supabase.from('order_items').update({ product_id: null }).eq('product_id', deleteDialog.product.id)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteDialog.product.id)
      if (error) throw error
      success(`"${deleteDialog.product.name}" deleted successfully`)
      setDeleteDialog({ open: false, product: null })
      loadData()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
      if (error) throw error
      success(`"${product.name}" marked as ${!product.is_available ? 'Available' : 'Unavailable'}`)
      loadData()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category_id === filterCat
    return matchSearch && matchCat
  })

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="admin-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Menu</h1>
          <p className="page-subtitle">{products.length} items registered</p>
        </div>
        <button
          id="add-product-btn"
          className="btn btn-primary"
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-sm" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            className="form-input"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select
          className="form-select"
          style={{ flex: '0 1 180px' }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-sm)',
                color: 'var(--text-muted)',
              }}
            >
              <UtensilsCrossed size={24} />
            </div>
            <div className="empty-state-title">No products found</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 'var(--space-md)' }}>
              Add Your First Product
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-4">
          {filtered.map((product) => (
            <div key={product.id} className="card card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div className="flex items-center justify-between">
                <span
                  className={`badge ${product.is_available ? 'badge-success' : 'badge-default'}`}
                >
                  {product.is_available ? 'Available' : 'Unavailable'}
                </span>
                {(product as any).product_categories && (
                  <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>
                    {(product as any).product_categories.name}
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{product.name}</div>

              {product.description && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {product.description.slice(0, 60)}…
                </div>
              )}

              <div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.125rem' }}>
                  {formatCurrency(product.selling_price)}
                </div>
                {product.cost_price != null && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Cost: {formatCurrency(product.cost_price)}
                  </div>
                )}
              </div>

              <div className="flex gap-xs items-center" style={{ marginTop: 'auto', paddingTop: 'var(--space-xs)' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(product)}>
                  Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: product.is_available ? 'var(--text-muted)' : 'var(--success)',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                  }}
                  title={product.is_available ? 'Hide product from menu' : 'Show product on menu'}
                  onClick={() => handleToggleAvailability(product)}
                >
                  {product.is_available ? 'Hide' : 'Show'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                  title="Delete product permanently"
                  onClick={() => setDeleteDialog({ open: true, product })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Product Name" required
            placeholder="e.g. Chicken Burger"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Select
            label="Category"
            options={catOptions}
            placeholder="Select category…"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          />
          <div className="form-grid form-grid-2">
            <Input
              label="Selling Price (Rs.)" required type="number" min="0" step="0.01"
              placeholder="0.00"
              value={form.selling_price}
              onChange={(e) => setForm((f) => ({ ...f, selling_price: e.target.value }))}
            />
            <Input
              label="Cost Price (Rs.)" type="number" min="0" step="0.01"
              placeholder="Optional"
              hint="Used for profit reports"
              value={form.cost_price}
              onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Optional description…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="form-group">
            <label className="form-label">Availability</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
              />
              <span style={{ fontSize: '0.9375rem' }}>
                {form.is_available ? '✅ Available for ordering' : '❌ Unavailable'}
              </span>
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteDialog.product?.name}"? Historical orders will keep their records.`}
        confirmLabel="Delete Product"
      />
    </div>
  )
}
