'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import { formatCurrency } from '@/lib/utils'
import { Plus, Receipt } from 'lucide-react'
import type { Expense, ExpenseCategory } from '@/types/database'

export default function AdminExpensesPage() {
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [expenses,   setExpenses]   = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null })

  // Filters
  const [filterCat,   setFilterCat]   = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd,   setFilterEnd]   = useState('')

  const [form, setForm] = useState({
    category_id: '', amount: '', date: new Date().toISOString().split('T')[0], description: '',
  })

  const loadData = useCallback(async () => {
    const [{ data: exps }, { data: cats }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, expense_categories(id,name)')
        .order('date', { ascending: false }),
      supabase.from('expense_categories').select('*').order('name'),
    ])
    setExpenses(exps ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const openAdd = () => {
    setEditExpense(null)
    setForm({ category_id: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' })
    setModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.date) { showError('Amount and date are required'); return }
    if (parseFloat(form.amount) <= 0) { showError('Amount must be greater than zero'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        category_id: form.category_id || null,
        amount:      parseFloat(form.amount),
        date:        form.date,
        description: form.description.trim() || null,
        created_by:  user?.id,
      }
      if (editExpense) {
        await supabase.from('expenses').update(payload).eq('id', editExpense.id)
        success('Expense updated')
      } else {
        await supabase.from('expenses').insert(payload)
        success('Expense recorded')
      }
      setModal(false)
      loadData()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteDialog.expense) return
    const { error } = await supabase.from('expenses').delete().eq('id', deleteDialog.expense.id)
    if (error) { showError(error.message); return }
    success('Expense deleted')
    setDeleteDialog({ open: false, expense: null })
    loadData()
  }

  const filtered = expenses.filter((e: any) => {
    const matchCat   = !filterCat   || e.category_id === filterCat
    const matchStart = !filterStart || e.date >= filterStart
    const matchEnd   = !filterEnd   || e.date <= filterEnd
    return matchCat && matchStart && matchEnd
  })

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0)
  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            {filtered.length} records · Total: {formatCurrency(totalFiltered)}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card card-sm flex gap-sm" style={{ marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 160px' }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.75rem' }}>Category</label>
          <select className="form-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.75rem' }}>From</label>
          <input type="date" className="form-input" value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.75rem' }}>To</label>
          <input type="date" className="form-input" value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)} />
        </div>
        {(filterCat || filterStart || filterEnd) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCat(''); setFilterStart(''); setFilterEnd('') }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
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
              <Receipt size={24} />
            </div>
            <div className="empty-state-title">No expenses recorded</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 'var(--space-md)' }}>
              Record First Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((expense: any) => (
                <tr key={expense.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {new Date(expense.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {expense.expense_categories
                      ? <span className="badge badge-info">{expense.expense_categories.name}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {expense.description ?? '—'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(expense.amount)}</td>
                  <td>
                    <div className="flex gap-sm">
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditExpense(expense)
                          setForm({
                            category_id: expense.category_id ?? '', amount: String(expense.amount),
                            date: expense.date, description: expense.description ?? '',
                          })
                          setModal(true)
                        }}>
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteDialog({ open: true, expense })}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editExpense ? 'Edit Expense' : 'Add Expense'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editExpense ? 'Save' : 'Add Expense'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Select label="Category" options={catOptions} placeholder="Select category…"
            value={form.category_id}
            onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Input label="Amount (Rs.)" required type="number" min="0.01" step="any"
              value={form.amount}
              onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Input label="Date" required type="date" value={form.date}
              onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <Textarea label="Description" placeholder="e.g. September electricity bill"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, expense: null })}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="This expense will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
