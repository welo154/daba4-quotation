Wahaj Studio: Quotations + Invoices

One static site with two tools. Both can be saved and reopened:
- /           Quotation Studio — Save quotation + Saved history + PDF
- /invoices/  Invoice Studio — Save invoice + history + A4 PDF print

How saving works
- By default, both quotations and invoices are saved in this browser (localStorage).
- Optional: put a Supabase Project URL + anon key in config.js, run supabase/schema.sql
  once in the SQL Editor, and saves go to that shared cloud project (with local fallback).

Shared files
- config.js              Optional Supabase URL + anon key
- supabase-client.js     Shared save/load helper (local + Supabase)
- supabase/schema.sql    Cloud schema for quotations + invoices

Deploy on Vercel
Import this repository (Other framework, empty build command, root output directory)
or run `npx vercel` from this folder.

Local preview
Run `python3 -m http.server 8000`, then open http://localhost:8000.

Usage
Quotations: edit, Save quotation, open Saved, Download PDF.
Invoices: edit, Save invoice, Invoice history, ↓ PDF.
Create invoice on the quotation page opens a new invoice for the same client.
