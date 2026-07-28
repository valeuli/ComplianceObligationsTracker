import type {
  ApiError as ApiErrorBody,
  ObligationStatus,
  ObligationSummary,
  ObligationType,
  TransitionOption,
} from '../types'

const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:8000'

class ApiRequestError extends Error implements ApiErrorBody {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function listObligations(): Promise<ObligationSummary[]> {
  let response: Response

  try {
    response = await fetch(`${apiUrl}/api/obligations`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new ApiRequestError('network_error', 'Unable to reach the obligations API.', 503)
  }

  const payload = await readJson(response)

  if (!response.ok) {
    throw toHttpError(response.status, payload)
  }

  if (!isUnknownArray(payload)) {
    throw new ApiRequestError('invalid_response', 'The obligations API returned an invalid payload.', 502)
  }

  return payload.map(parseObligationSummary)
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.length === 0) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new ApiRequestError('invalid_response', 'The obligations API returned invalid JSON.', 502)
  }
}

function toHttpError(status: number, payload: unknown): ApiRequestError {
  if (isErrorBody(payload)) {
    return new ApiRequestError(payload.code, payload.message, status)
  }

  return new ApiRequestError('api_error', 'The obligations API request failed.', status)
}

function parseObligationSummary(value: unknown): ObligationSummary {
  if (!isObject(value)) {
    throw new ApiRequestError('invalid_response', 'The obligations API returned an invalid obligation.', 502)
  }

  return {
    id: readString(value, 'id'),
    type: readObligationType(value, 'type'),
    title: readString(value, 'title'),
    description: readString(value, 'description'),
    status: readObligationStatus(value, 'status'),
    due_date: readString(value, 'due_date'),
    owner: readString(value, 'owner'),
    requires_document: readBoolean(value, 'requires_document'),
    document_name: readNullableString(value, 'document_name'),
    company_tax_id_masked: readString(value, 'company_tax_id_masked'),
    version: readNumber(value, 'version'),
    overdue: readBoolean(value, 'overdue'),
    transition_options: readTransitionOptions(value, 'transition_options'),
  }
}

function readTransitionOptions(value: Record<string, unknown>, key: string): TransitionOption[] {
  const raw = value[key]

  if (!isUnknownArray(raw)) {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw.map((option) => {
    if (!isObject(option)) {
      throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
    }

    return {
      status: readObligationStatus(option, 'status'),
      enabled: readBoolean(option, 'enabled'),
      reason: readNullableString(option, 'reason'),
    }
  })
}

function readString(value: Record<string, unknown>, key: string): string {
  const raw = value[key]

  if (typeof raw !== 'string') {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readNullableString(value: Record<string, unknown>, key: string): string | null {
  const raw = value[key]

  if (raw === null) {
    return null
  }

  if (typeof raw !== 'string') {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readNumber(value: Record<string, unknown>, key: string): number {
  const raw = value[key]

  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readBoolean(value: Record<string, unknown>, key: string): boolean {
  const raw = value[key]

  if (typeof raw !== 'boolean') {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readObligationStatus(value: Record<string, unknown>, key: string): ObligationStatus {
  const raw = value[key]

  if (raw !== 'pending' && raw !== 'in_progress' && raw !== 'submitted' && raw !== 'done') {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readObligationType(value: Record<string, unknown>, key: string): ObligationType {
  const raw = value[key]

  if (
    raw !== 'annual_report' &&
    raw !== 'franchise_tax' &&
    raw !== 'boi_report' &&
    raw !== 'registered_agent_renewal'
  ) {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function isErrorBody(value: unknown): value is { code: string; message: string } {
  return isObject(value) && typeof value.code === 'string' && typeof value.message === 'string'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

export { ApiRequestError }
