import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const navigate = useNavigate()
  const parentHref = items.length >= 2 ? items[items.length - 2].href : undefined

  return (
    <div className="flex items-center gap-2 mb-5">
      {parentHref && (
        <button
          onClick={() => navigate(parentHref)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors shrink-0"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <nav className="flex items-center gap-1 text-lg text-gray-500 min-w-0" aria-label="Breadcrumb">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-300 shrink-0" aria-hidden="true">/</span>}
            {item.href ? (
              <Link to={item.href} className="hover:text-emerald-600 transition-colors truncate">{item.label}</Link>
            ) : (
              <span className="text-gray-800 font-medium truncate" aria-current="page">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  )
}
