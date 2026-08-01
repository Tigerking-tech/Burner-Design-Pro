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

interface SeoContentSectionProps {
  ariaLabel: string
  title: string
  intro: string
  blocks: SeoBlock[]
}

/**
 * Renders an SEO-friendly content section explaining the tool's purpose,
 * the engineering standards it follows, and what users can calculate.
 *
 * The section is rendered server-side as plain HTML so search engines can
 * read it without executing JavaScript.
 */
export default function SeoContentSection({ ariaLabel, title, intro, blocks }: SeoContentSectionProps) {
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
    </section>
  )
}
