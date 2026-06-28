/** Map friendly SafetyMenu copy to persisted report reason codes. */
export type ReportReasonCode =
  | 'harassment'
  | 'inappropriate'
  | 'spam'
  | 'impersonation'
  | 'safety'
  | 'other'

export function mapReportReason(label: string): {
  reason: ReportReasonCode
  details?: string
} {
  switch (label) {
    case 'Not feeling it':
      return { reason: 'other', details: label }
    case 'Felt off / made me uncomfortable':
      return { reason: 'inappropriate', details: label }
    case 'Spam or fake page':
      return { reason: 'spam' }
    case 'Underage':
      return { reason: 'safety', details: label }
    case 'Something else':
      return { reason: 'other', details: label }
    default:
      return { reason: 'other', details: label }
  }
}
