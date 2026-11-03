# Fifi's Link Tree — Project Notes

Saved from the first planning chat. Update this file as decisions are made.

## Goal
A personal link tree / portfolio for Fifi that is **not** the basic, generic link tree.
It should also be shareable: other people should be able to copy it and make their own.

## Requirements
- **No backend / no Supabase.** Unused free-tier backends get paused or blocked, so everything is static.
- **Links live in one data file** (e.g. `links.json` or `links.js`). To add a link, edit one file (or just tell Claude and it gets added).
- **Unlimited links**, with support for grouping (categories/sections).
- **Easy to update:** tell Claude "add this link" and it's appended to the data file.
- **Template-friendly:** anyone can fork/clone, change the data file + a few theme settings, and have their own.
- Hosting: free static hosting (GitHub Pages / Netlify / Vercel / Cloudflare Pages).
- Not a boring stack of rounded buttons; the design should have personality.

## Open items
- [ ] Choose a design direction (see ideas below — to be discussed)
- [ ] Collect all of Fifi's links (name, URL, category, optional icon/description)
- [ ] Pick hosting
- [ ] Decide on the repo name (planned: "Fifi's Link Tree" on GitHub)

## Design directions suggested (to discuss)
1. **Phone-in-a-phone (OS style):** the page looks like a phone home screen; links are app icons, categories are folders, tapping opens a "app" window.
2. **Terminal / hacker:** a command-line UI. Links are commands (`ls links/`, `open github`).
3. **Retro desktop (Win95 / Mac OS 9):** draggable windows, folders, a start menu.
4. **Bento grid:** Apple-style tiles of different sizes, each link a card with its own colour/animation.
5. **Editorial / magazine:** large type, numbered links, big hover images. Very clean and fashion-forward.
6. **Neo-brutalism:** thick borders, loud colours, offset shadows, playful stickers.
7. **Glassmorphism + aurora:** frosted cards over a soft animated gradient.
8. **Spotify / music-player style:** each link is a "track", with a now-playing bar.
9. **Polaroid / scrapbook:** pinned photos and sticky notes on a corkboard.
10. **3D / spatial:** links floating in a 3D scene you can move through (more complex).
