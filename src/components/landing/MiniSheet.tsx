import type { Sample } from './samples'
import { DocumentPaper } from '../DocumentPaper'

/** A real document drawn small, for stacks of sample papers. */
export function MiniSheet({ sample, className = '' }: { sample: Sample; className?: string }) {
  return (
    <div className={'lp-mini ' + className} aria-hidden="true">
      <div className="lp-mini-in">
        <DocumentPaper doc={sample.doc} profile={sample.profile} />
      </div>
    </div>
  )
}
