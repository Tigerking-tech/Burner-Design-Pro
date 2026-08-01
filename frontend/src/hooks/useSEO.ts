import { useEffect } from 'react'

interface OfferSchema {
  name?: string
  price: string
  priceCurrency: string
  description?: string
}

interface WebApplicationSchema {
  name: string
  url: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
  browserRequirements?: string
  offers?: OfferSchema | OfferSchema[]
  featureList?: string[]
}

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  canonicalPath?: string
  ogTitle?: string
  ogDescription?: string
  ogType?: string
  ogUrl?: string
  ogImage?: string
  jsonLd?: WebApplicationSchema | WebApplicationSchema[]
}

const SITE_ORIGIN = 'https://burnerdesignpro.com'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg`

const DEFAULT_TITLE = 'BurnerDesignPro — Free Thermal Engineering Calculator | ISO & EPA Compliant'
const DEFAULT_DESCRIPTION =
  'Free online engineering calculators for combustion, emissions, and flow. ISO 5167-1, EPA Method 19, ISO 6976 compliant. No signup required for basic tools.'
const DEFAULT_KEYWORDS =
  'burner design software, thermal engineering tool, combustion calculation, orifice plate ISO 5167, flame temperature calculator, emission analysis, industrial engineering software, thermal insulation calculator, ASTM C680, engineering calculator, SaaS software'

const JSONLD_SCRIPT_ID = 'page-json-ld'

function buildWebApplicationSchema(schema: WebApplicationSchema) {
  const offers = Array.isArray(schema.offers) ? schema.offers : schema.offers ? [schema.offers] : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: schema.name,
    url: schema.url,
    description: schema.description,
    applicationCategory: schema.applicationCategory || 'EngineeringApplication',
    operatingSystem: schema.operatingSystem || 'Web Browser',
    ...(schema.browserRequirements ? { browserRequirements: schema.browserRequirements } : {}),
    ...(offers
      ? {
          offers: offers.map((o) => ({
            '@type': 'Offer',
            ...(o.name ? { name: o.name } : {}),
            price: o.price,
            priceCurrency: o.priceCurrency,
            ...(o.description ? { description: o.description } : {}),
          })),
        }
      : {}),
    ...(schema.featureList ? { featureList: schema.featureList } : {}),
  }
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath,
  ogTitle,
  ogDescription,
  ogType = 'website',
  ogUrl,
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | BurnerDesignPro` : DEFAULT_TITLE
    const currentUrl = ogUrl || (canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : window.location.href)
    const canonicalUrl = canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : currentUrl

    document.title = fullTitle

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', description)
    setMeta('name', 'keywords', keywords)

    // Open Graph
    setMeta('property', 'og:title', ogTitle || fullTitle)
    setMeta('property', 'og:description', ogDescription || description)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:url', currentUrl)
    setMeta('property', 'og:site_name', 'BurnerDesignPro')
    setMeta('property', 'og:image', ogImage)

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', ogTitle || fullTitle)
    setMeta('name', 'twitter:description', ogDescription || description)
    setMeta('name', 'twitter:image', ogImage)

    // Canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonicalEl) {
      canonicalEl = document.createElement('link')
      canonicalEl.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalEl)
    }
    canonicalEl.setAttribute('href', canonicalUrl)

    // JSON-LD structured data
    const existing = document.getElementById(JSONLD_SCRIPT_ID)
    if (existing) {
      existing.remove()
    }
    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      const payload = schemas.length === 1 ? buildWebApplicationSchema(schemas[0]) : schemas.map(buildWebApplicationSchema)
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = JSONLD_SCRIPT_ID
      script.textContent = JSON.stringify(payload)
      document.head.appendChild(script)
    }

    return () => {
      // Clean up JSON-LD when leaving the page so the next page can install its own
      const node = document.getElementById(JSONLD_SCRIPT_ID)
      if (node) node.remove()
    }
  }, [title, description, keywords, canonicalPath, ogTitle, ogDescription, ogType, ogUrl, ogImage, jsonLd])
}
