'use server'

import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { ApiRequestError, updateObligation } from '@/features/obligations/api/obligations-api'
import type {
  ApiErrorCode,
  ObligationMutationActionState,
  ObligationType,
  UpdateObligationInput,
  UpdateObligationActionState,
} from '@/features/obligations/types'

export async function updateObligationAction(
  _previousState: UpdateObligationActionState,
  formData: FormData,
): Promise<ObligationMutationActionState> {
  const locale = readLocale(formData.get('locale'))
  const obligationId = readString(formData.get('obligation_id'), 'obligation_id')
  const expectedVersion = readExpectedVersion(formData.get('expected_version'))
  const input = readUpdateObligationInput(formData)

  if (!input) {
    return { status: 'error', code: 'validation_error' }
  }

  let updated: Awaited<ReturnType<typeof updateObligation>>

  try {
    updated = await updateObligation(obligationId, {
      ...input,
      expected_version: expectedVersion,
    })
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.code === 'not_found') {
        notFound()
      }

      return {
        status: 'error',
        code: normalizeErrorCode(error.code),
      }
    }

    return {
      status: 'error',
      code: 'network_error',
    }
  }

  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/obligations/${obligationId}`)
  redirect(`/${locale}/obligations/${updated.id}`)
}

function readLocale(value: FormDataEntryValue | null): 'en' | 'es' {
  if (value === 'en' || value === 'es') {
    return value
  }

  return 'es'
}

function readUpdateObligationInput(formData: FormData): UpdateObligationInput | null {
  const type = readObligationType(formData.get('type'))
  const title = readRequiredText(formData.get('title'))
  const description = readRequiredText(formData.get('description'))
  const dueDate = readDate(formData.get('due_date'))
  const owner = readRequiredText(formData.get('owner'))
  const requiresDocument = readCheckbox(formData.get('requires_document'))
  const documentName = readOptionalNullableText(formData.get('document_name'))
  const companyTaxId = readOptionalText(formData.get('company_tax_id'))

  if (!type || !title || !description || !dueDate || !owner) {
    return null
  }

  return {
    type,
    title,
    description,
    due_date: dueDate,
    owner,
    requires_document: requiresDocument,
    document_name: documentName,
    ...(companyTaxId ? { company_tax_id: companyTaxId } : {}),
  }
}

function readObligationType(value: FormDataEntryValue | null): ObligationType | null {
  if (
    value === 'annual_report' ||
    value === 'franchise_tax' ||
    value === 'boi_report' ||
    value === 'registered_agent_renewal'
  ) {
    return value
  }

  return null
}

function readRequiredText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (value.trim().length === 0) {
    return null
  }

  return value
}

function readOptionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (value.trim().length === 0) {
    return null
  }

  return value
}

function readOptionalNullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (value.trim().length === 0) {
    return null
  }

  return value
}

function readDate(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  return value
}

function readCheckbox(value: FormDataEntryValue | null): boolean {
  return value === 'on'
}

function readExpectedVersion(value: FormDataEntryValue | null): number {
  const raw = readRequiredText(value)

  if (!raw) {
    throw new Error('Missing expected_version.')
  }

  const parsed = Number(raw)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Invalid expected_version.')
  }

  return parsed
}

function readString(value: FormDataEntryValue | null, key: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing field ${key}.`)
  }

  return value
}

function normalizeErrorCode(code: ApiErrorCode): ApiErrorCode {
  if (code === 'invalid_response') {
    return 'api_error'
  }

  return code
}
