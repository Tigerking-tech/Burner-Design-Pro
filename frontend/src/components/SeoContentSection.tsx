import { useEffect } from 'react'

interface SeoParagraphBlock {
  type: 'paragraph'
  heading: string
  text: string
}

interface SeoListBlock {
  type: 'list'
  heading: string
  items: string[]
}

export type SeoBlock = SeoParagraphBlock | SeoListBlock

export interface SeoFaqItem {
  question: string
  answer: string
}

interface SeoContentSectionProps {
  ariaLabel: string
  title: string
  intro: string
  blocks: SeoBlock[]
  /** Optional FAQ rendered visibly + injected as FAQPage JSON-LD (GEO / long-tail). */
  faqs?: SeoFaqItem[]
  /** Canonical path of the page, used for the FAQ JSON-LD mainEntityOfPage. */
  pagePath?: string
}

const FAQ_JSONLD_ID = 'faq-json-ld'
const SITE_ORIGIN = 'https://burnerdesignpro.com'

/**
 * Renders an SEO-friendly content section explaining the tool's purpose,
 * the engineering standards it follows, and what users can calculate.
 * Optionally renders a FAQ block and injects FAQPage structured data so
 * search engines and AI assistants can surface the answers directly.
 */
export default function SeoContentSection({ ariaLabel, title, intro, blocks, faqs, pagePath }: SeoContentSectionProps) {
  useEffect(() => {
    if (!faqs || faqs.length === 0) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = FAQ_JSONLD_ID
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      ...(pagePath ? { url: `${SITE_ORIGIN}${pagePath}` } : {}),
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
    document.head.appendChild(script)
    return () => {
      const node = document.getElementById(FAQ_JSONLD_ID)
      if (node) node.remove()
    }
  }, [faqs, pagePath])

  return (
    <section
      aria-label={ariaLabel}
      className="mx-auto mt-16 mb-4 max-w-3xl px-4 sm:px-6 text-slate-700 dark:text-slate-300"
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
        {title}
      </h2>
      <p className="leading-relaxed mb-6">{intro}</p>

      {blocks.map((block) => (
        <div key={block.heading} className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            {block.heading}
          </h3>
          {block.type === 'paragraph' && <p className="leading-relaxed">{block.text}</p>}
          {block.type === 'list' && (
            <ul className="list-disc pl-6 space-y-1.5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {faqs && faqs.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-medium text-slate-900 dark:text-white list-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="text-slate-400 transition-transform group-open:rotate-45 shrink-0" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
