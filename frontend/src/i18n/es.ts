import type { Dictionary } from './dictionaries'

export const es: Dictionary = {
  app: {
    title: 'Compliance Tracker',
    subtitle: 'Panel de obligaciones de cumplimiento',
    description: 'Revisa obligaciones, vencimientos y estado de forma clara.',
  },
  actions: {
    newObligation: 'Nueva obligación',
  },
  filters: {
    label: 'Filtrar por estado',
    all: 'Todas',
    pending: 'Pendiente',
    in_progress: 'En proceso',
    submitted: 'Presentada',
    done: 'Terminada',
  },
  kpis: {
    total: 'Total',
    pending: 'Pendientes',
    in_progress: 'En proceso',
    submitted: 'Presentadas',
    done: 'Terminadas',
    overdue: 'Vencidas',
    due_30_days: 'Vencen en 30 días',
  },
  fields: {
    title: 'Título',
    type: 'Tipo',
    owner: 'Responsable',
    due_date: 'Vencimiento',
    overdue: 'Vencida',
    noResults: 'No hay obligaciones para este filtro.',
    emptyState: 'Todavía no hay obligaciones.',
    dueSoon: 'Vencen en 30 días',
  },
  statuses: {
    pending: 'Pendiente',
    in_progress: 'En proceso',
    submitted: 'Presentada',
    done: 'Terminada',
  },
  types: {
    annual_report: 'Reporte anual',
    franchise_tax: 'Franchise tax',
    boi_report: 'Reporte BOI',
    registered_agent_renewal: 'Renovación de agente registrado',
  },
}
