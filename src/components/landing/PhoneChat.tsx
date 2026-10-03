import { useReveal } from './useReveal'

/** A phone showing the WhatsApp message a client receives. It plays once when it scrolls into view. */
export function PhoneChat({ message, client, file }: { message: string; client: string; file: string }) {
  const [ref, seen] = useReveal<HTMLDivElement>(0.35)
  return (
    <div ref={ref} className={'lp-phone' + (seen ? ' play' : '')} role="img" aria-label={`A WhatsApp chat with ${client}. The document is attached and the message is already written.`}>
      <div className="lp-phone-top">
        <span className="lp-av">{client.slice(0, 1)}</span>
        <span>
          <b>{client}</b>
          <i>online</i>
        </span>
      </div>
      <div className="lp-chat">
        <div className="lp-msg file">
          <div className="lp-fileicon" />
          <span>
            <b>{file}</b>
            <i>1 page · PDF</i>
          </span>
        </div>
        <div className="lp-msg text">
          {message}
          <span className="lp-ticks2">10:04 ✓✓</span>
        </div>
      </div>
    </div>
  )
}
