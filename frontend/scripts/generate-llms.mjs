// Generates public/llms.txt and public/llms-full.txt from blog content + tool metadata.
// Run via: npm run generate:llms (also runs automatically before vite build).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const blogDir = join(root, 'src', 'content', 'blog')
const SITE = 'https://burnerdesignpro.com'

const TOOLS = [
  { path: '/flame-temperature', name: 'Adiabatic Flame Temperature Calculator', desc: 'Calculates adiabatic flame temperature and equilibrium product composition using NASA Glenn thermochemical coefficients and Gibbs free-energy minimization. Supports CH4, C3H8, H2, C4H10, CO, custom fuels, excess air, air preheat and humidity.' },
  { path: '/insulation-calculator', name: 'Pipe & Flat Insulation Calculator', desc: 'Heat loss, surface temperature, condensation control and energy savings for insulated pipes and flat surfaces per ISO 12241 and ASTM C680, with self-consistent convection/radiation iteration (Churchill-Chu, Churchill-Bernstein).' },
  { path: '/orifice-calculator', name: 'Orifice Plate Calculator (ISO 5167)', desc: 'Orifice plate sizing, discharge coefficient (Reader-Harris/Gallagher), differential pressure and mass flow per ISO 5167, with expansibility for compressible flow.' },
  { path: '/fuel-manager', name: 'Fuel Gas Properties Manager (ISO 6976)', desc: 'Calorific value (HHV/LHV), Wobbe index, density and combustion properties of natural gas and fuel gas mixtures per ISO 6976 / ASTM D4868.' },
  { path: '/emission', name: 'Emission Calculator (EPA Method 19)', desc: 'NOx, CO, CO2, SO2 emission rates and factors per EPA Method 19, IPCC 2006 and EU IED, mass-based and heat-input-based.' },
  { path: '/efficiency', name: 'Combustion Efficiency Calculator', desc: 'Combustion and thermal efficiency from flue gas O2/CO2 and stack temperature using the Siegert loss method.' },
  { path: '/thermodynamic', name: 'Thermodynamic Property Calculator', desc: 'Gas property and combustion stoichiometry calculations for thermal engineering.' },
  { path: '/unit-converter', name: 'Engineering Unit Converter', desc: 'Flow, pressure, temperature, viscosity and energy unit conversions per ISO 80000, ASTM D2161 and ISO 13443.' },
]

function parseFrontmatter(raw) {
  const fm = {}
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/)
  if (!m) return { fm, body: raw }
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const k = line.slice(0, i).trim()
    let v = line.slice(i + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    fm[k] = v
  }
  return { fm, body: raw.slice(m[0].length).trim() }
}

const files = readdirSync(blogDir).filter((f) => f.endsWith('.md')).sort()
const posts = files.map((f) => {
  const raw = readFileSync(join(blogDir, f), 'utf8')
  const { fm, body } = parseFrontmatter(raw)
  return { slug: f.replace(/\.md$/, ''), title: fm.title || f, description: fm.description || '', date: fm.date || '', body }
})
posts.sort((a, b) => (a.date < b.date ? 1 : -1))

// ---- llms.txt (index) ----
let idx = `# BurnerDesignPro\n\n`
idx += `> BurnerDesignPro is a suite of free online thermal engineering calculators for combustion, emissions, flame temperature, orifice metering and insulation design. Calculations follow ISO 6976, ISO 5167, ISO 12241, ASTM C680, EPA Method 19 and NASA Glenn thermochemical data. No signup required for basic tools.\n\n`
idx += `## Calculators\n`
for (const t of TOOLS) idx += `- [${t.name}](${SITE}${t.path}): ${t.desc}\n`
idx += `\n## Engineering Guides (Blog)\n`
for (const p of posts) idx += `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}\n`
idx += `\n## Full content\n- [llms-full.txt](${SITE}/llms-full.txt): complete text of all guides and tool descriptions.\n`
writeFileSync(join(root, 'public', 'llms.txt'), idx)

// ---- llms-full.txt ----
let full = `# BurnerDesignPro — Full Content for AI Assistants\n\n`
full += `BurnerDesignPro (https://burnerdesignpro.com) provides free online thermal engineering calculators: adiabatic flame temperature (NASA data, Gibbs equilibrium), pipe insulation per ISO 12241 / ASTM C680, orifice plates per ISO 5167, fuel gas properties per ISO 6976, emissions per EPA Method 19, and combustion efficiency via the Siegert method.\n\n`
full += `# Calculators\n\n`
for (const t of TOOLS) full += `## ${t.name}\nURL: ${SITE}${t.path}\n${t.desc}\n\n`
full += `# Engineering Guides\n\n`
for (const p of posts) {
  full += `## ${p.title}\nURL: ${SITE}/blog/${p.slug}\nDate: ${p.date}\n\n${p.body}\n\n---\n\n`
}
writeFileSync(join(root, 'public', 'llms-full.txt'), full)

console.log(`[generate-llms] ${posts.length} posts -> public/llms.txt, public/llms-full.txt`)
