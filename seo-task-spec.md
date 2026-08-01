# BurnerDesignPro SEO 基础优化任务书

> **文档用途**：交给 Trae Code（AI 编码助手）执行的技术任务清单
> **项目**：burnerdesignpro.com
> **阶段**：推广计划第一步 — 技术 SEO 基础设施搭建
> **日期**：2026-08-01

---

## 任务概览

| 类别 | 任务数 | 执行方 |
|------|--------|--------|
| 🔧 代码可自动完成 | 6 项 | Trae Code |
| 👤 需人工操作 | 3 项 | 网站管理员 |

---

## Part A：Trae Code 可自动完成的任务

### 任务 1：优化所有页面的 Title 和 Meta Description

**目标**：为网站每个页面设置独特且包含目标关键词的 `<title>` 和 `<meta name="description">`。

**操作要求**：

检查并修改以下所有页面的 `<head>` 区域。如果页面已有 title/description，替换为下方推荐内容；如果没有，则新增。

#### 页面 1：首页 `/`

```html
<title>BurnerDesignPro — Free Thermal Engineering Calculator | ISO & EPA Compliant</title>
<meta name="description" content="Free online engineering calculators for combustion, emissions, and flow. ISO 5167-1, EPA Method 19, ISO 6976 compliant. No signup required for basic tools.">
```

#### 页面 2：Fuel Manager `/fuel-manager`

```html
<title>Fuel Gas Properties Calculator | ISO 6976 & ASTM D4868 | BurnerDesignPro</title>
<meta name="description" content="Calculate gas calorific value, Wobbe index, and fuel mixtures per ISO 6976 & ASTM D4868. Free online tool for engineers.">
```

#### 页面 3：Emission Analysis `/emission`

```html
<title>Emission Calculator — NOx, CO, CO₂, SO₂ | EPA Method 19 | BurnerDesignPro</title>
<meta name="description" content="Calculate combustion emissions per EPA Method 19, IPCC 2006 & EU IED. Free online emission analysis tool for compliance reporting.">
```

#### 页面 4：Unit Converter `/unit-converter`

```html
<title>Engineering Unit Converter | Flow, Pressure, Temperature | BurnerDesignPro</title>
<meta name="description" content="Convert flow, pressure, temperature & viscosity units per ISO 80000, ASTM D2161 & ISO 13443. Free, instant, browser-based.">
```

#### 页面 5：Orifice Calculator `/orifice-calculator`

```html
<title>Orifice Plate Calculator | ISO 5167-1:2003 | BurnerDesignPro</title>
<meta name="description" content="Design orifice plates per ISO 5167-1:2003 with discharge coefficients. Professional online calculator with PDF report export.">
```

#### 页面 6：Flame Temperature `/flame-temperature`

```html
<title>Flame Temperature Calculator | NASA GRC Data | BurnerDesignPro</title>
<meta name="description" content="Calculate adiabatic flame temperature per NASA GRC thermochemical data & Gibbs equilibrium minimization. Professional engineering tool.">
```

#### 页面 7：Insulation Calculator `/insulation-calculator`

```html
<title>Pipe Insulation Thickness Calculator | ISO 12241 & ASTM C680 | BurnerDesignPro</title>
<meta name="description" content="Calculate optimal insulation thickness for pipes and flat surfaces per ISO 12241 & ASTM C680. Free online tool.">
```

#### 页面 8：定价页 `/pricing`（如存在）

```html
<title>Pricing | Free & Pro Plans | BurnerDesignPro Engineering Calculator</title>
<meta name="description" content="Start free with 20 calculations per month. Pro plan at $19/mo for unlimited calculations, PDF reports, and compliance exports.">
```

#### 页面 9：注册页 `/signup`（如存在）

```html
<title>Sign Up Free | BurnerDesignPro Engineering Calculator</title>
<meta name="description" content="Create your free BurnerDesignPro account. 20 calculations per month at no cost. No credit card required.">
```

**注意事项**：
- 如果使用框架（Next.js/React/Vue），请在对应的页面组件或路由配置中设置（如 Next.js 的 `metadata` 导出或 `<Head>` 组件）
- Title 长度控制在 50-60 字符以内
- Description 长度控制在 150-160 字符以内
- 确保每个页面的 title 和 description 唯一，不要重复

---

### 任务 2：添加结构化数据（Schema.org JSON-LD）

**目标**：在首页和每个工具页添加 `WebApplication` Schema，帮助搜索引擎理解产品信息。

#### 2.1 首页 Schema

在首页 `<head>` 中添加：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BurnerDesignPro",
  "url": "https://burnerdesignpro.com",
  "description": "Free online thermal engineering calculator with ISO, EPA and ASTM compliant combustion, emission, and flow calculations.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "browserRequirements": "Requires JavaScript",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "USD",
      "description": "20 calculations per month with basic tools"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan",
      "price": "19",
      "priceCurrency": "USD",
      "description": "Unlimited calculations, all tools, PDF report export"
    }
  ],
  "featureList": [
    "Fuel Manager (ISO 6976, ASTM D4868)",
    "Emission Analysis (EPA Method 19, IPCC 2006, EU IED)",
    "Unit Converter (ISO 80000)",
    "Orifice Calculator (ISO 5167-1)",
    "Flame Temperature Calculator (NASA GRC)",
    "Insulation Calculator (ISO 12241, ASTM C680)"
  ]
}
</script>
```

#### 2.2 各工具页 Schema

为每个工具页添加对应的 Schema。以下是每个工具页的 JSON-LD：

**Fuel Manager 页 `/fuel-manager`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Fuel Manager — Gas & Oil Properties Calculator",
  "url": "https://burnerdesignpro.com/fuel-manager",
  "description": "Calculate gas calorific value, Wobbe index, density, and fuel mixtures per ISO 6976 & ASTM D4868.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**Emission Analysis 页 `/emission`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Emission Analysis — NOx, CO, CO₂, SO₂ Calculator",
  "url": "https://burnerdesignpro.com/emission",
  "description": "Calculate combustion emissions per EPA Method 19, IPCC 2006 & EU IED for compliance reporting.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**Unit Converter 页 `/unit-converter`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Engineering Unit Converter",
  "url": "https://burnerdesignpro.com/unit-converter",
  "description": "Convert flow, pressure, temperature & viscosity units per ISO 80000, ASTM D2161 & ISO 13443.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**Orifice Calculator 页 `/orifice-calculator`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Orifice Plate Calculator — ISO 5167-1",
  "url": "https://burnerdesignpro.com/orifice-calculator",
  "description": "Design orifice plates per ISO 5167-1:2003 with discharge coefficients.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "19",
    "priceCurrency": "USD"
  }
}
</script>
```

**Flame Temperature 页 `/flame-temperature`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Flame Temperature Calculator — NASA GRC",
  "url": "https://burnerdesignpro.com/flame-temperature",
  "description": "Calculate flame temperature per NASA GRC thermochemical data & Gibbs equilibrium minimization.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "19",
    "priceCurrency": "USD"
  }
}
</script>
```

**Insulation Calculator 页 `/insulation-calculator`：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Insulation Thickness Calculator — ISO 12241 & ASTM C680",
  "url": "https://burnerdesignpro.com/insulation-calculator",
  "description": "Calculate optimal insulation thickness for pipes and flat surfaces per ISO 12241 & ASTM C680.",
  "applicationCategory": "EngineeringApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "19",
    "priceCurrency": "USD"
  }
}
</script>
```

---

### 任务 3：生成 XML Sitemap

**目标**：在网站根目录创建 `sitemap.xml` 文件。

**操作要求**：

在项目 public 目录或静态文件根目录创建 `sitemap.xml`，内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://burnerdesignpro.com/</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/fuel-manager</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/emission</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/unit-converter</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/orifice-calculator</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/flame-temperature</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/insulation-calculator</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/pricing</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://burnerdesignpro.com/signup</loc>
    <lastmod>2026-08-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

**注意**：
- 如果使用 Next.js，可改用 `next-sitemap` 包自动生成
- 如果有博客页面，后续将博客文章 URL 也加入 sitemap
- `lastmod` 日期在每次内容更新后应同步修改

---

### 任务 4：配置 robots.txt

**目标**：在网站根目录创建或更新 `robots.txt`。

**操作要求**：

在项目 public 目录或静态文件根目录创建 `robots.txt`，内容如下：

```
User-agent: *
Allow: /

# Disallow private/user pages
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

# Sitemap
Sitemap: https://burnerdesignpro.com/sitemap.xml
```

**注意**：根据实际项目结构调整 Disallow 路径。如果网站没有 `/api/`、`/admin/`、`/dashboard/` 等路径，删除对应行。

---

### 任务 5：添加 Open Graph 和 Twitter Card 标签

**目标**：为首页和工具页添加社交媒体分享标签，确保在 LinkedIn、Twitter、Reddit 等平台分享时有良好的预览效果。

**在首页 `<head>` 中添加（所有工具页也需添加，替换对应 URL/标题/描述）：**

```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://burnerdesignpro.com/">
<meta property="og:title" content="BurnerDesignPro — Free Thermal Engineering Calculator">
<meta property="og:description" content="Free online engineering calculators for combustion, emissions, and flow. ISO, EPA & ASTM compliant.">
<meta property="og:image" content="https://burnerdesignpro.com/og-image.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BurnerDesignPro — Free Thermal Engineering Calculator">
<meta name="twitter:description" content="Free online engineering calculators for combustion, emissions, and flow. ISO, EPA & ASTM compliant.">
<meta name="twitter:image" content="https://burnerdesignpro.com/og-image.png">
```

**各工具页 Open Graph 标签替换对照：**

| 页面 | og:url | og:title | og:description |
|------|--------|----------|----------------|
| /fuel-manager | .../fuel-manager | Fuel Gas Properties Calculator \| ISO 6976 | Calculate gas calorific value, Wobbe index per ISO 6976 & ASTM D4868. |
| /emission | .../emission | Emission Calculator \| EPA Method 19 | Calculate NOx, CO, CO₂, SO₂ emissions per EPA Method 19 & EU IED. |
| /unit-converter | .../unit-converter | Engineering Unit Converter | Convert flow, pressure, temperature units per ISO 80000. |
| /orifice-calculator | .../orifice-calculator | Orifice Plate Calculator \| ISO 5167-1 | Design orifice plates per ISO 5167-1:2003. |
| /flame-temperature | .../flame-temperature | Flame Temperature Calculator | Calculate flame temperature per NASA GRC data. |
| /insulation-calculator | .../insulation-calculator | Insulation Thickness Calculator | Calculate insulation per ISO 12241 & ASTM C680. |

**注意**：`og-image.png` 需要制作一张 1200x630 像素的社交分享图（见 Part B 人工任务）。在图片制作完成前，可先引用一个占位图或移除 `og:image` 行。

---

### 任务 6：添加工具页 SEO 文本内容区

**目标**：在每个工具页面的工具界面上方或下方，添加一段 300-500 字的 SEO 优化文本，解释计算原理、适用标准和使用方法。这段文本既帮助搜索引擎理解页面内容，也帮助用户了解工具背景。

**操作要求**：

在每个工具页的合适位置（建议在工具计算区域下方），添加一个 `<section>` 区块。以下是每个工具页的 SEO 文本内容：

#### Fuel Manager 页

```html
<section class="tool-seo-content" aria-label="About Fuel Manager">
  <h2>Fuel Gas Properties Calculator</h2>
  <p>
    The Fuel Manager tool calculates thermodynamic properties of fuel gases and oils
    according to <strong>ISO 6976</strong> (natural gas — calculation of calorific values,
    density, relative density and Wobbe index) and <strong>ASTM D4868</strong>
    (standard test method for estimation of net and gross heat of combustion of
    burner and diesel fuels). This free online calculator is designed for combustion
    engineers, process engineers, and energy analysts who need accurate fuel property
    data for burner design and emission calculations.
  </p>
  <h3>What You Can Calculate</h3>
  <ul>
    <li>Gross and net calorific value (heating value) of natural gas mixtures</li>
    <li>Wobbe index — critical for fuel interchangeability assessment</li>
    <li>Gas density and relative density per ISO 6976</li>
    <li>Gas compressibility factor at reference conditions</li>
    <li>Fuel mixture properties for blended gases</li>
    <li>Oil heating value per ASTM D4868</li>
  </ul>
  <h3>Standards & Compliance</h3>
  <p>
    All calculations follow the formulas and methods specified in ISO 6976:2016 and
    ASTM D4868-17. Results are deterministic and traceable to the standard's equations,
    making them suitable for engineering documentation and compliance reporting.
  </p>
</section>
```

#### Emission Analysis 页

```html
<section class="tool-seo-content" aria-label="About Emission Analysis">
  <h2>Combustion Emission Calculator</h2>
  <p>
    The Emission Analysis tool calculates combustion emissions including NOx, CO, CO₂,
    and SO₂ based on <strong>EPA Method 19</strong> (determination of sulfur dioxide
    removal efficiency and particulate matter emission rate), <strong>IPCC 2006
    Guidelines</strong> for national greenhouse gas inventories, and <strong>EU IED
    2010/75/EU</strong> (Industrial Emissions Directive). This tool is built for
    environmental engineers and plant operators who need compliant emission rate
    calculations for regulatory reporting.
  </p>
  <h3>What You Can Calculate</h3>
  <ul>
    <li>NOx emission rates (as NO₂) per EPA Method 19</li>
    <li>CO and CO₂ emission rates from fuel combustion</li>
    <li>SO₂ emissions based on fuel sulfur content</li>
    <li>Greenhouse gas inventory data per IPCC 2006</li>
    <li>Emission factors for compliance with EU IED</li>
    <li>Mass-based and heat-input-based emission rates</li>
  </ul>
  <h3>Standards & Compliance</h3>
  <p>
    Calculations follow 40 CFR Part 60 (EPA Method 19), IPCC 2006 Vol. 2 Energy, and
    EU Directive 2010/75/EU. Results can be exported as PDF compliance reports with
    Pro plan.
  </p>
</section>
```

#### Unit Converter 页

```html
<section class="tool-seo-content" aria-label="About Unit Converter">
  <h2>Engineering Unit Converter</h2>
  <p>
    The Unit Converter tool provides instant conversion of engineering units for flow,
    pressure, temperature, and viscosity according to <strong>ISO 80000</strong>
    (Quantities and units), <strong>ASTM D2161</strong> (conversion of kinematic
    viscosity), and <strong>ISO 13443</strong> (natural gas — reference conditions).
    All conversions run locally in your browser with no server round-trips.
  </p>
  <h3>Supported Unit Categories</h3>
  <ul>
    <li>Flow rate: m³/h, m³/s, L/min, SCFM, GPM, and more</li>
    <li>Pressure: bar, Pa, kPa, MPa, psi, atm, mmHg</li>
    <li>Temperature: °C, °F, K, °R</li>
    <li>Viscosity: cSt, mm²/s, Saybolt Universal (per ASTM D2161)</li>
    <li>Energy & power: J, kJ, MJ, kWh, BTU, hp</li>
  </ul>
</section>
```

#### Orifice Calculator 页

```html
<section class="tool-seo-content" aria-label="About Orifice Calculator">
  <h2>Orifice Plate Flow Calculator — ISO 5167-1</h2>
  <p>
    The Orifice Calculator designs and analyzes orifice plates for flow measurement
    according to <strong>ISO 5167-1:2003</strong> (Measurement of fluid flow by means
    of pressure differential devices — Part 1: Orifice plates, nozzles and Venturi
    tubes inserted in circular cross-section conduits). This tool calculates discharge
    coefficients, flow rates, and pressure differentials for accurate flow measurement
    in piping systems.
  </p>
  <h3>What You Can Calculate</h3>
  <ul>
    <li>Orifice plate diameter and beta ratio (d/D)</li>
    <li>Discharge coefficient per ISO 5167-1 (Reader-Harris/Gallagher equation)</li>
    <li>Volumetric and mass flow rate from measured differential pressure</li>
    <li>Pressure differential for a given flow rate</li>
    <li>Expansibility factor for compressible fluids</li>
    <li>Uncertainty analysis per ISO 5167-1 Annex</li>
  </ul>
  <h3>Pro Feature</h3>
  <p>
    This is a Pro tool. Export calculation results as a professional PDF report with
    all input parameters, formulas, and results for engineering documentation.
  </p>
</section>
```

#### Flame Temperature 页

```html
<section class="tool-seo-content" aria-label="About Flame Temperature Calculator">
  <h2>Adiabatic Flame Temperature Calculator</h2>
  <p>
    The Flame Temperature tool calculates adiabatic flame temperature using
    <strong>NASA GRC thermochemical data</strong> and <strong>Gibbs free energy
    minimization</strong> for equilibrium composition. This Pro tool is essential for
    combustion engineers designing burners, furnaces, and gas turbines who need to
    predict peak flame temperatures for material selection and NOx formation analysis.
  </p>
  <h3>What You Can Calculate</h3>
  <ul>
    <li>Adiabatic flame temperature for various fuels (natural gas, oil, hydrogen, etc.)</li>
    <li>Equilibrium combustion product composition</li>
    <li>Effect of excess air / equivalence ratio on flame temperature</li>
    <li>Dissociation effects at high temperatures</li>
  </ul>
  <h3>Data Source</h3>
  <p>
    Thermodynamic properties are based on NASA Glenn Research Center polynomial
    coefficients, the same data used by NASA CEA (Chemical Equilibrium with Applications).
  </p>
</section>
```

#### Insulation Calculator 页

```html
<section class="tool-seo-content" aria-label="About Insulation Calculator">
  <h2>Pipe Insulation Thickness Calculator</h2>
  <p>
    The Insulation Calculator determines optimal insulation thickness for pipes and flat
    surfaces according to <strong>ISO 12241</strong> (Thermal insulation for building
    and industrial installations) and <strong>ASTM C680</strong> (standard practice for
    estimate of the heat gain or loss and the surface temperatures of insulated flat
    and cylindrical systems). This Pro tool helps engineers optimize thermal insulation
    for energy efficiency, personnel protection, and process temperature control.
  </p>
  <h3>What You Can Calculate</h3>
  <ul>
    <li>Optimal insulation thickness for pipes (cylindrical geometry)</li>
    <li>Insulation thickness for flat surfaces (planar geometry)</li>
    <li>Heat loss/gain per unit length or area</li>
    <li>Surface temperature for personnel safety assessment</li>
    <li>Multi-layer insulation system analysis</li>
  </ul>
</section>
```

**样式建议**（添加到全局 CSS 中）：

```css
.tool-seo-content {
  max-width: 720px;
  margin: 48px auto;
  padding: 0 16px;
  line-height: 1.7;
  color: #1a2332;
}
.tool-seo-content h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 16px;
}
.tool-seo-content h3 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 24px;
  margin-bottom: 8px;
}
.tool-seo-content p {
  margin-bottom: 14px;
}
.tool-seo-content ul {
  padding-left: 20px;
  margin-bottom: 14px;
}
.tool-seo-content li {
  margin-bottom: 6px;
}
```

---

## Part B：需人工操作的任务

> 以下任务需要在网站代码之外操作，Trae Code 无法自动完成。

### 人工任务 1：注册 Google Search Console

1. 访问 https://search.google.com/search-console
2. 用 Google 账号登录
3. 点击"添加属性" → 选择"网址前缀" → 输入 `https://burnerdesignpro.com`
4. 验证域名所有权（推荐方式）：
   - **DNS TXT 记录验证**：在域名注册商的 DNS 设置中添加 Google 提供的 TXT 记录
   - **HTML 文件验证**：下载 Google 提供的 HTML 验证文件，上传到网站根目录（可让 Trae Code 协助放置）
5. 验证成功后，在左侧菜单 → "Sitemaps" → 输入 `sitemap.xml` → 点击提交
6. 等待 1-3 天后查看 "Performance" 报告

### 人工任务 2：注册 Google Analytics 4

1. 访问 https://analytics.google.com
2. 创建账号 → 创建媒体资源 → 输入网站名称和 URL
3. 获取 Measurement ID（格式：`G-XXXXXXXXXX`）
4. **将此 ID 告诉 Trae Code**，让其将 GA4 追踪代码添加到所有页面
5. GA4 追踪代码模板（Trae Code 需替换 ID）：

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

6. 24 小时后确认 Analytics 面板有数据

### 人工任务 3：制作社交分享图 og-image.png

1. 使用设计工具（Canva / Figma / Photopea）制作一张 **1200x630 像素** 的图片
2. 内容建议：
   - 背景：品牌色（深青色/teal 系）
   - 标题文字："BurnerDesignPro"
   - 副标题："Free Thermal Engineering Calculator"
   - 底部小字："ISO · EPA · ASTM Compliant"
   - 可加 6 个工具图标或标准 logo
3. 导出为 PNG，命名为 `og-image.png`
4. 放置在网站根目录或 public 目录（让 Trae Code 协助放置到正确路径）
5. 确保 `https://burnerdesignpro.com/og-image.png` 可访问

---

## 执行优先级

按以下顺序执行：

1. **任务 1**（Title/Meta）— 最高优先，立即执行
2. **任务 2**（Schema.org）— 高优先
3. **任务 3**（sitemap.xml）— 高优先
4. **任务 4**（robots.txt）— 高优先
5. **任务 5**（Open Graph）— 中优先（社交分享图待人工制作）
6. **任务 6**（工具页 SEO 文本）— 中优先，但 SEO 价值高
7. **人工任务 1-3** — 管理员同步进行

---

## 完成验证清单

Trae Code 完成所有代码任务后，请逐项确认：

- [ ] 每个页面 `<title>` 标签唯一且含目标关键词
- [ ] 每个页面 `<meta name="description">` 唯一且含目标关键词
- [ ] 首页和所有工具页包含 `WebApplication` JSON-LD Schema
- [ ] `sitemap.xml` 已生成且可通过 `/sitemap.xml` 访问
- [ ] `robots.txt` 已配置且可通过 `/robots.txt` 访问
- [ ] 首页和工具页包含 Open Graph 和 Twitter Card 标签
- [ ] 每个工具页添加了 300-500 字 SEO 文本内容区
- [ ] Google Search Console 已验证并提交 sitemap（人工）
- [ ] GA4 追踪代码已安装并开始收集数据（人工 + 代码）
- [ ] og-image.png 已制作并上传（人工）

---

## 附注

- 如果网站使用 Next.js，Title/Meta/Schema 可通过 `app/metadata.ts` 或 `page.tsx` 中的 `metadata` 导出设置
- 如果网站使用 React SPA，确保使用 `react-helmet-async` 或类似库动态设置 title/meta
- 如果网站是纯静态 HTML，直接修改每个 HTML 文件的 `<head>`
- 所有修改完成后，建议在 Google Search Console 的 "URL 检查" 工具中测试关键页面是否被正确索引
