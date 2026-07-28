import type {
  ApiError as ApiErrorBody,
  ApiErrorCode,
  AuditEntry,
  CreateObligationInput,
  ObligationDetail,
  ObligationStatus,
  ObligationSummary,
  ObligationType,
  UpdateObligationInput,
  TransitionOption,
} from '../types'

const apiUrl = process.env.API_URL ?? 'http://127.0.0.1:8000'

class ApiRequestError extends Error implements ApiErrorBody {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function listObligations(): Promise<ObligationSummary[]> {
  const payload = await requestJson('/api/obligations')

  if (!isUnknownArray(payload)) {
    throw new ApiRequestError('invalid_response', 'The obligations API returned an invalid payload.', 502)
  }

  return payload.map(parseObligationSummary)
}

export async function getObligation(obligationId: string): Promise<ObligationDetail> {
  const payload = await requestJson(`/api/obligations/${obligationId}`)
  return parseObligationDetail(payload)
}

export async function transitionObligation(
  obligationId: string,
  targetStatus: ObligationStatus,
  expectedVersion: number,
): Promise<ObligationDetail> {
  const payload = await requestJson(`/api/obligations/${obligationId}/transitions`, {
    method: 'POST',
    body: JSON.stringify({
      target_status: targetStatus,
      expected_version: expectedVersion,
    }),
  })

  return parseObligationDetail(payload)
}

export async function createObligation(input: CreateObligationInput): Promise<ObligationDetail> {
  const payload = await requestJson('/api/obligations', {
    method: 'POST',
    body: JSON.stringify({
      type: input.type,
      title: input.title,
      description: input.description,
      due_date: input.due_date,
      owner: input.owner,
      requires_document: input.requires_document,
      document_name: input.document_name,
      company_tax_id: input.company_tax_id,
    }),
  })

  return parseObligationDetail(payload)
}

export async function updateObligation(
  obligationId: string,
  input: UpdateObligationInput & { expected_version: number },
): Promise<ObligationDetail> {
  const payload = await requestJson(`/api/obligations/${obligationId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...input,
    }),
  })

  return parseObligationDetail(payload)
}

export async function deleteObligation(obligationId: string): Promise<void> {
  await requestJson(`/api/obligations/${obligationId}`, {
    method: 'DELETE',
  })
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(`${apiUrl}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    })
  } catch {
    throw new ApiRequestError('network_error', 'Unable to reach the obligations API.', 503)
  }

  const payload = await readJson(response)

  if (!response.ok) {
    throw toHttpError(response.status, payload)
  }

  return payload
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

function parseObligationDetail(value: unknown): ObligationDetail {
  const summary = parseObligationSummary(value)

  if (!isObject(value)) {
    throw new ApiRequestError('invalid_response', 'The obligations API returned an invalid obligation.', 502)
  }

  return {
    ...summary,
    audit_history: readAuditHistory(value, 'audit_history'),
  }
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
    due_date: readDateString(value, 'due_date'),
    owner: readString(value, 'owner'),
    requires_document: readBoolean(value, 'requires_document'),
    document_name: readNullableString(value, 'document_name'),
    company_tax_id_masked: readString(value, 'company_tax_id_masked'),
    version: readNumber(value, 'version'),
    overdue: readBoolean(value, 'overdue'),
    transition_options: readTransitionOptions(value, 'transition_options'),
  }
}

function readAuditHistory(value: Record<string, unknown>, key: string): AuditEntry[] {
  const raw = value[key]

  if (!isUnknownArray(raw)) {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw.map((entry) => {
    if (!isObject(entry)) {
      throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
    }

    return {
      previous_status: readObligationStatus(entry, 'previous_status'),
      new_status: readObligationStatus(entry, 'new_status'),
      changed_at: readString(entry, 'changed_at'),
    }
  })
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
      reason: readNullableTransitionReason(option, 'reason'),
    }
  })
}

function readNullableTransitionReason(value: Record<string, unknown>, key: string): TransitionOption['reason'] {
  const raw = value[key]

  if (raw === null) {
    return null
  }

  if (raw === 'document_required' || raw === 'invalid_transition') {
    return raw
  }

  throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
}

function readString(value: Record<string, unknown>, key: string): string {
  const raw = value[key]

  if (typeof raw !== 'string') {
    throw new ApiRequestError('invalid_response', `Missing or invalid field ${key}.`, 502)
  }

  return raw
}

function readDateString(value: Record<string, unknown>, key: string): string {
  const raw = readString(value, key)
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

function isErrorBody(value: unknown): value is { code: ApiErrorCode; message: string } {
  return isObject(value) && typeof value.code === 'string' && typeof value.message === 'string'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

export { ApiRequestError }
