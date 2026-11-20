# Generate

Invoices, receipts and contracts that carry your name, your logo and your signature.

This is a real React project. It is not a single page file. Your logo is already inside it.

## What is inside

Landing page, sign up, dashboard, invoice editor, receipts, contracts with templates, part payments, WhatsApp reminders, six layouts, six fonts, any colour, PDF download.

Right now everything is saved in the browser of the person using it. There is no server yet. That is the next step (see Supabase below).

## Run it on your computer

1. Install Node from nodejs.org (the LTS version).
2. Open a terminal in this folder.
3. Type: npm install
4. Type: npm run dev
5. Open the address it shows you.

## Put it online

1. Type: npm run build
2. A folder called dist appears. That is your website.
3. Upload the whole project to GitHub, then connect the repo to Vercel or Netlify. Set the build command to npm run build and the output folder to dist.

## Change the name or logo

The name is in src/lib/constants.ts (BRAND). The logo files are in the public folder: logo.png, favicon.png and icon-192.png.

## Where things are

src/pages: every screen.
src/components: the small building blocks.
src/lib: the maths, templates, PDF and WhatsApp code.
src/data: how documents are saved. Only repo.ts needs to change when you add Supabase.
src/styles: all the looks.

## Supabase (next)

To get real accounts, a list of signups for you as the owner, and sharing links, we add Supabase. Documents should stay private to each user. You would see only sign up details (name, business, trade), never their documents. Add a privacy page explaining this.

## Contracts

The contract templates are a starting point. They are not legal advice. Have a lawyer check them before you rely on them.
