import type { Dictionary } from './dictionaries'

export const en: Dictionary = {
  app: {
    title: 'Compliance Tracker',
    subtitle: 'Compliance obligations dashboard',
    description: 'Review obligations, due dates, and status at a glance.',
  },
  actions: {
    newObligation: 'Nueva obligación',
  },
  filters: {
    label: 'Filter by status',
    all: 'All',
    pending: 'Pending',
    in_progress: 'In progress',
    submitted: 'Submitted',
    done: 'Done',
  },
  kpis: {
    total: 'Total',
    pending: 'Pending',
    in_progress: 'In progress',
    submitted: 'Submitted',
    done: 'Done',
    overdue: 'Overdue',
    due_30_days: 'Due in 30 days',
  },
  fields: {
    title: 'Title',
    type: 'Type',
    owner: 'Owner',
    due_date: 'Due date',
    overdue: 'Overdue',
    noResults: 'No obligations match the current filter.',
    emptyState: 'There are no obligations yet.',
    dueSoon: 'Due in 30 days',
  },
  statuses: {
    pending: 'Pending',
    in_progress: 'In progress',
    submitted: 'Submitted',
    done: 'Done',
  },
  types: {
    annual_report: 'Annual report',
    franchise_tax: 'Franchise tax',
    boi_report: 'BOI report',
    registered_agent_renewal: 'Registered agent renewal',
  },
}
