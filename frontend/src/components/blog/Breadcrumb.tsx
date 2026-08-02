import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className}`}>
      <ol className="flex items-center text-sm gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={index}>
              <li className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[200px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? 'text-slate-900 dark:text-white font-medium truncate max-w-[240px]'
                        : 'text-slate-500 dark:text-slate-400 truncate max-w-[200px]'
                    }
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <ChevronRight
                  size={14}
                  className="text-slate-300 dark:text-slate-600 flex-shrink-0"
                />
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
