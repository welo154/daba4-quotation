Wahaj Studio: Quotations + Invoices (one Supabase project)

One static site with two tools sharing one Supabase database:
- /           Quotation Studio — save quotations, history, PDF download
- /invoices/  Invoice Studio — save invoices, history, A4 PDF print

Shared files
- config.js              Project URL + anon key (fill these in)
- supabase-client.js     Shared REST helper
- supabase/schema.sql    Run once in the Supabase SQL Editor

Create the Supabase project
1. Open https://supabase.com/dashboard and create a free project (e.g. wahaj-studio).
2. Project Settings → API: copy the Project URL and the anon / publishable key into config.js.
3. SQL Editor → New query: paste and run supabase/schema.sql.
4. Redeploy / refresh the site. Both tools should show Connected.

Deploy on Vercel
Import this repository (Other framework, empty build command, root output directory)
or run `npx vercel` from this folder.

Local preview
Run `python3 -m http.server 8000`, then open http://localhost:8000.

Usage
Quotations: edit, Save quotation, open Saved history, Download PDF.
Invoices: edit, Save invoice, Invoice history, ↓ PDF (print as A4).
Create invoice on the quotation page opens a new invoice for the same client.
