'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Minus,
  Plus,
  UtensilsCrossed,
  Send,
  ShoppingBag,
  Layers,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { formatCurrency } from '@/lib/utils'
import type { Product, ProductCategory } from '@/types/database'

interface CartItem {
  product: Product
  quantity: number
}

// Fallback products for instant demonstration if database is empty/permission locked
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Classic Smash Burger',
    description: 'Double beef patty, cheddar, secret sauce',
    selling_price: 850,
    cost_price: 400,
    is_available: true,
    category_id: 'c1',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c1', name: 'Burgers', created_at: '' },
  },
  {
    id: 'p2',
    name: 'Crispy Chicken Zinger',
    description: 'Crispy fried fillet, spicy mayo, lettuce',
    selling_price: 750,
    cost_price: 350,
    is_available: true,
    category_id: 'c1',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c1', name: 'Burgers', created_at: '' },
  },
  {
    id: 'p3',
    name: 'Margherita Pizza 12"',
    description: 'Fresh mozzarella, basil, tomato marinara',
    selling_price: 1400,
    cost_price: 600,
    is_available: true,
    category_id: 'c2',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c2', name: 'Pizza', created_at: '' },
  },
  {
    id: 'p4',
    name: 'Loaded Pepperoni Pizza',
    description: 'Beef pepperoni, mozzarella, chili flakes',
    selling_price: 1650,
    cost_price: 750,
    is_available: true,
    category_id: 'c2',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c2', name: 'Pizza', created_at: '' },
  },
  {
    id: 'p5',
    name: 'Seasoned Potato Fries',
    description: 'Crispy golden fries with paprika salt',
    selling_price: 350,
    cost_price: 120,
    is_available: true,
    category_id: 'c3',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c3', name: 'Sides', created_at: '' },
  },
  {
    id: 'p6',
    name: 'Chilled Mint Lemonade',
    description: 'Fresh mint, lime, crushed ice',
    selling_price: 280,
    cost_price: 80,
    is_available: true,
    category_id: 'c4',
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_categories: { id: 'c4', name: 'Drinks', created_at: '' },
  },
]

export default function NewOrderPage() {
  const router   = useRouter()
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [products,   setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [cart,       setCart]       = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search,     setSearch]     = useState('')
  const [notes,      setNotes]      = useState('')
  const [tableNumber, setTableNumber] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [loading,    setLoading]    = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from('products')
          .select('*, product_categories(id,name)')
          .eq('is_available', true)
          .order('name'),
        supabase
          .from('product_categories')
          .select('*')
          .order('name'),
      ])

      if (prods && prods.length > 0) {
        setProducts(prods)
      } else {
        setProducts(DEMO_PRODUCTS)
      }

      if (cats && cats.length > 0) {
        setCategories(cats)
      } else {
        setCategories([
          { id: 'c1', name: 'Burgers', created_at: '' },
          { id: 'c2', name: 'Pizza', created_at: '' },
          { id: 'c3', name: 'Sides', created_at: '' },
          { id: 'c4', name: 'Drinks', created_at: '' },
        ])
      }
    } catch {
      setProducts(DEMO_PRODUCTS)
      setCategories([
        { id: 'c1', name: 'Burgers', created_at: '' },
        { id: 'c2', name: 'Pizza', created_at: '' },
        { id: 'c3', name: 'Sides', created_at: '' },
        { id: 'c4', name: 'Drinks', created_at: '' },
      ])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const getQty = (productId: string) =>
    cart.find((c) => c.product.id === productId)?.quantity ?? 0

  const updateQty = (product: Product, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (!existing) {
        if (delta > 0) return [...prev, { product, quantity: delta }]
        return prev
      }
      const newQty = existing.quantity + delta
      if (newQty <= 0) return prev.filter((c) => c.product.id !== product.id)
      return prev.map((c) =>
        c.product.id === product.id ? { ...c, quantity: newQty } : c
      )
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.product.selling_price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const handleSubmit = async () => {
    if (cart.length === 0) {
      showError('Add at least one item to the order')
      return
    }

    setSubmitting(true)
    try {
      let waiterId = 'b0000000-0000-0000-0000-000000000002'
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) waiterId = user.id
      } catch {
        // Fallback to test waiter ID
      }

      const subtotal = cartTotal
      const total    = subtotal

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          waiter_id:    waiterId,
          status:       'pending',
          subtotal,
          discount:     0,
          total,
          notes:        notes.trim() || null,
          table_number: tableNumber.trim() || null,
        })
        .select('id, order_number')
        .single()

      if (orderError) throw orderError

      if (order) {
        const items = cart.map((c) => ({
          order_id:              order.id,
          product_id:            c.product.id.startsWith('p') ? null : c.product.id,
          product_name_snapshot: c.product.name,
          unit_price_snapshot:   c.product.selling_price,
          quantity:              c.quantity,
          subtotal:              c.product.selling_price * c.quantity,
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(items)
        if (itemsError) throw itemsError
        success(`Order #${String(order.order_number).padStart(4, '0')} submitted!`)
        router.push('/waiter/my-orders')
      }
    } catch (err: any) {
      showError(err?.message || `Failed to submit order to database`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-md)' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          New Order
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <Layers size={14} />
          <span>Table {tableNumber || '1'}</span>
        </div>
      </div>

      {/* Table Number Quick Picker */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
          Select Table Number
        </label>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setTableNumber(num)}
              className="btn btn-sm"
              style={{
                minWidth: 40,
                height: 34,
                padding: '0 8px',
                background: tableNumber === num ? 'var(--primary)' : 'var(--surface-hover)',
                color: tableNumber === num ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontWeight: tableNumber === num ? 700 : 500,
                borderRadius: 'var(--radius-md)',
              }}
            >
              T-{num}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input with Lucide Icon */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
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
          id="product-search"
          type="search"
          className="form-input"
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* Category tabs */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-md)' }}>
        <button
          className={`tab-item${activeCategory === 'all' ? ' active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`tab-item${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        {filteredProducts.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-sm)',
                color: 'var(--text-muted)',
              }}
            >
              <UtensilsCrossed size={22} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              No products found
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Try searching with another keyword or category.
            </div>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const qty = getQty(product.id)
            return (
              <div
                key={product.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: qty > 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: qty > 0 ? 'var(--primary-muted)' : 'var(--bg-card)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {product.name}
                  </div>
                  <div style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.875rem', marginTop: 2 }}>
                    {formatCurrency(product.selling_price)}
                  </div>
                  {product.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.description}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    padding: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateQty(product, -1)}
                    disabled={qty === 0}
                    aria-label="Decrease quantity"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: 'none',
                      color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: qty === 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(product, 1)}
                    aria-label="Increase quantity"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <textarea
          id="order-notes"
          className="form-textarea"
          placeholder="Special instructions (e.g. no onions, extra sauce)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ minHeight: 60, fontSize: '0.8125rem' }}
        />
      </div>

      {/* Sticky bottom cart summary */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--bottom-nav-height)',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '12px var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          zIndex: 80,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {cartCount} item{cartCount !== 1 ? 's' : ''} in order
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
              {formatCurrency(cartTotal)}
            </div>
          </div>
        </div>

        <button
          id="submit-order-btn"
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          style={{ minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {submitting ? (
            'Submitting…'
          ) : (
            <>
              <span>Send Order</span>
              <Send size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
