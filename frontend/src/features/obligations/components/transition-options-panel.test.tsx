import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { es } from '@/i18n/es'

import { TransitionOptionsPanel } from './transition-options-panel'

const { refreshMock, transitionObligationActionMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  transitionObligationActionMock: vi.fn(async () => ({ status: 'success' })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}))

vi.mock('@/app/[locale]/obligations/[id]/actions', () => ({
  transitionObligationAction: transitionObligationActionMock,
}))

describe('TransitionOptionsPanel', () => {
  beforeEach(() => {
    refreshMock.mockClear()
    transitionObligationActionMock.mockClear()
  })

  it('shows a disabled submitted transition when the backend marks it as unavailable because a document is required', () => {
    render(
      <TransitionOptionsPanel
        locale="es"
        obligationId="11111111-1111-1111-1111-111111111111"
        expectedVersion={3}
        dictionary={es}
        transitionOptions={[
          {
            status: 'submitted',
            enabled: false,
            reason: 'document_required',
          },
        ]}
      />,
    )

    expect(screen.getByText(es.statuses.submitted)).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => {
        if (element?.tagName !== 'P') {
          return false
        }

        const text = element.textContent ?? ''

        return (
          text.includes(es.detail.transitionDisabled) &&
          text.includes(es.reasons.document_required)
        )
      }),
    ).toBeInTheDocument()

    const disabledButton = screen.getByRole('button', { name: `${es.detail.transitionTo} ${es.statuses.submitted}` })
    expect(disabledButton).toBeDisabled()

    fireEvent.click(disabledButton)
    expect(transitionObligationActionMock).not.toHaveBeenCalled()
  })

  it('shows an enabled transition when the backend marks it as allowed', () => {
    render(
      <TransitionOptionsPanel
        locale="es"
        obligationId="11111111-1111-1111-1111-111111111111"
        expectedVersion={3}
        dictionary={es}
        transitionOptions={[
          {
            status: 'in_progress',
            enabled: true,
            reason: null,
          },
        ]}
      />,
    )

    const enabledButton = screen.getByRole('button', { name: `${es.detail.transitionTo} ${es.statuses.in_progress}` })
    expect(enabledButton).toBeEnabled()
    expect(enabledButton).toHaveAttribute('type', 'submit')
  })
})
