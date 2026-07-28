import { en } from './en'
import { es } from './es'

export interface Dictionary {
  app: {
    title: string
    subtitle: string
    description: string
  }
  actions: {
    newObligation: string
  }
  create: {
    title: string
    description: string
    backToDashboard: string
    submit: string
    submitting: string
    fields: {
      type: string
      title: string
      description: string
      dueDate: string
      owner: string
      requiresDocument: string
      documentName: string
      companyTaxId: string
    }
    help: {
      type: string
      documentOptional: string
      documentRequired: string
      companyTaxId: string
    }
    errors: {
      validation: string
      network: string
      api: string
    }
  }
  filters: {
    label: string
    all: string
    pending: string
    in_progress: string
    submitted: string
    done: string
  }
  kpis: {
    total: string
    pending: string
    in_progress: string
    submitted: string
    done: string
    overdue: string
    due_30_days: string
  }
  fields: {
    title: string
    type: string
    owner: string
    due_date: string
    overdue: string
    noResults: string
    emptyState: string
    dueSoon: string
    documentName: string
    companyTaxIdMasked: string
    currentVersion: string
  }
  statuses: {
    pending: string
    in_progress: string
    submitted: string
    done: string
  }
  types: {
    annual_report: string
    franchise_tax: string
    boi_report: string
    registered_agent_renewal: string
  }
  detail: {
    title: string
    description: string
    backToDashboard: string
    overview: string
    transitions: string
    auditTrail: string
    auditTrailDescription: string
    noDocument: string
    noAuditTrail: string
    noTransitions: string
    loadingAudit: string
    transitioning: string
    currentRecordChanged: string
    invalidTransition: string
    documentRequired: string
    networkError: string
    genericError: string
    reloadRecord: string
    retry: string
    transitionTo: string
    selectAvailableTransition: string
    noDocumentHint: string
    transitionDisabled: string
    onTime: string
  }
  reasons: {
    document_required: string
    invalid_transition: string
  }
}

export const dictionaries: Record<'en' | 'es', Dictionary> = {
  en,
  es,
}

export function getDictionary(locale: 'en' | 'es'): Dictionary {
  return dictionaries[locale]
}
