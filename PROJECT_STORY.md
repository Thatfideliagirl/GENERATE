# Generate: the story so far, and the brief for the landing page

This file is for Claude Code. It explains how the project started, what Coco asked for, what he liked and disliked, and what the next job is. Read CLAUDE.md for the technical map. Read this for the why.

## About Coco
Non technical, based in Lagos, dictates by voice, so his messages ramble and sometimes contain stray words from background talk. Read for intent. Reply in plain prose with no bold, no asterisks and no hyphens or dashes. Explain everything simply, step by step. He works fast and wants things finished. He said he does not want to ship "rubbish", and he is building something real people will use.

## How it started
1. Coco first said he wanted a custom receipt or invoice generator, and possibly a hair website. He asked which to build and wanted something ready the next day. The generator was chosen.
2. He asked to be asked questions about the look. He chose "clean and minimal" together with "luxury and elegant". He also wanted contracts to be part of the product, not only invoices.
3. He asked for competitor checks and how to be better. He chose a deep emerald colour. The palette became emerald #0F4D3C, warm ivory #F6F1E7 and #FBF8F1, and brass gold #B08D57. He said "I love it".
4. He added features in long voice notes: logo upload, signatures (draw, upload or type), saved contracts and templates, many fonts, font colours, different layouts for different businesses, a standard plain white paper template, a dashboard that tracks invoices (waiting to be paid, received, overdue), saved history, sharing by PDF and WhatsApp, and a greeting with the business name and logo.
5. He asked for a real landing page that people see first, with a brand name, pop up style imagery and an interactive feel. He plans to generate images in ChatGPT, for example a pen resting on a contract.
6. He asked for business type at signup (freelancer, small business, bigger brand) and a trade, and for an owner admin view of signups that does not show anyone's documents. That needs Supabase.
7. Naming took several rounds. Vellum was an early working name and is dead. Coco finally designed his own logo and the name is Generate, written GENErate in the logo (dark green GENE, brass gold rate, with a folded corner document mark inside the G).
8. Later additions: currency chosen per document (not only naira), part payments, WhatsApp payment reminders in three tones, trade specific starter items, and the date filling in from the device clock.
9. The first version was a single HTML file. Coco objected: he uses React and wanted a proper multi file project. It was rebuilt in React and TypeScript, which is what this repo is.

## Where the code stands
Working: landing page (needs redo, below), setup, dashboard, invoices, receipts, contracts with 3 templates, part payments, reminders, six layouts, six fonts, any accent and text colour, white or ivory paper, typed, drawn or uploaded signature, PDF download, WhatsApp share. Data is saved only in the browser through a Repo interface, ready to swap for Supabase.

## The next job Coco cares about tonight: the landing page
Coco does not like the current landing page. He said so directly. It reads as generic. Rebuild it properly. This is the first thing every visitor sees, so it matters most.

### What he wants it to feel like
Premium, warm, human and confident. A document studio, not a software tool. Something a Lagos freelancer or shop owner would be proud to send a client link from. It must not look AI generated.

### What "AI looking" means here, so avoid all of it
A centred hero headline with a button under it and a gradient behind it.
Three or four equal cards in a row, each with a small icon, a bold title and one line of text.
Purple or blue gradients, glassmorphism, glowing blobs, sparkles, emoji as decoration.
Phrases like "Streamline your workflow", "Supercharge", "All in one platform", "Seamless".
Stock dashboard mockups floating at an angle.
Perfect symmetry everywhere, identical spacing everywhere, rounded corners on everything.
Fake testimonials and invented numbers. Do not invent either. Leave them out until real ones exist.

### Direction to take instead
Make the page behave like paper. Think a well made stationery brand or a law firm letterhead that got a modern, warm update.
Typography leads. Use Fraunces at large sizes with real size contrast, tabular numerals for money, small capital labels, and Instrument Sans only for small text. Let one headline be very big and let it break the grid a little.
Use asymmetry. Text on one side, a tall image bleeding off the edge on the other. Vary the rhythm of sections. Some wide, some narrow, one full bleed.
Use texture with restraint: a very faint paper grain, thin ruled lines like a ledger, a brass hairline, a wax seal or rubber stamp for emphasis.
Use the brand colours with discipline. Ivory is the main surface. Emerald is for weight, as a full bleed band or a dark section. Brass is only for small accents and rules. Do not mix in other colours.
Write in a Nigerian small business voice. Plain and specific. Use naira, WhatsApp, "your client", "the balance", "send it before they forget". Short sentences. No jargon. No exclamation marks.

### Interactions that earn their place
The hero document builds itself as you watch: a name appears, line items are written in, the total adds up, a signature draws itself stroke by stroke, then a stamp lands on it. Keep it short and let it play once.
A live try it section: the visitor types their business name and a client name and sees a real invoice update next to them, and can switch layout, font and colour right there. This is the "pop up" and interactive feel Coco asked for. The code for the look controls already exists in LookControls and DocumentPaper, reuse it.
Images rise into place on scroll like sheets of paper sliding onto a desk, a slight tilt that settles flat. Keep motion slow and soft. Respect prefers-reduced-motion.
Hover and tap states on buttons should feel tactile, for example a slight press down.

### Images
Coco will generate three images in ChatGPT with no text inside them:
1. A pen resting on a contract with a brass seal, on a deep green desk, warm light. Hero image.
2. A flat lay of a desk with a phone showing an invoice, ivory paper, a brass pen.
3. A close up of a hand signing a document.
He will give you the files. Until then use clearly marked placeholder blocks in the ivory and emerald palette, never stock photos or illustrations that look generic. Export images as webp, add width and height, lazy load them below the fold, and give them proper alt text.

### Page structure to start from (change it if you have a better idea)
1. Top strip with the logo (public/logo.png) and a Start free button.
2. Hero: big headline, one short sentence, one button, and the self building document with the hero image.
3. A plain statement of what it does in a single paragraph, not a feature grid.
4. The try it live section.
5. Part payments and WhatsApp reminders shown as a small story, for example an invoice, a deposit coming in, a reminder message being sent, rather than a bullet list.
6. Contracts and signatures, with the signing hand image.
7. Who it is for, written in a few honest lines.
8. A closing band in emerald with one button.
9. Footer with the logo and a note that documents are stored on the user's own device for now.

### Rules while building
Mobile first. Most users are on phones in Lagos with modest data, so keep images small, avoid heavy libraries and keep the page fast.
Keep it accessible: real headings in order, enough contrast, visible focus, buttons that are buttons.
Light and dark both must work, or the landing page can stay light only if it looks deliberate.
Keep it plain React and CSS in src/styles/landing.css and src/pages/Landing.tsx. No UI kits.
Test with Playwright screenshots on a 390 wide phone and a 1280 wide desktop, and look at them yourself before saying it is done. Be honest about anything that still looks generic.

## After the landing page
Supabase accounts and the owner admin page, as listed in CLAUDE.md.
