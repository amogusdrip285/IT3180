# BlueMoon Web User Handbook (English)

This handbook explains the core usage flow of the BlueMoon web app for the school-project scope.

## 1) Login and language

- Open `http://localhost:3000` (or your deployed URL).
- Enter username/email and password.
- After login, use the language switcher in the header to switch between Vietnamese and English.

## 2) Main layout

- Left sidebar modules:
  - Dashboard
  - Fee Types
  - Fee Periods
  - Obligations & Payments
  - Households
  - Residents
  - Residency Events
  - Users
  - Reports
- On mobile, a quick-action bar appears at the bottom.

## 3) Global search and filters

- Global search supports:
  - Apartment code, owner/resident names
  - Receipt number, collector, payer
- Month/year filters apply to relevant charts and payment views.

## 4) Household management

In the Households tab, you can add a household with:

- Apartment, floor, owner, owner phone
- Emergency contact name/phone
- Parking slots
- Move-in date
- Ownership status (owner/tenant)
- Contract end date (if tenant)
- Area (m2)

You can also:

- Review household list
- Create quick payment-reminder communication logs
- Track communication timeline (channel/status/time/note)

## 5) Resident and residency events

Residents tab:

- Add residents by household
- Enter full name, DOB, gender, ID number, residency type

Residency Events tab:

- Record temporary residence, temporary absence, move-in, move-out
- Track recent event timeline

## 6) Fee catalog and periods

Fee Types tab:

- Create mandatory/voluntary fees with calculation method (per m2/fixed)
- Add policy metadata:
  - Grace days
  - Late fee rule
  - Effective from/to dates
  - Policy note

Fee Periods tab:

- Create monthly periods by fee type
- View all available periods

## 7) Obligations and collection

In Obligations & Payments:

- Select an obligation
- Enter amount, payment method, collector
- Add extended payment details:
  - Payer name
  - Payer phone
  - Bank transaction reference
  - Attachment URL
  - Reversal note
  - Business note
- Review recent payment timeline

## 8) Dashboard and analytics

Dashboard includes:

- KPI cards: total due, total paid, outstanding, fully-paid households
- Histogram charts by month and by fee type
- Click month bars for drilldown
- Attention widgets:
  - Contracts ending soon
  - Failed reminder deliveries
- Voluntary participation and debt-aging summaries

## 9) Reports

Reports tab provides:

- Collection rate by month
- Debt aging chart
- Payment table with column visibility toggles:
  - Receipt, period, fee, amount, method, collector, payer, transaction ref
- Top collectors and collection performance by floor

## 10) User administration

Users tab (for ADMIN role):

- Create users by role
- View user statuses
- Review operation/audit logs

## 11) Basic role expectations

- ADMIN: full access
- ACCOUNTANT: read/write fee module + report read
- TEAM_LEADER: read/write resident module + read fee/report

## 12) Common troubleshooting

- Cannot log in:
  - Verify username/email and password.
  - Too many failed attempts may trigger temporary lock.
- Data not showing:
  - Refresh the page.
  - Ensure data is seeded (`npm run db:seed`).
- Permission errors:
  - Check account role against the requested operation.
