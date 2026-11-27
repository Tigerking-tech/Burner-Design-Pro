// Build-time prerender: writes a static HTML file per route with route-specific
// <title>, description, canonical, OG tags and an H1, so crawlers that do not
// execute JavaScript (Bing, most AI bots) see the right page instead of the
// homepage shell. The React SPA hydrates over it as usual.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const blogDir = join(root, 'src', 'content', 'blog')
const SITE = 'https://burnerdesignpro.com'
const BRAND_SUFFIX = ' | BurnerDesignPro'
const MAX_TITLE_LENGTH = 60

const ROUTES = [
  {
    path: '/flame-temperature',
    title: 'Adiabatic Flame Temperature Calculator',
    description:
      'Calculate adiabatic flame temperature and equilibrium combustion products with NASA Glenn thermochemical data. Free ISO-grade engineering tool.',
    h1: 'Adiabatic Flame Temperature Calculator',
    tagline: 'NASA Glenn thermochemical data, Gibbs equilibrium and excess-air effects.',
  },
  {
    path: '/insulation-calculator',
    title: 'Pipe Insulation Calculator | ISO 12241',
    description:
      'Calculate heat loss, surface temperature and optimal insulation thickness for pipes and flat surfaces per ISO 12241 and ASTM C680.',
    h1: 'Pipe & Flat Insulation Calculator',
    tagline: 'Heat loss, surface temperature and condensation control per ISO 12241 / ASTM C680.',
  },
  {
    path: '/orifice-calculator',
    title: 'Orifice Plate Calculator | ISO 5167',
    description:
      'Size orifice plates per ISO 5167 with Reader-Harris/Gallagher discharge coefficient, differential pressure and permanent pressure loss.',
    h1: 'Orifice Plate Calculator',
    tagline: 'ISO 5167 sizing, discharge coefficient and permanent pressure loss.',
  },
  {
    path: '/fuel-manager',
    title: 'Fuel Gas Properties | ISO 6976',
    description:
      'Wobbe index, calorific value, density and stoichiometric air requirement for natural gas, LPG, hydrogen and blends per ISO 6976.',
    h1: 'Fuel Gas Properties Calculator',
    tagline: 'Wobbe index, calorific value and density per ISO 6976.',
  },
  {
    path: '/emission',
    title: 'Emission Calculator | EPA Method 19',
    description:
      'NOx, CO, CO2 and SO2 emission rates with O2 correction per EPA Method 19, IPCC 2006 and EU IED.',
    h1: 'Emission Analysis Calculator',
    tagline: 'NOx, CO, CO2 and SO2 with O2 correction per EPA Method 19.',
  },
  {
    path: '/efficiency',
    title: 'Efficiency Calculator',
    description:
      'Combustion and thermal efficiency from flue gas O2/CO2 and stack temperature using the Siegert loss method.',
    h1: 'Combustion Efficiency Calculator',
    tagline: 'Stack loss and efficiency from flue gas O2/CO2 and temperature.',
  },
  {
    path: '/thermodynamic',
    title: 'Thermodynamic Properties',
    description:
      'Thermodynamic property data for combustion gases and fuels: specific heat, density, viscosity and thermal conductivity.',
    h1: 'Thermodynamic Properties',
    tagline: 'Specific heat, density, viscosity and thermal conductivity of combustion gases.',
  },
  {
    path: '/unit-converter',
    title: 'Engineering Unit Converter | ISO 80000',
    description:
      'Convert flow, pressure, temperature, viscosity and energy units per ISO 80000, ASTM D2161 and ISO 13443.',
    h1: 'Engineering Unit Converter',
    tagline: 'Flow, pressure, temperature and viscosity units per ISO 80000.',
  },
  {
    path: '/database',
    title: 'Fuel & Gas Database',
    description:
      'Fuel property and gas composition database for burner design: natural gas, fuel oil, LPG and biogas data.',
    h1: 'Fuel & Gas Database',
    tagline: 'Natural gas, fuel oil, LPG and biogas property data.',
  },
  {
    path: '/blog',
    title: 'Combustion & Emissions Engineering Blog',
    description:
      'Practical guides on excess air, flame temperature, insulation, orifice metering and emissions for thermal engineers.',
    h1: 'Combustion & Emissions Engineering Blog',
    tagline: 'Practical engineering guides on combustion, insulation, metering and emissions.',
  },
  {
    path: '/subscription',
    title: 'Pricing — Free & Pro Plans',
    description:
      'Free engineering calculators with 20 calculations per month, or Pro with unlimited access and PDF report export.',
    h1: 'Pricing — Free & Pro Plans',
    tagline: 'Start free, upgrade to Pro for unlimited calculations and PDF reports.',
  },
  {
    path: '/faq',
    title: 'FAQ & Help',
    description:
      'Answers to common questions about BurnerDesignPro calculators, engineering standards, accuracy and billing.',
    h1: 'FAQ & Help',
    tagline: 'Answers about our calculators, standards, accuracy and billing.',
  },
  {
    path: '/about',
    title: 'About Us',
    description:
      'BurnerDesignPro builds free, standards-compliant thermal engineering calculators for combustion, emissions and insulation.',
    h1: 'About BurnerDesignPro',
    tagline: 'Free, standards-compliant thermal engineering calculators.',
  },
  {
    path: '/contact',
    title: 'Contact Us',
    description:
      'Contact the BurnerDesignPro team for support, feedback or enterprise licensing.',
    h1: 'Contact Us',
    tagline: 'Support, feedback and enterprise licensing.',
  },
  {
    path: '/changelog',
    title: 'Changelog',
    description: 'New calculators, features and fixes in BurnerDesignPro.',
    h1: 'Changelog',
    tagline: 'New calculators, features and fixes.',
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service',
    description: 'Terms of service for using BurnerDesignPro engineering calculators.',
    h1: 'Terms of Service',
    tagline: 'Terms governing use of BurnerDesignPro.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How BurnerDesignPro collects, uses and protects your data.',
    h1: 'Privacy Policy',
    tagline: 'How we collect, use and protect your data.',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy',
    description: 'Refund and cancellation policy for BurnerDesignPro Pro subscriptions.',
    h1: 'Refund Policy',
    tagline: 'Refund and cancellation policy for Pro subscriptions.',
  },
]

function parseFrontmatter(raw) {
  const fm = {}
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!m) return fm
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    let value = line.slice(i + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    fm[key] = value
  }
  return fm
}

// Add blog posts as routes
for (const file of readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
  const fm = parseFrontmatter(readFileSync(join(blogDir, file), 'utf8'))
  if (!fm.title) continue
  ROUTES.push({
    path: `/blog/${file.replace(/\.md$/, '')}`,
    title: fm.title,
    description: fm.description || '',
    h1: fm.title,
    tagline: fm.description || '',
  })
}

function fullTitle(title) {
  return title.length + BRAND_SUFFIX.length <= MAX_TITLE_LENGTH ? `${title}${BRAND_SUFFIX}` : title
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')

function render(route) {
  const url = `${SITE}${route.path}`
  const title = fullTitle(route.title)
  let out = template
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
  out = out.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(route.description)}" />`)
  out = out.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(title)}" />`)
  out = out.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(route.description)}" />`)
  out = out.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`)
  out = out.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(title)}" />`)
  out = out.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(route.description)}" />`)
  out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`)
  out = out.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/, `$1\n            ${esc(route.h1)}\n          $2`)
  out = out.replace(/(<p style="font-size:12\.5px;[^>]*>)[\s\S]*?(<\/p>)/, `$1\n            ${esc(route.tagline)}\n          $2`)
  return out
}

let count = 0
for (const route of ROUTES) {
  if (route.path === '/') continue
  const dir = join(dist, route.path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), render(route))
  count++
}

console.log(`[prerender] wrote ${count} static route pages + dist/index.html`)
