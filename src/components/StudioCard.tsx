import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import type { Profile } from '../lib/types'
import { catOf, optionsOf, type CardContent, type CardOptions, type CatId } from '../lib/studio'
import { accentOf } from '../lib/style'
import { initialsOf } from '../lib/initials'
import { socialLines } from '../lib/social'

const Opt = createContext<{ o: CardOptions; profile: Profile }>({ o: optionsOf({} as CardContent), profile: {} as Profile })

/**
 * A gallery design drawn at its real size (540 wide). The same markup is shown on screen
 * and turned into the picture or PDF people download, so what they see is what they get.
 * Kept to plain boxes, borders and gradients so the picture comes out exactly like the screen.
 */
export function StudioCard({ cat, style, c, profile }: { cat: CatId; style: string; c: CardContent; profile: Profile }) {
  const o = optionsOf(c)
  const size = catOf(cat)?.size ?? { w: 540, h: 675 }
  const vars = {
    '--sa': o.color || accentOf(profile.style),
    '--hs': o.headSize,
    '--ts': o.textSize,
    ...(o.headFont ? { '--hf': o.headFont } : {}),
    ...(o.textFont ? { '--tf': o.textFont } : {}),
    ...(o.bg ? { background: o.bg } : {}),
  } as CSSProperties
  const cls = ['st-card', `st-${cat}`, `s-${style}`, o.align && `al-${o.align}`, o.headFont && 'hf', o.textFont && 'tf', o.color && 'own'].filter(Boolean).join(' ')
  const body = (() => {
    switch (cat) {
      case 'pricelist':
        return <PriceList style={style} c={c} profile={profile} />
      case 'thankyou':
        return <ThankYou style={style} c={c} profile={profile} />
      case 'paycard':
        return <PayCard style={style} c={c} profile={profile} />
      case 'promo':
        return <Promo style={style} c={c} profile={profile} />
      case 'festive':
        return <Festive style={style} c={c} profile={profile} />
      case 'delivery':
        return <Delivery style={style} c={c} profile={profile} />
    }
  })()
  const picW = Math.round(o.picW * size.w)
  const picH = o.picShape === 'circle' ? picW : Math.round(picW * (o.picAspect || 1))
  return (
    <Opt.Provider value={{ o, profile }}>
      <div className={cls} style={vars} data-hs={o.headSize} data-ts={o.textSize}>
        {o.bgImage && <div className="st-bgimg" style={{ backgroundImage: `url(${o.bgImage})`, opacity: o.bgOpacity }} />}
        {body}
        {o.pic && (
          <div
            className={`st-pic ${o.picShape}`}
            style={{ left: Math.round(o.picX * size.w), top: Math.round(o.picY * size.h), width: picW, height: picH, backgroundImage: `url(${o.pic})` }}
          />
        )}
        {o.mark && <div className="st-wm">Made with Generate</div>}
      </div>
    </Opt.Provider>
  )
}

type P = { style: string; c: CardContent; profile: Profile }

const price = (v: string, cur: string) => {
  const t = v.trim()
  if (!t) return ''
  const n = Number(t.replace(/,/g, ''))
  return Number.isFinite(n) && /^[\d.,\s]+$/.test(t) ? cur + n.toLocaleString('en-NG', { maximumFractionDigits: 2 }) : t
}

function Mark({ profile, size = 44 }: { profile: Profile; size?: number }) {
  const { o } = useContext(Opt)
  if (!o.showLogo) return null
  const logo = o.logo || profile.logo
  if (logo) return <img className="st-logo" src={logo} alt="" style={{ height: size, maxWidth: size * 3 }} />
  return (
    <span className="st-mono" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initialsOf(profile.name)}
    </span>
  )
}

function Brand({ profile, size }: { profile: Profile; size?: number }) {
  return (
    <div className="st-brand">
      <Mark profile={profile} size={size} />
      <span className="st-bn">{profile.name}</span>
    </div>
  )
}

/** Phone and social handles in one quiet line, each only when it is switched on. */
function Contact({ profile, phone }: { profile: Profile; phone?: string }) {
  const { o } = useContext(Opt)
  const bits = [o.showPhone ? phone ?? profile.phone : '', ...(o.showSocials ? socialLines(profile).map((s) => s.handle) : [])].filter(Boolean)
  if (!bits.length) return null
  return <div className="st-contact">{bits.join('   ·   ')}</div>
}

/** The owner's signature, when the design has a place for it and it is switched on. */
function Sig() {
  const { o, profile } = useContext(Opt)
  if (!o.showSign || !profile.signature) return null
  return <img className="st-sig" src={profile.signature} alt="" />
}

/** Words between == and == are highlighted. */
function Marked({ text }: { text: string }) {
  const parts = text.split(/==(.+?)==/g)
  return (
    <>
      {parts.map((t, i) =>
        i % 2 ? (
          <mark key={i} className="st-hl">
            {t}
          </mark>
        ) : (
          t
        ),
      )}
    </>
  )
}

/** Text with line breaks, bullet lines (starting with • or -), numbered lines (1. ) and highlights. Spans only, so it fits inside a paragraph. */
function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((l, i) => {
        const bullet = /^\s*[•\-*]\s+/.exec(l)
        const num = /^\s*(\d+)[.)]\s+/.exec(l)
        if (bullet || num) {
          const rest = l.slice((bullet || num)![0].length)
          return (
            <span key={i} className="st-ln st-li">
              <span className="st-lm">{num ? num[1] + '.' : '•'}</span>
              <span>
                <Marked text={rest} />
              </span>
            </span>
          )
        }
        return (
          <span key={i} className="st-ln">
            {l ? <Marked text={l} /> : '\u00a0'}
          </span>
        )
      })}
    </>
  )
}

/* ---------------- Price list ---------------- */

function PriceList({ style, c, profile }: P) {
  const items = c.items.filter((i) => i.a.trim() || i.b.trim()).slice(0, 12)
  const dense = items.length > 7 ? ' dense' : ''
  const list = (
    <ul className={'st-items' + dense}>
      {items.map((it, k) => (
        <li key={k} className={it.h ? 'hl' : undefined}>
          <div className="st-row">
            <span className="st-name">{it.a}</span>
            <span className="st-dots" />
            <span className="st-price">{price(it.b, c.currency)}</span>
          </div>
          {it.c && <div className="st-note">{it.c}</div>}
        </li>
      ))}
    </ul>
  )
  if (style === 'market') {
    return (
      <>
        <div className="st-band">
          <Brand profile={profile} size={40} />
          <h2 className="st-title">{c.title}</h2>
          {c.subtitle && <p className="st-sub">{c.subtitle}</p>}
        </div>
        <div className="st-pad">{list}</div>
        <div className="st-foot">
          {c.message && (
            <p className="st-msg">
              <Lines text={c.message} />
            </p>
          )}
          <Contact profile={profile} />
        </div>
      </>
    )
  }
  return (
    <>
      {style === 'midnight' && <div className="st-frame" />}
      <div className="st-head">
        <Brand profile={profile} size={style === 'boutique' ? 38 : 40} />
        <h2 className="st-title">{c.title}</h2>
        {c.subtitle && <p className="st-sub">{c.subtitle}</p>}
        {style !== 'chalk' && <div className="st-rule" />}
      </div>
      {list}
      <div className="st-foot">
        {c.message && (
            <p className="st-msg">
              <Lines text={c.message} />
            </p>
          )}
        <Contact profile={profile} />
      </div>
    </>
  )
}

/* ---------------- Thank you ---------------- */

function ThankYou({ style, c, profile }: P) {
  const inner: ReactNode = (
    <>
      {c.to && <p className="st-to">Dear {c.to},</p>}
      <h2 className="st-title">{c.title}</h2>
      <p className="st-msg">
        <Lines text={c.message} />
      </p>
      <Sig />
      {c.from && <p className="st-from">{c.from}</p>}
    </>
  )
  if (style === 'kraft') {
    return (
      <>
        <div className="st-tag">
          <span className="st-string" />
          <span className="st-hole" />
          {inner}
          <div className="st-tagfoot">
            <Brand profile={profile} size={30} />
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      {style === 'bloom' && (
        <>
          <span className="st-blob b1" />
          <span className="st-blob b2" />
          <span className="st-blob b3" />
        </>
      )}
      {style === 'gold' && <div className="st-frame" />}
      {style === 'clean' && <div className="st-bar" />}
      <div className="st-body">{inner}</div>
      <div className="st-foot">
        <Brand profile={profile} size={34} />
        <Contact profile={profile} />
      </div>
    </>
  )
}

/* ---------------- Payment details ---------------- */

const spaced = (acct: string) => acct.replace(/\s+/g, '').replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3')

function PayCard({ style, c, profile }: P) {
  const rows = (
    <div className="st-rows">
      <div>
        <span className="st-k">Bank</span>
        <b className="st-v">{c.bank || 'Your bank'}</b>
      </div>
      <div>
        <span className="st-k">Account number</span>
        <b className="st-v st-acct">{spaced(c.acct) || '0123456789'}</b>
      </div>
      <div>
        <span className="st-k">Account name</span>
        <b className="st-v">{c.acctName}</b>
      </div>
    </div>
  )
  if (style === 'card') {
    return (
      <>
        <div className="st-head">
          <Brand profile={profile} size={38} />
          <h2 className="st-title">{c.title}</h2>
        </div>
        <div className="st-bank">
          <div className="st-bankrow">
            <span className="st-chip" />
            <span className="st-bankname">{c.bank || 'Your bank'}</span>
          </div>
          <div className="st-acct">{spaced(c.acct) || '0123 456 789'}</div>
          <div className="st-bankrow">
            <span className="st-holder">{c.acctName}</span>
            <span className="st-circles">
              <i />
              <i />
            </span>
          </div>
        </div>
        <div className="st-foot">
          {c.message && (
            <p className="st-msg">
              <Lines text={c.message} />
            </p>
          )}
          <Contact profile={profile} phone={c.phone} />
        </div>
      </>
    )
  }
  if (style === 'roll') {
    return (
      <div className="st-roll">
        <div className="st-teeth top" />
        <div className="st-rollin">
          <Brand profile={profile} size={36} />
          <div className="st-dash" />
          <h2 className="st-title">{c.title}</h2>
          {rows}
          <div className="st-dash" />
          {c.message && (
            <p className="st-msg">
              <Lines text={c.message} />
            </p>
          )}
          <Contact profile={profile} phone={c.phone} />
        </div>
        <div className="st-teeth" />
      </div>
    )
  }
  return (
    <>
      <div className="st-head">
        <Brand profile={profile} size={style === 'bold' ? 42 : 40} />
        <h2 className="st-title">{c.title}</h2>
      </div>
      {rows}
      <div className="st-foot">
        {c.message && (
            <p className="st-msg">
              <Lines text={c.message} />
            </p>
          )}
        <Contact profile={profile} phone={c.phone} />
      </div>
    </>
  )
}

/* ---------------- Promo ---------------- */

function Promo({ style, c, profile }: P) {
  const details = (
    <>
      <h3 className="st-title">{c.title}</h3>
      {c.message && (
        <p className="st-msg">
          <Lines text={c.message} />
        </p>
      )}
      <div className="st-meta">
        {c.dates && <span className="st-dates">{c.dates}</span>}
        {c.code && <span className="st-code">{c.code}</span>}
      </div>
      {c.cta && <div className="st-cta">{c.cta}</div>}
    </>
  )
  if (style === 'tag') {
    return (
      <>
        <div className="st-head">
          <Brand profile={profile} size={38} />
        </div>
        <div className="st-swing">
          <span className="st-hole" />
          <div className="st-big">{c.big}</div>
        </div>
        <div className="st-body">{details}</div>
        <Contact profile={profile} />
      </>
    )
  }
  if (style === 'news') {
    return (
      <>
        <div className="st-mast">
          <span>{profile.name}</span>
          <span className="st-small">Special edition</span>
        </div>
        <div className="st-big">{c.big}</div>
        <div className="st-cols">
          <div>{details}</div>
        </div>
        <Contact profile={profile} />
      </>
    )
  }
  if (style === 'sticker') {
    return (
      <>
        <div className="st-head">
          <Brand profile={profile} size={38} />
        </div>
        <div className="st-stick">
          <div className="st-big">{c.big}</div>
        </div>
        <div className="st-body">{details}</div>
        <Contact profile={profile} />
      </>
    )
  }
  return (
    <>
      {style === 'spot' && <span className="st-glow" />}
      <div className="st-head">
        <Brand profile={profile} size={38} />
      </div>
      <div className="st-big">{c.big}</div>
      <div className="st-body">{details}</div>
      <Contact profile={profile} />
    </>
  )
}

/* ---------------- Festive ---------------- */

const CONFETTI = [
  [40, 30, 18, '#E2A33A'], [120, 70, -25, '#E46B5A'], [210, 24, 40, '#4CC38A'], [300, 60, 12, '#6FA8DC'],
  [390, 28, -35, '#E2A33A'], [470, 80, 25, '#E46B5A'], [70, 120, 50, '#6FA8DC'], [170, 140, -10, '#E2A33A'],
  [260, 110, 30, '#E46B5A'], [350, 150, -45, '#4CC38A'], [450, 130, 8, '#6FA8DC'], [500, 30, 60, '#4CC38A'],
  [20, 190, -20, '#E46B5A'], [500, 200, 35, '#E2A33A'],
] as const

const SNOW = [
  [40, 50], [110, 120], [190, 40], [260, 90], [330, 30], [410, 110], [480, 60], [70, 200], [460, 220], [30, 300], [500, 330],
] as const

function Festive({ style, c, profile }: P) {
  return (
    <>
      {style === 'evergreen' && (
        <>
          {SNOW.map(([x, y], i) => (
            <span key={i} className="st-snow" style={{ left: x, top: y }} />
          ))}
          <div className="st-tree">
            <span className="t1" />
            <span className="t2" />
            <span className="t3" />
            <span className="st-star" />
          </div>
        </>
      )}
      {style === 'crescent' && (
        <>
          <span className="st-moon" />
          <span className="st-moon2" />
          {SNOW.slice(0, 7).map(([x, y], i) => (
            <span key={i} className="st-twinkle" style={{ left: x, top: y * 0.7 + 10 }} />
          ))}
        </>
      )}
      {style === 'confetti' &&
        CONFETTI.map(([x, y, r, col], i) => (
          <span key={i} className="st-bit" style={{ left: x, top: y, transform: `rotate(${r}deg)`, background: col }} />
        ))}
      {style === 'greenwhite' && (
        <>
          <span className="st-gw l" />
          <span className="st-gw r" />
        </>
      )}
      {style === 'lilies' && (
        <>
          <span className="st-sun" />
          <span className="st-egg e1" />
          <span className="st-egg e2" />
          <span className="st-egg e3" />
        </>
      )}
      <div className="st-body">
        <h2 className="st-title">{c.title}</h2>
        <p className="st-msg">
          <Lines text={c.message} />
        </p>
        {c.from && <p className="st-from">{c.from}</p>}
      </div>
      <div className="st-foot">
        <Brand profile={profile} size={32} />
      </div>
    </>
  )
}

/* ---------------- Delivery note ---------------- */

/** Bars that look like a barcode, worked out from the number so the same note always draws the same bars. */
function Bars({ seed }: { seed: string }) {
  const out: number[] = []
  let h = 7
  for (const ch of seed + 'GENERATE') h = (h * 31 + ch.charCodeAt(0)) % 9973
  for (let i = 0; i < 46; i++) {
    h = (h * 17 + 11) % 9973
    out.push(1 + (h % 4))
  }
  return (
    <div className="st-bars" aria-hidden="true">
      {out.map((w, i) => (
        <i key={i} style={{ width: w, marginRight: ((w + i) % 3) + 1 }} />
      ))}
    </div>
  )
}

function Delivery({ style, c, profile }: P) {
  const items = c.items.filter((i) => i.a.trim() || i.b.trim()).slice(0, 12)
  const contact = [profile.phone, profile.address].filter(Boolean).join('   ·   ')
  return (
    <>
      <div className="st-dhead">
        <div className="st-dbiz">
          <Mark profile={profile} size={40} />
          <div>
            <div className="st-bn">{profile.name}</div>
            {contact && <div className="st-small">{contact}</div>}
          </div>
        </div>
        <div className="st-dkind">
          <div className="st-dtitle">Delivery note</div>
          <div className="st-small">
            No. {c.number} · {c.date}
          </div>
        </div>
      </div>
      {style === 'courier' && (
        <div className="st-label">
          <div>
            <span className="st-k">Tracking</span>
            <b className="st-bignum">{c.number}</b>
          </div>
          <Bars seed={c.number} />
        </div>
      )}
      <div className="st-to">
        <span className="st-k">Deliver to</span>
        <b>{c.to}</b>
        {c.address && (
          <span>
            <Lines text={c.address} />
          </span>
        )}
        {c.phone && <span>{c.phone}</span>}
      </div>
      <table className="st-tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th className="q">Qty</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, k) => (
            <tr key={k}>
              <td>{it.a}</td>
              <td className="q">{it.b}</td>
              <td className="n">{it.c}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {c.message && (
        <p className="st-dnote">
          <Lines text={c.message} />
        </p>
      )}
      <div className="st-signs">
        <div>
          <span className="st-line">
            <Sig />
          </span>
          <span className="st-k">Delivered by</span>
        </div>
        <div>
          <span className="st-line" />
          <span className="st-k">Received by, and date</span>
        </div>
      </div>
      {style === 'stamp' && <div className="st-stampbox">Received in good condition</div>}
    </>
  )
}

/**
 * Shrinks the words a little at a time until everything fits inside the card.
 * Used on screen and before the picture is made, so both always match.
 */
export function fitCard(el: HTMLElement) {
  const hs = Number(el.dataset.hs) || 1
  const ts = Number(el.dataset.ts) || 1
  let k = 1
  const apply = () => {
    el.style.setProperty('--hs', String(hs * k))
    el.style.setProperty('--ts', String(ts * k))
  }
  apply()
  while (el.scrollHeight > el.clientHeight + 1 && k > 0.55) {
    k = Math.round((k - 0.04) * 100) / 100
    apply()
  }
}
