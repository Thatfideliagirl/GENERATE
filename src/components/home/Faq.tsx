import { CONTACT } from '../../lib/constants'

const QA = [
  ['Is Generate really free?', 'Yes. Invoices, receipts, contracts, WhatsApp sending and signing are free. A paid plan called Generate more will add extra templates later. What is free today stays free.'],
  ['Does my client need Generate?', 'No. Your client gets a normal PDF, or a WhatsApp message with the document. They do not need an account.'],
  ['Can I use my own logo and signature?', 'Yes. Upload your logo, or use your business initials until you have one. Type, draw or upload your signature once and it goes on every document.'],
  ['Can I sign a document someone sent me?', 'Yes. Upload the PDF or a photo of it, place your signature, initials or the date where they belong, and download the signed copy. It all happens on your phone.'],
  ['Can I take part payments?', 'Yes. Add each payment as it comes in. The invoice shows what has been paid and what is left, and you can make a receipt for each payment.'],
  ['Who can see my documents?', 'Only you, and the people you send them to. The Generate team can see who signed up, but cannot open your invoices, receipts or contracts.'],
  ['Do I need a laptop?', 'No. Generate is made for your phone first, and works on a laptop too.'],
]

export function Faq() {
  const wa = CONTACT.whatsapp.replace(/\D/g, '')
  const waHref = wa ? 'https://wa.me/' + (wa.startsWith('0') ? '234' + wa.slice(1) : wa) : ''
  return (
    <section className="h-sec h-faq" id="faq" aria-labelledby="fq">
      <div className="h-in h-faqw">
        <div>
          <p className="h-lbl">Questions</p>
          <h2 id="fq" className="h-big">
            Good to <em className="h-s">know.</em>
          </h2>
          {waHref && (
            <div className="h-ask">
              <b>Still have a question?</b>
              <span>Send us a message on WhatsApp. Let’s talk.</span>
              <a className="h-wa" href={waHref} target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.5 19.5 5.6 16A7.6 7.6 0 1 1 8.4 18.6z" />
                  <path d="M9.4 9.2c.2 2.5 2.4 4.9 5.3 5.4l1-1.2-1.6-.9-.8.7c-1-.4-1.9-1.3-2.4-2.4l.7-.8-.8-1.6z" />
                </svg>
                Chat with us on WhatsApp
              </a>
            </div>
          )}
        </div>
        <div className="h-qa">
          {QA.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                <i>{String(i + 1).padStart(2, '0')}</i>
                {q}
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
