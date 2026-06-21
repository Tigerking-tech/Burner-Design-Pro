import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  ogUrl?: string
}

const DEFAULT_TITLE = 'Burner Design Pro - Thermal Design and Engineering Calculation Software'
const DEFAULT_DESCRIPTION = 'Professional thermal design and engineering calculation software for burner engineers. Deterministic calculators for combustion analysis, orifice plate sizing (ISO 5167), flame temperature calculation, emission evaluation (EPA/EU IED), engineering unit conversion, and thermal insulation thickness (ASTM C680). Formula-based — not AI.'
const DEFAULT_KEYWORDS = 'burner design software, thermal engineering tool, combustion calculation, orifice plate ISO 5167, flame temperature calculator, emission analysis, industrial engineering software, thermal insulation calculator, ASTM C680, engineering calculator, SaaS software'

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogTitle,
  ogDescription,
  ogType = 'website',
  ogUrl,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Burner Design Pro` : DEFAULT_TITLE

    // Set title
    document.title = fullTitle

    // Helper to set or create meta tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // Basic meta
    setMeta('name', 'description', description)
    setMeta('name', 'keywords', keywords)

    // Open Graph
    setMeta('property', 'og:title', ogTitle || fullTitle)
    setMeta('property', 'og:description', ogDescription || description)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:url', ogUrl || window.location.href)
    setMeta('property', 'og:site_name', 'Burner Design Pro')

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', ogTitle || fullTitle)
    setMeta('name', 'twitter:description', ogDescription || description)
  }, [title, description, keywords, ogTitle, ogDescription, ogType, ogUrl])
}
