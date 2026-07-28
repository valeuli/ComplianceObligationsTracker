import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-compliance-primary text-white hover:bg-emerald-900',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode
    variant?: ButtonVariant
  }
>) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        props.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  variant = 'primary',
  ...props
}: Readonly<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string
    children: ReactNode
    variant?: ButtonVariant
  }
>) {
  return (
    <Link
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
        variantClasses[variant],
        props.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Link>
  )
}
