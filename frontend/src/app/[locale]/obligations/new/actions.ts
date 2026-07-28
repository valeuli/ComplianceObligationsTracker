'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { createObligation, ApiRequestError } from '@/features/obligations/api/obligations-api'
import type {
  ApiErrorCode,
  CreateObligationActionState,
  CreateObligationInput,
  ObligationType,
} from '@/features/obligations/types'

export async function createObligationAction(
  _previousState: CreateObligationActionState,
  formData: FormData,
): Promise<CreateObligationActionState> {
  const locale = readLocale(formData.get('locale'))
  const input = readCreateObligationInput(formData)

  if (!input) {
    return { status: 'error', code: 'validation_error' }
  }

  let created: Awaited<ReturnType<typeof createObligation>>

  try {
    created = await createObligation(input)
  } catch (error) {
    if (error instanceof ApiRequestError) {
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
  redirect(`/${locale}/obligations/${created.id}`)
}

function readLocale(value: FormDataEntryValue | null): 'en' | 'es' {
  if (value === 'en' || value === 'es') {
    return value
  }

  return 'es'
}

function readCreateObligationInput(formData: FormData): CreateObligationInput | null {
  const type = readObligationType(formData.get('type'))
  const title = readRequiredText(formData.get('title'))
  const description = readRequiredText(formData.get('description'))
  const dueDate = readDate(formData.get('due_date'))
  const owner = readRequiredText(formData.get('owner'))
  const requiresDocument = readCheckbox(formData.get('requires_document'))
  const documentName = readOptionalText(formData.get('document_name'))
  const companyTaxId = readRequiredText(formData.get('company_tax_id'))

  if (!type || !title || !description || !dueDate || !owner || !companyTaxId) {
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
    company_tax_id: companyTaxId,
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

function normalizeErrorCode(code: ApiErrorCode): ApiErrorCode {
  if (code === 'invalid_response') {
    return 'api_error'
  }

  return code
}
