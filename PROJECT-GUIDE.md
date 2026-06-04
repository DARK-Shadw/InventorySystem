# Safeen Inventory System — Complete Project Guide

## What is this?

This is a web application that replaces Excel spreadsheets and paper forms used by Safeen Survey & Subsea to manage their store inventory. Instead of manually tracking items in Excel and passing around paper requisition forms between departments, everything happens digitally in one system.

---

## How it works (the big picture)

1. **Store staff** imports their existing Excel inventory data into the system
2. **Any employee** can browse what items are available in the store
3. When a department needs items, a **requester** creates a digital requisition form
4. The **department head** reviews and approves it
5. The **store team** sees the approved request, checks stock, and issues the items
6. Stock levels update automatically — no manual entry
7. When stock runs low, the system **alerts** store staff before they run out
8. Management can pull **reports** on consumption, stock value, and requisition history

---

## User Roles (who can do what)

| Role | What they can do |
|---|---|
| **Requester** | Browse inventory, create and submit requisition forms |
| **Dept. Head** | Everything a Requester can do + approve/reject their department's requisitions |
| **Store Staff** | View all requisitions, approve at store level, issue items from stock |
| **Store Manager** | Everything Store Staff can do + manage users, full system access |
| **Super Admin** | Everything — full control over the entire system |

---

## Pages & What Each One Does

### Login Page (`/login`)
- Where users sign in with their email and password
- After login, they're sent to the dashboard
- If someone tries to visit any page without logging in, they get sent here

### Dashboard (`/dashboard`)
- The home screen after login
- Shows 4 stat cards at the top:
  - **Total Items** — how many active items exist in the system
  - **Low Stock Alerts** — how many items are below their reorder point
  - **Pending Requisitions** — how many requisitions are waiting for approval
  - **Out of Stock** — how many items have zero stock
- Below that, two panels:
  - **Recent Requisitions** — latest requisition forms with their status
  - **Low Stock Alerts** — which specific items are running low, sorted by urgency

### Inventory (`/inventory`)
- The main item management page
- Shows a table of all items with: code, description, manufacturer, stock level, reorder point, unit, cost, and status
- **Search bar** — type to find items by code, description, manufacturer, or part number
- **Status filter** — filter by Active, Inactive, or Discontinued items
- **Add Item button** — opens a form to add a new item with all details (code, description, manufacturer, part number, units, cost, reorder point, criticality, etc.)
- **Edit button** (pencil icon) — edit any item's details
- **Delete button** (trash icon) — delete an item, or deactivate it if it has transaction history
- **Pagination** — shows 20 items per page, navigate with arrow buttons
- Each row shows a colored badge: "In Stock" (green), "Low Stock" (amber), or "Out of Stock" (red)
- Warning triangle icon appears when stock is at or below the reorder point

### Import Data (`/import`)
- 4-step wizard to import Excel files into the system
- **Step 1: Upload** — drag or click to select an .xlsx file
- **Step 2: Select Sheet** — if the Excel has multiple sheets, pick which one to import. Shows a preview of the first 5 rows
- **Step 3: Map Columns** — the system tries to auto-detect which Excel columns match which system fields (Item Code, Description, ROP, etc.). You can manually adjust any mapping. Required fields are marked with a red asterisk
- **Step 4: Results** — shows how many items were imported (new), updated (already existed), skipped (missing data), and any errors with the specific row numbers
- Handles messy Excel data: fixes encoding issues, cleans up special characters, handles duplicate item codes by updating instead of failing

### Requisitions (`/requisitions`)
- List of all requisition forms in the system
- Table shows: requisition number, department, requester name, project/location, item count, status, and date
- **Search** — find by requisition number or requester name
- **Status filter** — filter by Draft, Submitted, Approved, Issued, Rejected, etc.
- **New Requisition button** — go to the create form
- **Eye icon** — view full details of any requisition

### New Requisition (`/requisitions/new`)
- Form to create a new requisition
- Top section: select a **Project** and **Location/Vessel** from dropdowns, add optional remarks
- Item section: **search bar** to find items — type at least 2 characters, results show item code, description, and current stock
  - Click an item to add it to the requisition
  - Set the quantity needed for each item
  - Add optional remarks per item
  - See available stock right in the form (so you know if what you need is available)
  - Remove items with the trash icon
- Two submit options:
  - **Save as Draft** — saves but doesn't send for approval (can edit later)
  - **Submit Requisition** — saves and immediately sends for approval

### Requisition Detail (`/requisitions/[id]`)
- Full view of a single requisition
- Header shows: requisition number, status badge, creation and submission dates
- Info cards show: requester name & department, project, location/vessel, remarks
- **Items table** — shows each requested item with:
  - Item code and description
  - Unit (Each, Sets, Packet, etc.)
  - Quantity Required vs Quantity Issued
  - Current stock in the storeroom
  - Per-item status badge
- **Approval History** — timeline showing who approved/rejected and when, with their comments
- **Action buttons** (change based on status and user role):
  - **Print** — always visible, opens the printable form in a new tab
  - **Submit** — visible for drafts, sends for approval
  - **Approve/Reject** — visible for dept heads and store staff when it's their turn
  - **Issue Items** — visible for store staff after approval, opens a dialog to enter how many of each item to issue
  - **Cancel** — visible for drafts and submitted requisitions

### Requisition Print (`/requisitions/[id]/print`)
- A special page designed to look exactly like Safeen's existing paper requisition form
- Shows: SAFEEN and AD Ports Group branding, requisition number, project, requester, date, location, badge number
- Items table with: item number, description, unit, quantity required, quantity issued, remarks
- Empty rows to pad the table (like the paper form)
- Signature blocks at the bottom: Requested By, Approved By, Issued By
- **Print/Save PDF button** — uses the browser's print function (Ctrl+P) to save as PDF

### Users (`/users`)
- User management page (only visible to admins and store managers)
- Table shows: name (with avatar initials), email, badge number, department, role, status
- **Search** — find users by name, email, or badge number
- **Role filter** — filter by Super Admin, Store Manager, etc.
- **Add User** — form to create a new user with: name, email, password, badge number, department, and role. Includes a built-in guide explaining what each role can do
- **Edit** (pencil icon) — change any user's details, reset their password, or change their status (Active/Inactive/Suspended)

### Alerts (`/alerts`)
- Split into two panels:
- **Left: Alert Rules** — the rules that define when to send alerts
  - **Add Rule** — create a new alert rule:
    - Pick alert type: Reorder Point (uses each item's ROP), Low Stock (custom threshold), or Out of Stock (zero stock)
    - Optionally pick a specific item, or leave blank to apply to all items
    - Set a custom threshold for Low Stock alerts
  - **Delete** (trash icon) — remove a rule
- **Right: Notifications** — alerts that have been triggered
  - Shows title, message, and timestamp
  - Unread notifications are highlighted
  - **Mark as read** button per notification
  - **Mark all read** button at the top
- **Check Now button** — manually triggers a scan of all alert rules against current inventory. Creates notifications for store staff when conditions are met
- The **bell icon** in the header shows the unread notification count (updates every 30 seconds)

### Reports (`/reports`)
- 4 report types shown as clickable cards:
  1. **Inventory Summary** — every active item with stock level, cost, total value, and stock status. Summary shows total items, total inventory value, out of stock count, low stock count
  2. **Low Stock / Reorder Report** — items at or below their reorder point, sorted by criticality. Shows suggested order quantity (EOQ), lead time, and estimated reorder cost
  3. **Consumption by Department** — how many items each department has been issued, with total quantities and dollar values. Has a date range filter
  4. **Requisition History** — all requisitions with their status. Has a date range filter. Summary shows total count and breakdown by status
- **Generate button** — runs the selected report
- **Export CSV button** — downloads the report data as a .csv file that opens in Excel
- Reports show up to 100 rows in the browser table, full data in the CSV export

---

## API Routes (what powers everything behind the scenes)

### Authentication
| Route | Method | What it does |
|---|---|---|
| `/api/auth/login` | POST | Takes email + password, verifies credentials, returns a session cookie |
| `/api/auth/logout` | POST | Clears the session cookie, logs the user out |
| `/api/auth/me` | GET | Returns the currently logged-in user's info (name, role, department) |

### Items (Inventory)
| Route | Method | What it does |
|---|---|---|
| `/api/items` | GET | Lists items with search, status filter, sorting, and pagination |
| `/api/items` | POST | Creates a new item with all its details |
| `/api/items/[id]` | GET | Gets a single item's full details |
| `/api/items/[id]` | PATCH | Updates an item's details |
| `/api/items/[id]` | DELETE | Deletes an item (or deactivates it if it has history) |
| `/api/items/search` | GET | Quick search for items — used by the requisition form's item picker |

### Excel Import
| Route | Method | What it does |
|---|---|---|
| `/api/import` | POST (action=preview) | Reads an Excel file and returns sheet names, column headers, and sample rows |
| `/api/import` | POST (action=import) | Imports data from an Excel file using the provided column mapping |

### Requisitions
| Route | Method | What it does |
|---|---|---|
| `/api/requisitions` | GET | Lists requisitions with search, status filter, and pagination |
| `/api/requisitions` | POST | Creates a new requisition with line items |
| `/api/requisitions/[id]` | GET | Gets a requisition's full details including items, approvals, and stock levels |
| `/api/requisitions/[id]` | PATCH | Submit a draft or cancel a requisition |
| `/api/requisitions/[id]/approve` | POST | Approve or reject a requisition (records the approval with level and comments) |
| `/api/requisitions/[id]/issue` | POST | Issue items — deducts from inventory, records the transaction, updates requisition status |

### Users
| Route | Method | What it does |
|---|---|---|
| `/api/users` | GET | Lists all users with search and role filter |
| `/api/users` | POST | Creates a new user (admin/manager only) |
| `/api/users/[id]` | PATCH | Updates a user's details, role, status, or password |

### Alerts & Notifications
| Route | Method | What it does |
|---|---|---|
| `/api/alerts` | GET | Lists all alert rules |
| `/api/alerts` | POST | Creates a new alert rule |
| `/api/alerts` | DELETE | Deletes an alert rule |
| `/api/alerts/check` | POST | Scans all rules against inventory, creates notifications for triggered alerts |
| `/api/notifications` | GET | Gets the current user's notifications and unread count |
| `/api/notifications` | PATCH | Mark a single notification or all notifications as read |

### Dashboard & Reports
| Route | Method | What it does |
|---|---|---|
| `/api/dashboard` | GET | Returns live stats (total items, low stock count, out of stock, pending requisitions) plus low stock alerts and recent requisitions |
| `/api/reports` | GET | Generates a report based on type parameter: inventory-summary, low-stock, consumption-by-department, or requisition-history |

### Lookups (used by dropdowns)
| Route | Method | What it does |
|---|---|---|
| `/api/departments` | GET | Lists all departments |
| `/api/projects` | GET | Lists active projects |
| `/api/locations` | GET | Lists active locations (vessels, barges) |

---

## Database Tables (what data is stored)

| Table | What it stores |
|---|---|
| **users** | Everyone who can log in — their name, email, password (hashed), badge number, role, and department |
| **departments** | The 8 departments: Store, Survey, ROV, R&D, Diving, HSE, USV, PMT |
| **items** | The master catalog of every item in the store — code, description, manufacturer, part number, units, costs, reorder point, criticality, and more |
| **inventory** | How many of each item is currently in stock, per storeroom |
| **storerooms** | Physical storage locations (currently just SSMAIN) |
| **commodity_groups** | Item categories imported from the Excel data (hierarchical codes like 38*3820) |
| **locations** | Vessels and barges where items get sent (ASTRO ARCHERNER, UAE/Rigmove) |
| **projects** | Project codes that requisitions can be tagged to (for cost tracking) |
| **requisitions** | The header info for each requisition form — who requested, which department, which project/location, current status |
| **requisition_items** | The line items on each requisition — which item, how many requested, how many issued |
| **requisition_approvals** | Every approval or rejection — who did it, at what level, what they said |
| **inventory_transactions** | A permanent record of every stock movement — what changed, by how much, who did it, why. This is the audit trail |
| **alert_rules** | The rules that define when to trigger stock alerts |
| **notifications** | Alert messages sent to users when rules are triggered |

---

## The Requisition Flow (step by step)

1. **Requester** logs in and goes to Requisitions > New Requisition
2. They pick a project and location, search for items, set quantities, and click **Submit**
3. Status changes from DRAFT to **SUBMITTED**
4. **Department Head** logs in, sees the pending requisition, reviews it, and clicks **Approve** (or Reject with a reason)
5. Status changes to **DEPT_APPROVED**
6. **Store Staff/Manager** logs in, sees the department-approved requisition, reviews stock availability, and clicks **Approve**
7. Status changes to **APPROVED**
8. Store Staff clicks **Issue Items**, enters how many of each item to actually give out (might be less than requested if stock is low)
9. The system automatically:
   - Deducts the issued quantities from inventory
   - Records the transaction in the audit trail
   - Updates the requisition status to **ISSUED** (or **PARTIALLY_ISSUED** if not everything was given)
10. Anyone can click **Print** to get a PDF that looks like the original paper form

---

## Quick Reference: Running the Project

```bash
# Start database
docker compose up -d

# Install dependencies (first time only)
npm install

# Run migrations (first time only)
npx prisma generate
npx prisma migrate dev

# Seed demo data (first time only)
npm run db:seed

# Start the app
npm run dev

# Open in browser
http://localhost:3000
```
