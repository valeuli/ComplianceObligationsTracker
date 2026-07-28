import type { ReactNode } from 'react'

import { notFound } from 'next/navigation'

import { normalizeLocale } from '@/features/obligations/presentation'

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!normalizeLocale(locale)) {
    notFound()
  }

  return <>{children}</>
}