import { Link } from 'react-router-dom'
import { Stroke } from './site'

/** Free signing for anyone, no account needed. It opens /sign; an email is asked for before the download. */
export function FreeSign() {
  return (
    <section className="h-sec h-free" id="sign-free" aria-labelledby="fs">
      <div className="h-in h-freew">
        <div>
          <p className="h-lbl">Free, no account needed</p>
          <h2 id="fs" className="h-big">
            Sign any document, <em className="h-s">free.</em>
          </h2>
          <p className="h-freelede">
            Got a PDF or a photo of a document to sign? Upload it, add your signature, initials or the date, and download the signed copy in a minute.
          </p>
          <ol className="h-freesteps">
            <li>
              <b>Upload</b>
              <span>A PDF or a photo, from your phone or laptop.</span>
            </li>
            <li>
              <b>Sign</b>
              <span>Draw your signature and drop it where it belongs.</span>
            </li>
            <li>
              <b>Download</b>
              <span>Enter your email and the signed copy is yours.</span>
            </li>
          </ol>
          <Link className="h-btn h-p" to="/sign">
            Sign a document now →
          </Link>
          <p className="h-freenote">Your file stays on your device. Nothing is uploaded to us.</p>
        </div>
        <div className="h-freeart" aria-hidden="true">
          <div className="h-freepage">
            <span className="h-fname">Tenancy agreement.pdf</span>
            <i className="h-t" />
            <i />
            <i />
            <i className="s" />
            <i />
            <i className="s" />
            <div className="h-freesig h-sg">
              <Stroke />
            </div>
            <span className="h-freedate">5 Nov 2026</span>
          </div>
          <span className="h-freetag">Signed ✓</span>
        </div>
      </div>
    </section>
  )
}
