Wahaj Quotation Studio

This package includes the full single-page quotation generator and all local assets.
No API keys, backend, installation, or build step are required.

Deploy on Vercel
1. Extract this ZIP.
2. Put the extracted contents in a Git repository and import it into Vercel, or run `npx vercel` from this folder.
3. Choose the Other framework preset. Leave the build command empty and use the project root as the output directory.

Local preview
Run `python3 -m http.server 8000` in the extracted folder, then open http://localhost:8000.
Use a local server rather than double-clicking index.html, because the app fetches its PDF and font assets.

Usage
Edit the quotation, optionally upload a PNG/JPG logo, and click Download PDF.
Edits are held in the current page only and are not saved after reload.
