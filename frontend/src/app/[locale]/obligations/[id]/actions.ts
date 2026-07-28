'use server'

import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { ApiRequestError, deleteObligation, transitionObligation } from '@/features/obligations/api/obligations-api'
import type {
  ApiErrorCode,
  DeleteObligationActionState,
  ObligationStatus,
  TransitionActionState,
} from '@/features/obligations/types'

export async function transitionObligationAction(
  _previousState: TransitionActionState,
  formData: FormData,
): Promise<TransitionActionState> {
  const locale = readLocale(formData.get('locale'))
  const obligationId = readString(formData.get('obligation_id'), 'obligation_id')
  const targetStatus = readObligationStatus(formData.get('target_status'))
  const expectedVersion = readExpectedVersion(formData.get('expected_version'))

  try {
    await transitionObligation(obligationId, targetStatus, expectedVersion)
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/obligations/${obligationId}`)
    return { status: 'success' }
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
}

function readLocale(value: FormDataEntryValue | null): 'en' | 'es' {
  const raw = readString(value, 'locale')
  if (raw === 'en' || raw === 'es') {
    return raw
  }

  return 'es'
}

function readString(value: FormDataEntryValue | null, key: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing field ${key}.`)
  }

  return value
}

function readExpectedVersion(value: FormDataEntryValue | null): number {
  const raw = readString(value, 'expected_version')
  const parsed = Number(raw)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Invalid expected_version.')
  }

  return parsed
}

function readObligationStatus(value: FormDataEntryValue | null): ObligationStatus {
  const raw = readString(value, 'target_status')

  if (raw === 'pending' || raw === 'in_progress' || raw === 'submitted' || raw === 'done') {
    return raw
  }

  throw new Error('Invalid target_status.')
}

function normalizeErrorCode(code: ApiErrorCode): ApiErrorCode {
  if (code === 'invalid_response') {
    return 'api_error'
  }

  return code
}

export async function deleteObligationAction(
  _previousState: DeleteObligationActionState,
  formData: FormData,
): Promise<DeleteObligationActionState> {
  const locale = readLocale(formData.get('locale'))
  const obligationId = readString(formData.get('obligation_id'), 'obligation_id')

  try {
    await deleteObligation(obligationId)
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
  redirect(`/${locale}`)
}
