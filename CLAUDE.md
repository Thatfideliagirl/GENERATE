# Generate: project brief for Claude Code

Read this first. It is everything you need to continue.

## Who you are working with
Coco, non technical, based in Lagos, dictates by voice so messages are conversational. Explain simply and step by step. Reply in plain prose: no bold, no asterisks, no hyphens or dashes in written replies. Supabase is his preferred backend. He wants this to look premium and never "AI looking". It is a real product people will use, so keep it a proper multi file project.

## What the product is
Generate is a document maker for freelancers and businesses in Nigeria and beyond: invoices, receipts and contracts that carry the user's name, logo and signature. Brand name is Generate (logo wordmark is written GENErate). The logo files are in public/ (logo.png, favicon.png, icon-192.png). "Vellum" was an old working name and must not appear anywhere. If you see it, replace it. A fallback localStorage key `folio.v1` / `vellum.v1` exists in src/data/repo.ts only to read old data.

## Stack
Vite 5, React 18, TypeScript strict (noUnusedLocals and noUnusedParameters on), react-router-dom v6 HashRouter, jspdf and html2canvas (dynamic import) for PDF. No UI library. Plain CSS in src/styles (global.css, paper.css, landing.css).

Commands: npm install, npm run dev, npm run build (runs tsc then vite build), npm run preview.

## Structure
src/pages: Landing, Setup, Dashboard, Editor (NewDoc and OpenDoc), ContractTemplates, Profile.
src/components: DocumentPaper (the document itself, used for preview and PDF), PaperPreview (scales 760px paper to the screen), LookControls (layout, font, colours, paper), SignatureModals (draw and type), ReminderModal, ProfileForm, Modal, Fields, TopBar, Toast.
src/lib: types, constants (BRAND, currencies, trades, fonts, accents), calc (totals, part payments, status), factory, templates (3 contract templates), whatsapp (links and reminder messages), pdf, image, format, style, text.
src/data: repo.ts (Repo interface with localStorage implementation) and store.tsx (React context).

## Key decisions
Data goes through the Repo interface (async load and save). To add Supabase, write a supabaseRepo with the same two functions and change the single line `export const repo = localRepo` in src/data/repo.ts.
Status is computed, never stored by hand: paid, part, overdue, sent, draft, signed. Part payments live in doc.payments.
Currency is per document. Dashboard totals are grouped per currency.
Paper is always 760px wide and scaled down for small screens. The same component renders preview and PDF.
Look system: layouts classic, modern, minimal, boxed, split, bold. Fonts editorial, serif, sans, elegant, rounded, mono. Accent can be a named colour or any hex. Text colour is free. Paper is white by default or ivory.
Contracts use {{business}}, {{client}}, {{owner}}, {{date}}, {{fee}}, {{start}}, {{end}} placeholders and lines starting with "# " as headings. They are starter templates, not legal advice. Keep a note saying a lawyer should check them.
WhatsApp: numbers starting with 0 get 234 added. Reminder tones: friendly, firm, final.

## Brand look
Emerald #0F4D3C, ivory #F6F1E7 and #FBF8F1, brass gold #B08D57. Headings use Fraunces, interface uses Instrument Sans. The landing page alone uses Bodoni Moda for display and Hanken Grotesk for text, set as variables on .landing in landing.css. Light and dark mode both supported through CSS variables in global.css. Avoid generic gradients, purple, and template looking cards.

## What is not built yet (in this order)
1. Supabase: real email accounts, a supabaseRepo, row level security so each user sees only their own documents, a profiles table and a documents table (store each document as jsonb plus id, user_id, type, status, updated_at).
2. Owner admin page for Coco: list of signups showing name, business name, business type, trade, signup date and email. The admin must NOT be able to read anyone's documents. Add a privacy page that says so (Nigeria data protection law applies).
3. Landing page images. The landing page has no photo slots now, Coco asked for none. If he sends pictures later, add them where he says.
4. Client signing links for contracts, and a pay page.
5. Username and email changes, password reset.
6. Small polish: contract template cards currently show raw {{placeholders}} in their preview text, resolve them.

## Testing
Playwright in Python works. Block fonts.googleapis.com requests in tests and use wait_until domcontentloaded. Flow that was verified: landing, setup, typed signature, invoice with part payment, preview, PDF download (one page), contract templates, dashboard totals.
