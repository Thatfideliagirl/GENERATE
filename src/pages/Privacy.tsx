import { Link } from 'react-router-dom'
import { BRAND } from '../lib/constants'

/** A plain language privacy page. It is a draft for the owner to have a lawyer check before launch. */
export default function Privacy() {
  return (
    <div className="adm priv">
      <header className="adm-top">
        <Link to="/" className="adm-logo" aria-label={`${BRAND} home`}>
          <img src="./logo.png" alt={BRAND} width={150} height={33} />
        </Link>
        <span className="adm-gap" />
        <Link className="btn g" to="/">
          Back to home
        </Link>
      </header>
      <main className="adm-main">
        <h1>Privacy</h1>
        <p className="adm-lead">How {BRAND} handles your details. Written in plain words.</p>

        <h2>What we collect</h2>
        <p>When you create an account we keep your name, business name, email, WhatsApp number, the kind of business you run and what you sell or do. We also keep what you add to your profile and the documents you make: your logo, signature, bank details for invoices, and your invoices, receipts and contracts.</p>

        <h2>What the owner of {BRAND} can see</h2>
        <p>The owner can see a list of signups: name, business, business type, trade, signup date and email. The owner cannot open your invoices, receipts or contracts. The system is built so that the owner's account has no way to read them.</p>

        <h2>Who else sees your documents</h2>
        <p>Only you, and the people you send a document to. When you tap send on WhatsApp, the message opens in your own WhatsApp and you choose to send it.</p>

        <h2>Why we use your details</h2>
        <p>To run your account, make your documents and show you your dashboard. We do not sell your details.</p>

        <h2>Your rights</h2>
        <p>Under the Nigeria Data Protection Act you can ask to see, correct or delete your details. You can also download a backup of your documents from your profile. To ask us anything about your details, write to the email shown on the {BRAND} website.</p>

        <p className="adm-demo" role="note">
          This page is a draft. Have a lawyer read it and add the owner's registered business name and contact email before {BRAND} opens to the public.
        </p>
      </main>
    </div>
  )
}
