export const obligationStatuses = ['pending', 'in_progress', 'submitted', 'done'] as const
export type ObligationStatus = (typeof obligationStatuses)[number]

export const obligationTypes = ['annual_report', 'franchise_tax', 'boi_report', 'registered_agent_renewal'] as const
export type ObligationType = (typeof obligationTypes)[number]

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]

export const statusFilters = ['all', ...obligationStatuses] as const
export type StatusFilter = (typeof statusFilters)[number]

export const transitionReasons = ['document_required', 'invalid_transition'] as const
export type TransitionReason = (typeof transitionReasons)[number]

export const apiErrorCodes = [
  'api_error',
  'invalid_response',
  'invalid_transition',
  'network_error',
  'not_found',
  'required_document_missing',
  'validation_error',
  'version_conflict',
] as const
export type ApiErrorCode = (typeof apiErrorCodes)[number]

export interface TransitionOption {
  status: ObligationStatus
  enabled: boolean
  reason: TransitionReason | null
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
  code: ApiErrorCode
  message: string
  status: number
}

export type TransitionActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; code: ApiErrorCode }
