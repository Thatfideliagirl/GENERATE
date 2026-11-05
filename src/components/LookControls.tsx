import type { Style } from '../lib/types'
import { ACCENTS, FONTS, LAYOUTS, PAPERS, STYLE_DEFAULTS, TEXT_COLOURS } from '../lib/constants'
import { accentOf } from '../lib/style'
import { isHex } from '../lib/format'

interface Props {
  style: Style
  onChange: (patch: Partial<Style>) => void
}

function Chips({
  label,
  options,
  current,
  onPick,
}: {
  label: string
  options: Record<string, string>
  current: string
  onPick: (v: string) => void
}) {
  return (
    <div className="lk">
      <span className="mu small">{label}</span>
      <div className="chips">
        {Object.entries(options).map(([value, name]) => (
          <button key={value} type="button" className={'chip' + (current === value ? ' on' : '')} onClick={() => onPick(value)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Layout, font, colour and paper choices. Used on the landing page demo, profile and every document. */
export function LookControls({ style, onChange }: Props) {
  const text = (style.text || '#14251F').toLowerCase()
  return (
    <div>
      <Chips label="Layout" options={LAYOUTS} current={style.layout || STYLE_DEFAULTS.layout} onPick={(v) => onChange({ layout: v })} />
      <Chips label="Font" options={FONTS} current={style.font || STYLE_DEFAULTS.font} onPick={(v) => onChange({ font: v })} />

      <div className="lk">
        <span className="mu small">Accent colour</span>
        <div className="chips">
          {Object.entries(ACCENTS).map(([name, hex]) => (
            <button
              key={name}
              type="button"
              className={'sw' + (style.accent === name ? ' on' : '')}
              style={{ background: hex }}
              aria-label={name}
              onClick={() => onChange({ accent: name })}
            />
          ))}
          <label className={'sw cust' + (isHex(style.accent) ? ' on' : '')} aria-label="Pick any accent colour">
            <input type="color" value={accentOf(style)} onChange={(e) => onChange({ accent: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="lk">
        <span className="mu small">Text colour</span>
        <div className="chips">
          {Object.entries(TEXT_COLOURS).map(([hex, name]) => (
            <button
              key={hex}
              type="button"
              className={'sw' + (text === hex.toLowerCase() ? ' on' : '')}
              style={{ background: hex }}
              aria-label={name}
              onClick={() => onChange({ text: hex })}
            />
          ))}
          <label
            className={'sw cust' + (!style.text || TEXT_COLOURS[style.text] ? '' : ' on')}
            aria-label="Pick any text colour"
          >
            <input type="color" value={isHex(style.text) ? style.text : '#14251F'} onChange={(e) => onChange({ text: e.target.value })} />
          </label>
        </div>
      </div>

      <Chips
        label="Paper"
        options={PAPERS}
        current={style.paper || STYLE_DEFAULTS.paper}
        onPick={(v) => onChange({ paper: v as Style['paper'] })}
      />
    </div>
  )
}
