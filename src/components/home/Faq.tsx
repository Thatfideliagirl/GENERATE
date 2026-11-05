import { CONTACT } from '../../lib/constants'

const QA = [
  ['Is Generate really free?', 'Yes. Invoices, receipts, contracts, WhatsApp sending and signing are free. A paid plan called Generate more will add extra templates later. What is free today stays free.'],
  ['Does my client need Generate?', 'No. Your client gets a normal PDF, or a WhatsApp message with the document. They do not need an account.'],
  ['Can I use my own logo and signature?', 'Yes. Upload your logo, or use your business initials until you have one. Type, draw or upload your signature once and it goes on every document.'],
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
            <a className="h-ask" href={waHref} target="_blank" rel="noreferrer">
              <b>Still have a question?</b>
              <span>Send us a message on WhatsApp and a real person will answer.</span>
            </a>
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
