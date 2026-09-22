'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/FormFields'
import { formatCurrency } from '@/lib/utils'
import { UserPlus, CalendarPlus, Wallet, Users, Calendar, Pencil } from 'lucide-react'
import type { Employee, Shift, SalaryPayment } from '@/types/database'

type View = 'employees' | 'shifts' | 'salaries'

const ROLE_OPTIONS = [
  { value: 'Waiter',   label: 'Waiter' },
  { value: 'Manager',  label: 'Manager' },
  { value: 'Cook',     label: 'Cook' },
  { value: 'Cashier',  label: 'Cashier' },
  { value: 'Cleaner',  label: 'Cleaner' },
  { value: 'Other',    label: 'Other' },
]

const SALARY_TYPE_OPTIONS = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'daily',     label: 'Daily' },
  { value: 'per_shift', label: 'Per Shift' },
]

const SHIFT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed',    label: 'Missed' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid',    label: 'Paid' },
]

export default function AdminEmployeesPage() {
  const supabase = createClient()
  const { success, error: showError } = useToast()

  const [view,      setView]      = useState<View>('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts,    setShifts]    = useState<Shift[]>([])
  const [salaries,  setSalaries]  = useState<SalaryPayment[]>([])
  const [loading,   setLoading]   = useState(true)

  // Modals
  const [empModal,    setEmpModal]    = useState(false)
  const [shiftModal,  setShiftModal]  = useState(false)
  const [salaryModal, setSalaryModal] = useState(false)
  const [editEmp,     setEditEmp]     = useState<Employee | null>(null)
  const [saving,      setSaving]      = useState(false)

  const [empForm, setEmpForm] = useState({
    name: '', phone: '', role: 'Waiter',
    joining_date: '', salary_type: 'monthly', salary_amount: '',
  })

  const [shiftForm, setShiftForm] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0],
    start_time: '10:00', end_time: '18:00', status: 'scheduled', notes: '',
  })

  const [salaryForm, setSalaryForm] = useState({
    employee_id: '', amount: '', period_start: '', period_end: '',
    payment_date: new Date().toISOString().split('T')[0], status: 'pending', notes: '',
  })

  const loadData = useCallback(async () => {
    const [{ data: emps }, { data: sh }, { data: sal }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('shifts').select('*, employees(id,name,role)').order('date', { ascending: false }).limit(50),
      supabase.from('salary_payments').select('*, employees(id,name)').order('created_at', { ascending: false }).limit(50),
    ])
    setEmployees(emps ?? [])
    setShifts(sh ?? [])
    setSalaries(sal ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const openAddEmp = () => {
    setEditEmp(null)
    setEmpForm({ name: '', phone: '', role: 'Waiter', joining_date: '', salary_type: 'monthly', salary_amount: '' })
    setEmpModal(true)
  }

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empForm.name) { showError('Name is required'); return }
    setSaving(true)
    try {
      const payload = {
        name:          empForm.name.trim(),
        phone:         empForm.phone.trim() || null,
        role:          empForm.role,
        joining_date:  empForm.joining_date || null,
        salary_type:   empForm.salary_type as any,
        salary_amount: parseFloat(empForm.salary_amount) || 0,
      }
      if (editEmp) {
        const { error } = await supabase.from('employees').update(payload).eq('id', editEmp.id)
        if (error) throw error
        success('Employee updated')
      } else {
        const { error } = await supabase.from('employees').insert(payload)
        if (error) throw error
        success('Employee added')
      }
      setEmpModal(false)
      loadData()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftForm.employee_id) { showError('Employee is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('shifts').insert({
        employee_id: shiftForm.employee_id,
        date:        shiftForm.date,
        start_time:  shiftForm.start_time,
        end_time:    shiftForm.end_time,
        status:      shiftForm.status as any,
        notes:       shiftForm.notes || null,
      })
      if (error) throw error
      success('Shift created')
      setShiftModal(false)
      loadData()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salaryForm.employee_id || !salaryForm.amount) { showError('Employee and amount are required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('salary_payments').insert({
        employee_id:  salaryForm.employee_id,
        amount:       parseFloat(salaryForm.amount),
        period_start: salaryForm.period_start,
        period_end:   salaryForm.period_end,
        payment_date: salaryForm.payment_date || null,
        status:       salaryForm.status as any,
        notes:        salaryForm.notes || null,
      })
      if (error) throw error
      success('Salary payment recorded')
      setSalaryModal(false)
      loadData()
    } catch (err: any) { showError(err.message) }
    finally { setSaving(false) }
  }

  const empOptions = employees.filter(e => e.is_active).map(e => ({ value: e.id, label: e.name }))

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.filter(e => e.is_active).length} active employees</p>
        </div>
        {view === 'employees' && (
          <button className="btn btn-primary" onClick={openAddEmp} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        )}
        {view === 'shifts' && (
          <button className="btn btn-primary" onClick={() => setShiftModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarPlus size={16} />
            <span>Add Shift</span>
          </button>
        )}
        {view === 'salaries' && (
          <button className="btn btn-primary" onClick={() => setSalaryModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet size={16} />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { key: 'employees', label: 'Staff Directory', icon: Users },
          { key: 'shifts',    label: 'Shift Schedule',  icon: Calendar },
          { key: 'salaries',  label: 'Salary Ledger',   icon: Wallet },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-item${view === key ? ' active' : ''}`}
            onClick={() => setView(key as View)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Employees */}
      {view === 'employees' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Phone</th>
                <th>Salary</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td><span className="badge badge-info">{emp.role}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{emp.phone ?? '—'}</td>
                  <td>
                    {formatCurrency(emp.salary_amount)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                      / {emp.salary_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-default'}`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditEmp(emp)
                        setEmpForm({
                          name: emp.name, phone: emp.phone ?? '', role: emp.role,
                          joining_date: emp.joining_date ?? '',
                          salary_type: emp.salary_type, salary_amount: String(emp.salary_amount),
                        })
                        setEmpModal(true)
                      }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shifts */}
      {view === 'shifts' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Date</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {shifts.map((shift: any) => (
                <tr key={shift.id}>
                  <td style={{ fontWeight: 600 }}>{shift.employees?.name ?? '—'}</td>
                  <td><span className="badge badge-info">{shift.employees?.role}</span></td>
                  <td>{new Date(shift.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{shift.start_time} – {shift.end_time}</td>
                  <td>
                    <span className={`badge ${shift.status === 'completed' ? 'badge-success' : shift.status === 'missed' ? 'badge-danger' : 'badge-info'}`}>
                      {shift.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary Payments */}
      {view === 'salaries' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Employee</th><th>Amount</th><th>Period</th><th>Payment Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {salaries.map((s: any) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.employees?.name ?? '—'}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(s.amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {s.period_start} – {s.period_end}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.payment_date ?? '—'}</td>
                  <td>
                    <span className={`badge ${s.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee Modal */}
      <Modal open={empModal} onClose={() => setEmpModal(false)}
        title={editEmp ? 'Edit Employee' : 'Add Employee'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEmpModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEmp} disabled={saving}>
              {saving ? 'Saving…' : editEmp ? 'Save' : 'Add'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveEmp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input label="Name" required value={empForm.name}
            onChange={(e) => setEmpForm(f => ({ ...f, name: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Input label="Phone" value={empForm.phone}
              onChange={(e) => setEmpForm(f => ({ ...f, phone: e.target.value }))} />
            <Select label="Role" required options={ROLE_OPTIONS} value={empForm.role}
              onChange={(e) => setEmpForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <Input label="Joining Date" type="date" value={empForm.joining_date}
            onChange={(e) => setEmpForm(f => ({ ...f, joining_date: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Select label="Salary Type" required options={SALARY_TYPE_OPTIONS} value={empForm.salary_type}
              onChange={(e) => setEmpForm(f => ({ ...f, salary_type: e.target.value }))} />
            <Input label="Salary Amount (Rs.)" type="number" min="0" step="any" value={empForm.salary_amount}
              onChange={(e) => setEmpForm(f => ({ ...f, salary_amount: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Shift Modal */}
      <Modal open={shiftModal} onClose={() => setShiftModal(false)} title="Add Shift"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShiftModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveShift} disabled={saving}>
              {saving ? 'Saving…' : 'Add Shift'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Select label="Employee" required options={empOptions} placeholder="Select employee…"
            value={shiftForm.employee_id}
            onChange={(e) => setShiftForm(f => ({ ...f, employee_id: e.target.value }))} />
          <Input label="Date" required type="date" value={shiftForm.date}
            onChange={(e) => setShiftForm(f => ({ ...f, date: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Input label="Start Time" required type="time" value={shiftForm.start_time}
              onChange={(e) => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
            <Input label="End Time" required type="time" value={shiftForm.end_time}
              onChange={(e) => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
          </div>
          <Select label="Status" required options={SHIFT_STATUS_OPTIONS} value={shiftForm.status}
            onChange={(e) => setShiftForm(f => ({ ...f, status: e.target.value }))} />
        </form>
      </Modal>

      {/* Salary Modal */}
      <Modal open={salaryModal} onClose={() => setSalaryModal(false)} title="Record Salary Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSalaryModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveSalary} disabled={saving}>
              {saving ? 'Saving…' : 'Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveSalary} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Select label="Employee" required options={empOptions} placeholder="Select employee…"
            value={salaryForm.employee_id}
            onChange={(e) => setSalaryForm(f => ({ ...f, employee_id: e.target.value }))} />
          <Input label="Amount (Rs.)" required type="number" min="0" step="any" value={salaryForm.amount}
            onChange={(e) => setSalaryForm(f => ({ ...f, amount: e.target.value }))} />
          <div className="form-grid form-grid-2">
            <Input label="Period Start" required type="date" value={salaryForm.period_start}
              onChange={(e) => setSalaryForm(f => ({ ...f, period_start: e.target.value }))} />
            <Input label="Period End" required type="date" value={salaryForm.period_end}
              onChange={(e) => setSalaryForm(f => ({ ...f, period_end: e.target.value }))} />
          </div>
          <div className="form-grid form-grid-2">
            <Input label="Payment Date" type="date" value={salaryForm.payment_date}
              onChange={(e) => setSalaryForm(f => ({ ...f, payment_date: e.target.value }))} />
            <Select label="Status" required options={PAYMENT_STATUS_OPTIONS} value={salaryForm.status}
              onChange={(e) => setSalaryForm(f => ({ ...f, status: e.target.value }))} />
          </div>
          <Textarea label="Notes" placeholder="Optional" value={salaryForm.notes}
            onChange={(e) => setSalaryForm(f => ({ ...f, notes: e.target.value }))} />
        </form>
      </Modal>
    </div>
  )
}
