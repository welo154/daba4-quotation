Wahaj Studio: Quotations + Invoices

One static site with two tools. Both can be saved and reopened:
- /           Quotation Studio — Save quotation + Saved history + PDF
- /invoices/  Invoice Studio — Save invoice + history + A4 PDF print

How saving works
- config.js points at the shared Supabase project.
- Run supabase/schema.sql once (see /setup.html), then quotations and invoices save to Supabase.
- If Supabase tables are missing or unreachable, the app falls back to this browser.

Shared files
- config.js              Optional Supabase URL + anon key
- supabase-client.js     Shared save/load helper (local + Supabase)
- supabase/schema.sql    Cloud schema for quotations + invoices

Deploy on Vercel
Import this repository (Other framework, empty build command, root output directory)
or run `npx vercel` from this folder.

Local preview
Run `python3 -m http.server 8000`, then open http://localhost:8000.

Usage (CRUD for both)
Quotations: create with Save quotation, open/edit from Saved, Update quotation, Duplicate, Delete, Download PDF.
Invoices: create with Save invoice, open/edit from history, Update invoice, Duplicate, Delete, ↓ PDF.
Create invoice on the quotation page opens a new invoice for the same client.
