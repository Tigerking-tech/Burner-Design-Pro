---
title: "CBAM Embedded Emissions: Calculating Direct Emissions from Fuel Combustion (2026 Definitive Regime)"
seoTitle: "CBAM Embedded Emissions Calculation Guide"
description: "CBAM entered its definitive regime on 1 January 2026. How to calculate direct embedded emissions from natural gas and other fuels with the standard calculation method — activity data, emission factors, oxidation factor, and a worked example."
date: "2026-11-28"
tags: ["CBAM", "embedded emissions", "CO2 calculation", "EU ETS", "natural gas"]
category: "Emissions & Compliance"
keywords: "CBAM embedded emissions calculation, CBAM direct emissions fuel combustion, CBAM 2026 definitive regime, embedded emissions natural gas emission factor, CBAM declaration calculation, carbon border adjustment mechanism"
---

## Quick Answer

Under CBAM's definitive regime (in force since **1 January 2026**), importers must report the **embedded direct emissions** of covered goods and surrender certificates. For on-site fuel combustion, direct emissions are calculated the same way as in the EU ETS standard method: **CO₂ = activity data × net calorific value × emission factor × oxidation factor**. For natural gas that works out to roughly **1.9 kg CO₂ per m³ burned** (56.1 t CO₂/TJ at ~38 MJ/m³ NCV), and our [Emission Calculator](/emission) automates the O₂-corrected flue gas side of the calculation.

## Who has to do this now

CBAM covers imports of **cement, iron and steel, aluminium, fertilizers, electricity and hydrogen** into the EU. Since 1 January 2026 the transitional phase ended: importers must be authorised CBAM declarants, report embedded emissions, and buy and surrender CBAM certificates. The **annual CBAM declaration** for the preceding calendar year is due by **30 September** (Regulation (EU) 2025/2083). If you are a non-EU producer, EU customers will ask you for installation-level emission data — that is where the combustion calculations land on your desk.

## The standard calculation method for direct emissions

For each fuel stream at the installation:

```text
CO₂ emitted = activity data × NCV × emission factor × oxidation factor
```

| Term | Meaning | Typical value (natural gas) |
|---|---|---|
| Activity data | Fuel consumed in the period | e.g. 120,000 m³/year |
| NCV | Net calorific value | ~38 MJ/m³ (≈ 0.038 GJ/m³) |
| Emission factor | t CO₂ per TJ | **56.1 t CO₂/TJ** (IPCC default) |
| Oxidation factor | Fraction oxidised to CO₂ | 1.0 (≈100% for gas combustion) |

**Worked example:** 120,000 m³ × 0.038 GJ/m³ × 0.0561 t CO₂/GJ × 1.0 = **255.8 t CO₂/year**. Per cubic meter that is ≈ 1.9 kg CO₂ — the number most declarants use as a sanity check.

The same structure applies to fuel oil, LPG and coal with their own NCVs and emission factors. If the installation monitors emissions by measurement (e.g. continuous flue gas monitoring), measured values can replace the calculation method where the rules allow.

## Direct vs indirect embedded emissions

- **Direct emissions** — fuel combustion on site (burners, boilers, furnaces), plus process emissions where relevant (e.g. calcination in cement). This guide's formula covers the combustion part.
- **Indirect emissions** — electricity consumed in producing the goods. Electricity has its own default emission factors; actual values may be used under specified conditions.

Precursors matter too: for "complex goods", the embedded emissions of covered precursor inputs are added to the attributed emissions of the final good. If a carbon price was already paid in the production country, that can reduce the CBAM obligation — but it must be reported.

## Where a combustion calculator helps

Declarants are often asked for **flue-gas-based verification** of the calculated numbers. That means converting stack measurements (O₂, CO, NOx at reference oxygen) into emission concentrations and mass rates — exactly what our [Emission Calculator](/emission) does per EPA Method 19 / EU IED conventions, and what the [natural gas combustion guide](/blog/natural-gas-combustion-calculation-guide) explains step by step.

## FAQ

**Is there a minimum threshold?**
Yes — a de-minimis exemption applies to small import quantities (50 tonnes per year threshold for the covered goods), so most industrial importers are inside the regime.

**Can I use default emission factors?**
Defaults (IPCC/Commission factors) are acceptable in defined cases, but installation-specific actual data gives lower and more defensible numbers where your fuel quality differs from default.

**What if my fuel is a hydrogen blend?**
Recalculate the emission factor from the actual gas composition — a 20% H₂ blend cuts CO₂ per m³ by about 20%. Our [hydrogen blending article](/blog/hydrogen-blending-natural-gas-combustion) shows the property math.

**Do I report per shipment or per year?**
Under the definitive regime the declaration is **annual**, covering all covered imports of the preceding calendar year, submitted by 30 September.
