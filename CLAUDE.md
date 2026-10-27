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

## Accounts and owner page
Routes: /signup, /signin, /forgot, /reset, /privacy, /admin, /setup (needs an account), /app (needs account and profile), /app/sign (sign a document).
Two back ends sit behind the same interfaces. src/data/authService.ts and repoService.ts pick one: with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set (see .env.example, .env is gitignored) the app uses supabaseAuth.ts and supabaseRepo.ts, otherwise the on device demo (auth.ts localAuth, repo.ts localRepo, accounts in localStorage, demo banners shown). Never put the service_role key in the app.
Supabase auth: PKCE flow, email and password, sign up passes full_name, business_name, business_type, trade as user metadata for the database trigger. If email confirmation is on, signUp returns null, the typed business details are kept on the device (savePending) and saved on first sign in. The owner is whoever is in the app_admins table (public.is_admin() rpc), not an email in the code. ADMIN_EMAILS in lib/constants.ts is only for the demo. Password reset: sendReset emails a link back to /#/reset, where Reset in pages/Auth.tsx calls updatePassword. Needs Site URL and Redirect URLs set in Supabase, Authentication, URL Configuration. supabaseRepo saves only what changed since the last save, in order, and the store shows a Try again screen if loading fails so nothing is ever saved over data that did not load.
The Supabase side was tested with in memory stand ins for the client and a local Postgres for the SQL, not against a live project. First thing to do with real keys: sign up, make an invoice, reload, sign in on another browser, then sign up the owner account, run the app_admins insert, and open /admin.
The owner page is src/pages/Admin.tsx. It only lists signups (name, business, type, trade, date, email) and must never load documents. Row level security stops the owner reading documents even if the page tried. src/pages/Privacy.tsx is a draft that needs a lawyer.
Sign up is the full business setup (details, typed Something else options, logo, signature, payment, tax, social links, password). The default look is edited later on the Profile page. Social handles live in profile.socials (Instagram, Twitter, TikTok) and each document has a showSocials tick box that prints them at the bottom of the paper.
Sign up collects the WhatsApp number on purpose: it is the number the send on WhatsApp button uses (stored as profile.phone).

## Database (Supabase)
supabase/schema.sql builds everything: profiles (who signed up, owner can read), business_settings (private profile json and number counters), documents (id, user_id, type, number, status, data jsonb), saved_templates, app_admins (owner accounts, closed to the app), with row level security. A trigger fills profiles from the sign up metadata, so supabaseAuth.signUp must pass options.data with full_name, business_name, business_type, trade. supabaseRepo maps AppData.profile to business_settings.data, AppData.seq to business_settings.seq, AppData.docs to documents.data and AppData.templates to saved_templates. The schema was tested on a local Postgres with stand ins for Supabase: owner sees profiles only, users see only their own rows, signed out sees nothing, deleting a user removes their rows.

## What is not built yet (in this order)
1. Supabase: code and SQL are written. Remaining: Coco sets the keys, turns email confirmation on or off, sets the URL configuration, runs the app_admins insert, and we test it live.
2. Put the site online (Vercel) with the two environment variables.
3. Landing page images. The landing page has no photo slots now, Coco asked for none. If he sends pictures later, add them where he says.
4. Client signing links for contracts, and a pay page.
5. Email change (password reset is built).
6. Small polish: contract template cards currently show raw {{placeholders}} in their preview text, resolve them.

## Sign a document (built)
Route /app/sign, src/pages/SignDocument.tsx and src/lib/signpdf.ts. The person opens a PDF or picture (png, jpg, webp), pages are drawn with pdfjs-dist (legacy build, loaded only on this page), they add their saved or a newly drawn signature, initials, date or text, drag and resize on any page, and download a signed PDF written with pdf-lib. Everything is a picture placed by fraction of the page, so it works on rotated pages and cropped pages. All on the device, nothing uploaded. Not built: sending a document to someone else to sign (needs Supabase), several people signing, locking or certifying the file. Needs a decision on free or Generate more.

## Ideas Coco wants to come back to (not built)
Template gallery: 30 templates to start, different layouts, built into Generate more with one free try of an uploaded template. Uploaded designs (image or PDF) become a background with placed boxes for name, items, totals and signature.
Features section of the landing page: waiting for Coco's idea, plain list for now.

## Testing
Playwright in Python works. Block fonts.googleapis.com requests in tests and use wait_until domcontentloaded. Flow that was verified: landing, setup, typed signature, invoice with part payment, preview, PDF download (one page), contract templates, dashboard totals.
