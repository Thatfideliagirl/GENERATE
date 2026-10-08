export interface ContractTemplate {
  id: string
  title: string
  body: string
}

/**
 * Plain starting points for agreements. Words in double curly brackets are filled in
 * automatically from the document. Lines starting with # become headings.
 * These are not legal advice, so have a lawyer check them before you promote them.
 */
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 't1',
    title: 'Service agreement',
    body: `# Parties
This agreement is made on {{date}} between {{business}} (the Service Provider) and {{client}} (the Client).

# The work
The Service Provider will deliver the following services: [describe the work here].

# Payment
The Client will pay {{fee}} for the work. [Say when payments are due, for example half before work starts and half on delivery.]

# Timeline
Work begins on {{start}} and is expected to finish by {{end}}. Delays caused by late feedback or late payment move the dates by the same number of days.

# Changes
Extra work outside this agreement will be agreed in writing and priced separately.

# Ownership
After full payment, the Client owns the final delivered work. The Service Provider may show the work in a portfolio unless the Client asks in writing not to.

# Confidentiality
Both sides will keep private information shared during this work confidential.

# Ending the agreement
Either side may end this agreement with 7 days written notice. The Client pays for all work completed up to that date.

# Agreement
By signing below, both sides agree to these terms.`,
  },
  {
    id: 't2',
    title: 'Creative project agreement',
    body: `# Parties
This agreement is made on {{date}} between {{business}} (the Creator) and {{client}} (the Client).

# What you will receive
The Creator will deliver: [list the final files or results, for example logo, brand guide, 3 social media designs].

# Fee and deposit
The total fee is {{fee}}. A deposit of [amount] is due before work starts and is not refundable. The balance is due before the final files are released.

# Timeline
Work starts on {{start}} with delivery planned for {{end}}. The Client agrees to give feedback within 3 days of each draft.

# Revisions
The fee includes [2] rounds of revisions. Extra revisions are charged at [rate] each.

# Ownership
The Client owns the final files after full payment. Unused drafts and concepts remain with the Creator.

# Credit
The Creator may show the finished work in a portfolio and on social media.

# Cancelling
If the Client cancels, the deposit is kept and the Client pays for any work already done beyond it.

# Agreement
By signing below, both sides agree to these terms.`,
  },
  {
    id: 't3',
    title: 'Confidentiality agreement',
    body: `# Parties
This agreement is made on {{date}} between {{business}} and {{client}}.

# What is confidential
Any private business, customer, pricing, financial or technical information shared between the two sides, whether written, spoken or digital.

# What each side agrees
Each side will keep the other's confidential information private, use it only for the purpose of working together, and not share it with anyone else without written permission.

# What is not covered
Information that is already public, that the receiving side already knew, or that must be shared by law.

# How long it lasts
This agreement lasts for 2 years from {{start}}.

# Returning information
When asked, each side will return or delete the other's confidential information.

# Agreement
By signing below, both sides agree to these terms.`,
  },
]
