import { dictionaries, type Dictionary } from '@/i18n/dictionaries'
import {
  locales,
  type Locale,
  type ObligationStatus,
  type ObligationSummary,
  type StatusFilter,
} from './types'

export { locales as availableLocales }

export function normalizeLocale(locale: string | undefined): Locale | null {
  if (!locale) {
    return null
  }

  if (locale === 'es' || locale === 'en') {
    return locale
  }

  return null
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

export function filterObligationsByStatus(obligations: ObligationSummary[], status: string): ObligationSummary[] {
  const normalizedStatus = normalizeStatusFilter(status)
  if (normalizedStatus === 'all') {
    return obligations
  }

  return obligations.filter((obligation) => obligation.status === normalizedStatus)
}

export function sortObligationsByDueDate(obligations: ObligationSummary[]): ObligationSummary[] {
  return [...obligations].sort((left, right) => left.due_date.localeCompare(right.due_date))
}

export function buildStatusHref(locale: Locale, status: StatusFilter): string {
  return status === 'all' ? `/${locale}` : `/${locale}?status=${status}`
}

export function buildLocaleHref(locale: Locale, status: string): string {
  const normalizedStatus = normalizeStatusFilter(status)
  return normalizedStatus === 'all' ? `/${locale}` : `/${locale}?status=${normalizedStatus}`
}

export function buildKpis(obligations: ObligationSummary[]): {
  total: number
  pending: number
  in_progress: number
  submitted: number
  done: number
  overdue: number
  due_30_days: number
} {
  const today = startOfUtcDay(new Date())

  return {
    total: obligations.length,
    pending: countStatus(obligations, 'pending'),
    in_progress: countStatus(obligations, 'in_progress'),
    submitted: countStatus(obligations, 'submitted'),
    done: countStatus(obligations, 'done'),
    overdue: obligations.filter((obligation) => obligation.overdue).length,
    due_30_days: obligations.filter((obligation) => isDueWithinDays(obligation.due_date, 30, today)).length,
  }
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

export function isDueSoon(value: string, days: number): boolean {
  return isDueWithinDays(value, days, startOfUtcDay(new Date()))
}

export function normalizeStatusFilter(status: string): StatusFilter {
  if (status === 'all' || status === 'pending' || status === 'in_progress' || status === 'submitted' || status === 'done') {
    return status
  }

  return 'all'
}

function countStatus(obligations: ObligationSummary[], status: ObligationStatus): number {
  return obligations.filter((obligation) => obligation.status === status).length
}

function isDueWithinDays(value: string, days: number, todayUtc: number): boolean {
  const dueDateUtc = Date.parse(`${value}T00:00:00Z`)
  const diffDays = Math.floor((dueDateUtc - todayUtc) / 86_400_000)
  return diffDays >= 0 && diffDays <= days
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}
