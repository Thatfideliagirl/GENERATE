# Generate: what has been built so far

A summary for planning the next phase (the content system and the template gallery). Written in plain words.

## Links
1. Working preview of the whole site and app (demo mode, everything saves on your own device): https://claude.ai/artifact/EcuSNnRTbkxECSdZjhVRR4
2. Code on GitHub: repository thatfideliagirl/generate, branch claude/new-session-tdryo2
3. Project brief for developers: CLAUDE.md in the code. Full feature wish list: docs/FEATURES.md.

## What Generate is
A document maker for freelancers, shops and growing brands in Nigeria and beyond. People make invoices, receipts and contracts with their own name, logo and signature, send them on WhatsApp, track who has paid, and sign any PDF. Built as a real React and TypeScript web app (Vite), with Supabase for accounts and data.

## The look
Powder blue background, white cards, navy ink, one clay accent. Geist for text and Instrument Serif italic for one human word in each heading. The green and gold GENErate logo stays. Light mode is always the default. People can switch to dark mode and pick their own accent colour (clay, emerald, ocean, plum, gold, rose).

## The public website
1. Hero with a search bar people can type in. The hint types itself while empty, and pressing Enter or Start free opens sign up.
2. A phone that stays on screen while you scroll and changes screens to tell the story: the WhatsApp chat with a client (Mr. Wale), setting up your business, making an invoice, sending it, the dashboard, and signing a PDF. On phones the step cards slide over the phone. The phone always fits the screen.
3. A quiet moving ribbon of short lines.
4. Who it is for: freelancers, shop owners, growing brands and anyone, with four photos and captions that switch by themselves.
5. Features: four documents (invoice, receipt, contract, signed PDF) that slide up like they are being printed. Then "the small things that save you time": a switcher with live mini demos for signatures, WhatsApp sending, reminders, part payments, any currency, looks and templates, the customers list and the dashboard.
6. Questions and answers, with a "Chat with us on WhatsApp" button.
7. A dark closing box with a second search bar.
8. Footer with links, Chat on WhatsApp and Send us an email (the number and email are never printed), Instagram and LinkedIn (not linked yet), Privacy, and "© 2026 Generate. All rights reserved."
9. Sign any document free: a section after the questions and a menu link. Visitors without an account upload, sign, give their email before downloading, then are invited to start free. There is no pricing anywhere: Generate is presented as free.
10. A menu button on phones with every link, Start free and Sign in, or Open Generate and Sign out when signed in.

## Accounts
1. Sign up is the full business setup in one go: business name, your name, email, WhatsApp number, what kind of business, what you sell, logo or initials, signature (draw, type or upload a photo), bank details, VAT, social handles and a password.
2. Sign in, forgot password and reset password.
3. Supabase is connected: real accounts, row level security so each person only ever sees their own data. The owner dashboard has its own pages (Overview, Signups, Free signing, Visitors) and shows signups over time, who is signing up, usage counts, and emails from free signing, but can never open anyone's documents.
5. Sign out on Home, the side menu, the phone header, Settings and the website.
4. A short guided tour the first time someone opens Home. It can be taken again from Settings.

## Inside the app
1. Home, driven by one time filter (today, this week, this month, this year, all time): money received, waiting to be paid, overdue and part paid; a chart of money received per month with the best month; counts of invoices, receipts, contracts, signed documents and customers that open their own pages; who owes you with a WhatsApp Remind button (friendly, firm or final); and recent documents.
2. A New button that opens a menu: invoice, receipt, contract, or sign a document.
3. Invoices page, Receipts page, Contracts page and Signed documents page, each with its own summary and list. All documents page with counts and everything grouped by day, each with a download button.
4. Invoice and receipt editor: items, discount, VAT, any currency, part payments with a receipt for each payment, notes, signature, social handles. A live preview beside the form on a laptop. Six layouts, six fonts, any colour, white or ivory paper. Download a one page PDF or send on WhatsApp with a warm ready message.
5. Contracts: three starter templates (service agreement, creative project agreement, confidentiality agreement) that fill in your details by themselves, or start blank. Save your own templates. A note says a lawyer should check them.
6. Sign a document: upload any PDF or photo, place your signature, initials, the date, text or a line anywhere on any page, and download the signed PDF. A copy is kept on the device under Signed documents.
7. Customers: add, edit, remove, or import from phone contacts (Android), a file, or a pasted list. Pick a customer when making a document. A new client name prompts "Add them to your customers?". Each customer has a page with what they owe, what they were billed and their documents.
8. Profile: your business shown in cards with edit pens. Settings: light or dark, accent colour, the tour again, backup and restore, sign out, privacy, and the Generate homepage.
9. A notifications bell: late invoices, payments due in the next three days, forgotten drafts and missing setup details, with a red count.
10. Side menu on laptops that folds to icons. Bottom bar on phones with a raised New button.

## Still to do
1. Put the site online on Vercel so it has a real address, then finish Supabase setup (site address, owner account, run supabase/customers.sql, a full live test).
2. The content system: a brand brief, three ready posts a week, price list cards, promo flyers, tips flyers, mass cards, a content calendar.
3. The template gallery (about 30 templates, Generate more) and uploading your own design.
5. Sending a contract to a client to sign by link, and a pay page.
6. Email change, custom email sender for Supabase, and the privacy page checked by a lawyer.
