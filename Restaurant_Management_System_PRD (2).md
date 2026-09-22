# Restaurant Management System — Product Requirements Document (PRD)

**Version:** 1.0  
**Platform:** Mobile-Facing Responsive Web Application  
**Project Type:** Restaurant Management / Digitalization of Paper-Based Operations  
**Primary Users:** Administrator, Waiter  
**Scope:** MVP

---

## 1. Product Overview

The Restaurant Management System is a mobile-facing responsive web application designed for restaurants that currently manage operations manually using paper records. The MVP will be accessed through a mobile web browser rather than requiring a native Android/iOS application.

The system will digitalize seven core operational areas:

1. Dashboard
2. Inventory Management
3. Product/Menu Management
4. Order & Sales Management
5. Employee Management
6. Expense Management
7. Reports

The web application will have two user roles:

- **Administrator** — manages the restaurant's products, inventory, employees, expenses, reports, and incoming orders.
- **Waiter** — takes customer orders and submits them digitally to the Administrator.

The primary goal is to replace repetitive paper-based recording and manual calculations with a centralized system.

---

# 2. User Roles

## 2.1 Administrator

The Administrator has access to the complete system.

### Permissions

- View dashboard
- View and manage orders
- Add/edit/delete products
- Manage inventory
- Record stock in/out
- View stock history
- Manage employees
- Manage shifts
- Configure salaries
- Record expenses
- View sales reports
- View expense reports
- View profit reports when product costs are configured
- View stock reports
- View order history
- Manage waiter accounts
- Configure restaurant settings

---

## 2.2 Waiter

The Waiter has a restricted mobile-facing web interface focused primarily on taking orders.

### Permissions

- Log in
- View available products/menu
- Create a new order
- Add/remove products from an order
- Change quantities
- Add order notes
- Submit an order
- View their active/submitted orders
- View order status

### Restrictions

The Waiter cannot:

- Change product prices
- Change inventory
- Add stock
- Remove stock
- Edit expenses
- View financial reports
- Edit employee salaries
- Delete products
- Access administrator settings

---

# 3. Core Application Flow

The primary restaurant workflow is:

```text
Waiter
   |
   | Takes customer order
   v
Create Order
   |
   | Submit
   v
Administrator Dashboard
   |
   | Reviews incoming order
   v
Order Processing
   |
   | Completed
   v
Sale Recorded
   |
   +----> Sales Reports
   |
   +----> Product Sales Statistics
   |
   +----> Optional Profit Calculation
```

Inventory operates separately in the MVP:

```text
Stock In
   |
   v
Current Inventory
   |
   v
Stock Out
   |
   v
Inventory Reports
```

Expenses:

```text
Expense Entry
   |
   v
Expense Records
   |
   v
Expense Reports
   |
   v
Profit Calculation
```

Employee management:

```text
Employee
   |
   +----> Shift
   |
   +----> Salary
```

---

# 4. Feature 1 — Administrator Dashboard

## 4.1 Purpose

The dashboard provides the Administrator with a quick overview of the restaurant's current operations.

It should be the first screen displayed after Administrator login.

## 4.2 Dashboard Cards

The dashboard should display:

### Today's Sales

- Total revenue generated today
- Based on completed orders

### Today's Orders

- Number of completed orders today

### Pending Orders

- Number of orders currently waiting for administrator action

### Today's Expenses

- Total expenses recorded today

### Estimated Profit

Only displayed when product costs have been configured.

```text
Estimated Profit =
Sales Revenue - Product Cost - Expenses
```

### Low Stock Items

- Number of inventory items currently below their minimum stock level

### Employees / Active Staff

- Number of employees currently scheduled or active for the day

---

## 4.3 Incoming Order Section

The Administrator dashboard must have a prominent **Incoming Orders** section.

Each new waiter order should appear here immediately after submission.

Each order should show:

- Order ID
- Waiter name
- Order time
- Items
- Quantities
- Total amount
- Order notes
- Current status

Example:

```text
ORDER #1042
Waiter: Ali
Time: 7:42 PM

2x Chicken Burger
1x Fries
2x Coke

Total: Rs. 1,450

[Accept] [Complete]
```

---

## 4.4 Order Statuses

The MVP should use:

```text
Pending
   ↓
Accepted
   ↓
Completed
```

Optional:

```text
Pending → Rejected
```

The Administrator can change the status.

The Waiter can see the updated status of orders they submitted.

---

# 5. Feature 2 — Inventory Management

## 5.1 Purpose

Inventory management replaces paper-based stock records.

The Administrator can manually record stock entering and leaving the restaurant.

---

## 5.2 Inventory Item

Each inventory item should contain:

- Item ID
- Item name
- Category
- Unit
- Current quantity
- Minimum stock level
- Optional purchase price
- Optional supplier name
- Created date
- Updated date
- Active/inactive status

### Example

```text
Item: Cooking Oil
Category: Ingredients
Unit: Liter
Current Quantity: 18 L
Minimum Stock: 5 L
```

---

## 5.3 Stock In

The Administrator can record incoming stock.

Required fields:

- Item
- Quantity
- Unit
- Purchase price (optional)
- Date
- Notes

Example:

```text
Stock In

Item: Cooking Oil
Quantity: 10 L
Purchase Price: Rs. 6,000
Date: 22 Sep 2026
Notes: Weekly purchase
```

After saving:

```text
Previous Stock: 8 L
Added: 10 L
New Stock: 18 L
```

---

## 5.4 Stock Out

The Administrator can manually record stock leaving inventory.

Required fields:

- Item
- Quantity
- Reason
- Date
- Notes

Possible reasons:

- Used in restaurant
- Damaged
- Expired
- Wasted
- Other

Example:

```text
Stock Out

Item: Cooking Oil
Quantity: 2 L
Reason: Used in restaurant
Date: 22 Sep 2026
```

---

## 5.5 Stock History

Every stock movement must be recorded.

Each record should contain:

- Item
- Movement type: IN / OUT
- Quantity
- Previous quantity
- New quantity
- Reason
- Date/time
- User who performed the action

The Administrator should be able to filter history by:

- Item
- Movement type
- Date range

---

## 5.6 Low Stock

Each inventory item can have a minimum stock level.

Example:

```text
Current: 3 kg
Minimum: 5 kg
```

The system should mark the item as **Low Stock**.

The dashboard should display low-stock items.

---

# 6. Feature 3 — Product/Menu Management

## 6.1 Purpose

Products represent the food/drink items that the restaurant sells.

These products are used by Waiters when taking customer orders.

---

## 6.2 Product Fields

Each product should contain:

- Product ID
- Product name
- Product image (optional)
- Description (optional)
- Category
- Selling price
- Cost price (optional)
- Availability status
- Created date
- Updated date

Example:

```text
Chicken Burger

Description:
Grilled chicken burger with cheese and sauce.

Selling Price:
Rs. 650

Cost:
Rs. 380

Status:
Available
```

---

## 6.3 Cost Price

Cost price is optional.

If configured:

```text
Product Profit =
Selling Price - Cost Price
```

If cost is not configured, the system must still allow the product to be sold normally.

The application should not assume missing cost = zero.

Instead, reports should clearly indicate that profit is unavailable/incomplete for products without cost data.

---

## 6.4 Product Categories

Administrator can create categories such as:

- Burgers
- Pizza
- Fast Food
- Drinks
- Desserts
- Other

Waiters should be able to filter products by category when taking orders.

---

## 6.5 Product Availability

Administrator can mark a product as:

```text
Available
Unavailable
```

Unavailable products must not be selectable when a Waiter creates a new order.

This is useful when an item is temporarily out of stock.

---

# 7. Feature 4 — Order & Sales Management

## 7.1 Purpose

This is the main operational workflow connecting Waiters and Administrators.

The Waiter records customer orders through the mobile application.

The submitted order immediately becomes visible to the Administrator.

---

## 7.2 Waiter Order Screen

The Waiter should see the following mobile-optimized interface:

```text
Search products

Categories:
[All] [Burgers] [Pizza] [Drinks] ...

Products:
--------------------------------
Chicken Burger       Rs. 650
[ - ]  1  [ + ]

Beef Burger          Rs. 700
[ - ]  0  [ + ]

Fries                Rs. 250
[ - ]  2  [ + ]
--------------------------------

Order Total: Rs. 1,150

[Submit Order]
```

---

## 7.3 Creating an Order

When creating an order, the Waiter can:

- Select products
- Increase/decrease quantities
- Remove items
- Add order notes
- Review total
- Submit order

Optional basic information:

- Table number
- Customer/order reference

---

## 7.4 Order Validation

Before submission:

- Order must contain at least one product
- Product must currently be available
- Quantity must be greater than zero
- Total must be calculated by the system
- Waiter identity must be attached automatically

The Waiter should not manually enter the total.

---

## 7.5 Order Submission

After the Waiter presses **Submit Order**:

1. Order is stored in the database.
2. A unique Order ID is generated.
3. Waiter information is attached.
4. Product quantities and prices are stored.
5. Total is calculated.
6. Order status becomes `Pending`.
7. Administrator dashboard receives/displays the new order.
8. Waiter sees confirmation that the order was submitted.

---

## 7.6 Price Snapshot

When an order is created, the system should save the product price at that moment.

Example:

```text
Product current price:
Rs. 650

Order #1042:
Chicken Burger × 2
Unit price at order time: Rs. 650
Subtotal: Rs. 1,300
```

If the Administrator later changes the burger price to Rs. 700, the old order must still show Rs. 650.

This is important for accurate historical sales reporting.

---

## 7.7 Administrator Order Management

The Administrator can:

- View incoming orders
- View order details
- Accept order
- Mark order as completed
- Reject/cancel order if required
- View waiter
- View order time
- View order total

The Administrator dashboard should prioritize newly submitted orders.

---

## 7.8 Completed Orders and Sales

A completed order becomes part of the restaurant's sales records.

Sales should be calculated from completed orders.

Example:

```text
Order #1001 = Rs. 1,200
Order #1002 = Rs. 850
Order #1003 = Rs. 2,100

Today's Sales = Rs. 4,150
```

Cancelled/rejected orders must not be included in completed sales.

---

## 7.9 Payment Method

A simple payment method field can be included:

- Cash
- Card
- Other

For MVP, the Administrator can record/update the payment method when completing an order.

---

# 8. Feature 5 — Employee Management

## 8.1 Purpose

The Administrator can maintain employee records, shifts, and salary information digitally.

---

## 8.2 Employee Fields

Each employee should contain:

- Employee ID
- Name
- Phone
- Role
- Joining date
- Salary type
- Salary amount
- Active/inactive status

Salary type:

- Monthly
- Daily
- Per shift

---

## 8.3 Employee Roles

Example roles:

- Waiter
- Manager
- Cook
- Cashier
- Cleaner
- Other

The role is an administrative record and does not automatically grant application permissions.

---

## 8.4 Shift Management

Administrator can create shifts.

Example:

```text
Morning Shift
10:00 AM - 4:00 PM

Evening Shift
4:00 PM - 11:00 PM
```

The Administrator can assign employees to shifts.

A shift record should contain:

- Shift ID
- Employee
- Date
- Start time
- End time
- Status

---

## 8.5 Salary Management

The Administrator can view:

- Employee salary
- Salary type
- Salary amount
- Salary period
- Payment status

Example:

```text
Employee: Ali
Salary Type: Monthly
Salary: Rs. 35,000
Status: Pending
```

The MVP does not need a complicated payroll engine.

The purpose is to digitally maintain salary information and payment records.

---

# 9. Feature 6 — Expense Management

## 9.1 Purpose

Expenses represent money spent by the restaurant outside normal product sales.

---

## 9.2 Expense Fields

Each expense should contain:

- Expense ID
- Category
- Amount
- Date
- Description
- Optional attachment/receipt
- Created by
- Created date

---

## 9.3 Expense Categories

Default categories:

- Rent
- Utilities
- Salaries
- Ingredients
- Maintenance
- Cleaning
- Equipment
- Transportation
- Other

Administrator can add custom categories.

---

## 9.4 Creating an Expense

Example:

```text
Expense

Category: Electricity
Amount: Rs. 18,500
Date: 22 Sep 2026
Description: September electricity bill
```

After saving, the expense contributes to expense reports.

---

## 9.5 Expense Filtering

Administrator can filter expenses by:

- Date
- Category
- Amount range

---

# 10. Feature 7 — Reports

## 10.1 Purpose

Reports replace manual calculations and allow the Administrator to understand restaurant performance.

All reports should support a selectable date range.

Examples:

- Today
- This week
- This month
- Custom date range

---

## 10.2 Sales Report

Display:

- Total sales
- Number of completed orders
- Average order value
- Product-wise sales
- Quantity sold
- Revenue per product
- Sales by date
- Payment method breakdown

Example:

```text
Sales Report
1 Sep - 22 Sep

Total Sales: Rs. 485,000
Orders: 642
Average Order: Rs. 756

Top Products:
Chicken Burger    320 sold    Rs. 208,000
Fries             410 sold    Rs. 102,500
Pizza             145 sold    Rs. 130,500
```

---

## 10.3 Expense Report

Display:

- Total expenses
- Expenses by category
- Expenses by date
- Highest expense categories

Example:

```text
Total Expenses: Rs. 185,000

Rent              Rs. 60,000
Salaries          Rs. 70,000
Utilities         Rs. 25,000
Other             Rs. 30,000
```

---

## 10.4 Profit Report

Profit should only be displayed as an estimate when sufficient cost data exists.

Basic calculation:

```text
Revenue
- Product Cost
- Expenses
= Estimated Profit
```

If product costs are missing, the report should indicate that the profit calculation is incomplete.

---

## 10.5 Stock Report

Display:

- Current stock
- Stock-in quantity
- Stock-out quantity
- Low-stock items
- Stock movement history

Example:

```text
Cooking Oil
Opening: 20 L
Stock In: +10 L
Stock Out: -8 L
Current: 22 L
```

---

## 10.6 Employee Report

Display:

- Employees
- Assigned shifts
- Salary information
- Salary payments/status

This can be kept simple for MVP.

---

# 11. Navigation Structure

## Administrator

```text
Login
  |
  v
Dashboard
  |
  ├── Orders
  │    ├── Pending
  │    ├── Active
  │    └── Completed
  │
  ├── Products
  │    ├── All Products
  │    ├── Categories
  │    └── Add Product
  │
  ├── Inventory
  │    ├── Current Stock
  │    ├── Stock In
  │    ├── Stock Out
  │    └── History
  │
  ├── Employees
  │    ├── Employees
  │    ├── Shifts
  │    └── Salaries
  │
  ├── Expenses
  │    ├── All Expenses
  │    └── Add Expense
  │
  └── Reports
       ├── Sales
       ├── Expenses
       ├── Profit
       ├── Stock
       └── Employees
```

## Waiter

```text
Login
  |
  v
Waiter Home
  |
  ├── New Order
  │    ├── Categories
  │    ├── Products
  │    └── Cart
  │
  └── My Orders
       ├── Pending
       ├── Accepted
       └── Completed
```

---

# 12. Authentication

Both user types must log in.

The system should determine the user's role after authentication.

```text
Login
  |
  v
Check User Role
  |
  ├── Administrator → Admin Dashboard
  |
  └── Waiter → Waiter Home
```

Passwords must not be stored as plain text.

Each account should have:

- User ID
- Name
- Username/email/phone
- Password hash
- Role
- Active/inactive status

---

# 13. Core Data Entities

The initial database should contain approximately these entities:

```text
User
Employee
Product
ProductCategory
InventoryItem
StockMovement
Order
OrderItem
Expense
ExpenseCategory
Shift
SalaryPayment
```

---

## 13.1 User

```text
id
name
username
passwordHash
role
employeeId (optional)
isActive
createdAt
updatedAt
```

---

## 13.2 Product

```text
id
name
description
imageUrl
categoryId
sellingPrice
costPrice (nullable)
isAvailable
createdAt
updatedAt
```

---

## 13.3 Inventory Item

```text
id
name
category
unit
currentQuantity
minimumQuantity
purchasePrice (nullable)
isActive
createdAt
updatedAt
```

---

## 13.4 Stock Movement

```text
id
inventoryItemId
type (IN / OUT)
quantity
previousQuantity
newQuantity
reason
notes
performedBy
createdAt
```

---

## 13.5 Order

```text
id
orderNumber
waiterId
status
paymentMethod
subtotal
discount
total
notes
createdAt
updatedAt
completedAt
```

---

## 13.6 Order Item

```text
id
orderId
productId
productNameSnapshot
unitPriceSnapshot
quantity
subtotal
```

The snapshots ensure historical orders remain accurate even if the product is later edited.

---

## 13.7 Employee

```text
id
name
phone
role
joiningDate
salaryType
salaryAmount
isActive
createdAt
updatedAt
```

---

## 13.8 Shift

```text
id
employeeId
date
startTime
endTime
status
createdAt
```

---

## 13.9 Expense

```text
id
categoryId
amount
date
description
attachmentUrl (optional)
createdBy
createdAt
```

---

## 13.10 Salary Payment

```text
id
employeeId
amount
periodStart
periodEnd
paymentDate
status
notes
createdAt
```

---

# 14. Important Business Rules

## Orders

1. A Waiter can only create orders using available products.
2. The system calculates order totals automatically.
3. The Waiter cannot modify product prices.
4. Every order is associated with the Waiter who created it.
5. Submitted orders initially have `Pending` status.
6. Only completed orders count toward sales.
7. Cancelled/rejected orders do not count toward sales.
8. Historical order prices must remain unchanged after product price updates.

## Inventory

1. Stock quantity cannot become negative.
2. Every stock change creates a Stock Movement record.
3. Stock-out quantity cannot exceed available quantity.
4. Low-stock status is determined from the configured minimum quantity.
5. Inventory changes are restricted to Administrators.

## Products

1. Product name and selling price are required.
2. Cost price is optional.
3. Unavailable products cannot be added to new orders.
4. Deleting products should preferably be implemented as deactivation rather than hard deletion if historical orders reference them.

## Expenses

1. Expense amount must be greater than zero.
2. Every expense must have a category and date.
3. Only Administrators can create/edit/delete expenses.

## Employees

1. Inactive employees cannot be assigned to new shifts.
2. Salary information is restricted to Administrators.
3. Waiters are linked to their employee/user account.

---

# 15. MVP Non-Functional Requirements

## Usability

- Mobile-first interface
- Simple navigation
- Large touch targets
- Minimal typing where possible
- Fast order creation
- Clear status indicators
- Confirmation before destructive actions

## Performance

- Product/menu screen should load quickly.
- Orders should appear on the Administrator dashboard without requiring manual re-entry.
- Reports should support normal restaurant data volumes efficiently.

## Security

- Role-based access control
- Password hashing
- Authenticated API requests
- Waiters cannot access Administrator endpoints
- Server-side authorization must be enforced; hiding UI buttons alone is not sufficient.

## Data Integrity

- Order totals must be calculated server-side.
- Inventory quantities must be updated atomically.
- Historical order prices must use snapshots.
- Deleted/deactivated products must not corrupt historical sales.

---

# 16. MVP Acceptance Criteria

The project will be considered functionally complete when the following workflows work end-to-end.

### Workflow 1 — Waiter Takes Order

```text
Waiter Login
→ Select Product
→ Set Quantity
→ Review Cart
→ Submit
→ Order receives unique ID
→ Order appears in Administrator dashboard
```

### Workflow 2 — Administrator Completes Order

```text
Admin Login
→ View Pending Order
→ Open Order
→ Accept
→ Complete
→ Order becomes a completed sale
→ Sales report updates
```

### Workflow 3 — Inventory

```text
Admin
→ Add Inventory Item
→ Stock In
→ Current quantity increases
→ Stock Out
→ Current quantity decreases
→ History is recorded
```

### Workflow 4 — Product

```text
Admin
→ Add Product
→ Set price
→ Optionally set cost
→ Product becomes available to Waiters
```

### Workflow 5 — Employee

```text
Admin
→ Add Employee
→ Assign Role
→ Set Salary
→ Assign Shift
→ View employee information
```

### Workflow 6 — Expense

```text
Admin
→ Add Expense
→ Select Category
→ Enter Amount
→ Save
→ Expense appears in reports
```

### Workflow 7 — Reporting

```text
Admin
→ Select Date Range
→ View Sales
→ View Expenses
→ View Stock
→ View Estimated Profit when cost data is available
```

---

# 17. Explicitly Out of Scope for MVP

To keep the project manageable, the following should not be implemented initially:

- Online customer ordering
- Customer mobile application
- Customer loyalty program
- Reservations
- Delivery management
- Multi-branch management
- QR-code ordering
- Kitchen Display System
- Supplier management
- Purchase orders
- Recipe-based automatic ingredient deduction
- AI forecasting
- Advanced payroll calculations
- Accounting integration
- External payment gateway integration

These can be considered future versions.

---

# 18. Future Expansion

The architecture should leave room for future features without requiring the MVP to implement them.

Potential Version 2 features:

- Recipe → ingredient mapping
- Automatic ingredient deduction from completed sales
- Supplier management
- Purchase orders
- Table management
- Kitchen Display System
- Customer management
- Reservations
- Multiple restaurant branches
- Advanced payroll
- QR menu
- Online ordering

---

# 19. MVP Application Structure

The MVP consists of a single responsive web application with role-based interfaces.

```text
                    RESPONSIVE WEB APP
                           |
                ┌──────────┴──────────┐
                |                     |
           ADMINISTRATOR            WAITER
                |                     |
        Admin Dashboard          Waiter Home
                |                     |
        ┌───────┼────────┐        New Order
        |       |        |             |
    Inventory Products Reports      Submit
    Employees Expenses Orders          |
        |       |        |             |
        └───────┴────────┴─────────────┘
                           |
                     Shared Backend
                           |
                        Database
```

The MVP does **not** require separate native applications for the Administrator and Waiter. Both users access the same web application, and the system displays the appropriate interface and permissions based on their authenticated role.

# 20. Final MVP Definition

The MVP should solve one clear problem:

> **Replace the restaurant's paper-based recording of orders, products, stock, employees, expenses, and reports with one centralized mobile-facing web system.**

The most important real-world flow is:

```text
WAITER
  ↓
TAKES ORDER
  ↓
DIGITAL ORDER
  ↓
ADMIN DASHBOARD
  ↓
ORDER COMPLETED
  ↓
SALES RECORD
  ↓
REPORTS
```

Around this core flow, the Administrator manages:

```text
Products
   ↓
Orders

Inventory
   ↓
Stock Reports

Employees
   ↓
Shifts / Salaries

Expenses
   ↓
Expense Reports

Sales + Costs + Expenses
   ↓
Estimated Profit
```

This keeps the first version focused on the restaurant's most important daily records while leaving more advanced restaurant-management functionality for future versions.
