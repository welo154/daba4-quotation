Wahaj Studio: Quotations + Invoices

One static site with two tools:
- /           Quotation Studio: editable media-production quotations that download as PDF.
- /invoices/  Invoice Studio: invoices with live A4 preview, saved to Supabase with revision history.

Use the Quotations / Invoices switcher in the quotation header, or "Quotation studio" in the invoice sidebar,
to move between them. "Create invoice" on the quotation page opens a new invoice for the same client.

No build step is required.

Deploy on Vercel
1. Import this repository into Vercel, or run `npx vercel` from this folder.
2. Choose the Other framework preset. Leave the build command empty and use the project root as the output directory.

Invoice storage
Invoices are saved in this browser with localStorage (no Supabase / cloud database).
Saved invoices and revisions stay on the same device and browser. Clearing site data removes them.
invoices/schema.sql is kept only as an optional reference if you later want a cloud backend.

Local preview
Run `python3 -m http.server 8000` in this folder, then open http://localhost:8000.
Use a local server rather than double-clicking index.html, because the app fetches its PDF and font assets.

Usage
Quotations: edit the quotation, optionally upload a PNG/JPG logo, and click Download PDF.
Quotation edits are held in the current page only and are not saved after reload.
Invoices: edit, Save invoice to store it in this browser (and record a revision), and ↓ PDF to print as A4.
