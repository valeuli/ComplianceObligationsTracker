export const obligationStatuses = ['pending', 'in_progress', 'submitted', 'done'] as const
export type ObligationStatus = (typeof obligationStatuses)[number]

export const obligationTypes = ['annual_report', 'franchise_tax', 'boi_report', 'registered_agent_renewal'] as const
export type ObligationType = (typeof obligationTypes)[number]

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]

export const statusFilters = ['all', ...obligationStatuses] as const
export type StatusFilter = (typeof statusFilters)[number]

export interface TransitionOption {
  status: ObligationStatus
  enabled: boolean
  reason: string | null
}

export interface AuditEntry {
  previous_status: ObligationStatus
  new_status: ObligationStatus
  changed_at: string
}

export interface ObligationSummary {
  id: string
  type: ObligationType
  title: string
  description: string
  status: ObligationStatus
  due_date: string
  owner: string
  requires_document: boolean
  document_name: string | null
  company_tax_id_masked: string
  version: number
  overdue: boolean
  transition_options: TransitionOption[]
}

export interface ObligationDetail extends ObligationSummary {
  audit_history: AuditEntry[]
}

export interface ApiError {
  code: string
  message: string
  status: number
}
