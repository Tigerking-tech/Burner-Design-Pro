---
title: "Wobbe Index Explained: The Key Number Behind Gas Interchangeability"
seoTitle: "Wobbe Index & Gas Interchangeability"
description: "What the Wobbe index is, how to calculate it per ISO 6976, typical values for natural gas, LPG and hydrogen, and why it decides whether a burner can accept a new gas."
date: "2026-11-21"
tags: ["Wobbe index", "gas interchangeability", "ISO 6976", "natural gas", "hydrogen blending"]
category: "Combustion Engineering"
keywords: "wobbe index calculation, wobbe index natural gas, gas interchangeability criteria, hydrogen blending wobbe index, ISO 6976 wobbe, burner gas family"
---

## Quick Answer

The Wobbe index (WI) measures the **heat input a burner receives at a given gas pressure drop**. It is defined as the gross (or net) calorific value divided by the square root of the relative density:

**WI = H / √d** where H is the calorific value (MJ/m³ at reference conditions) and d is gas density relative to air.

Two gases with the same Wobbe index deliver the same heat release through the same orifice at the same supply pressure — which is why WI, not calorific value alone, is the primary criterion for gas interchangeability.

## Why Calorific Value Alone Misleads

A common mistake is comparing fuels only by heating value. Consider natural gas (H ≈ 39 MJ/m³) and propane (H ≈ 93 MJ/m³). Propane has more than double the volumetric energy — yet when you swap gases in a fixed burner, what matters is how much gas *flows* through the injector, and that depends on density. The Wobbe index combines both effects:

| Gas | H gross (MJ/m³) | Relative density d | Wobbe index (MJ/m³, gross) |
|---|---|---|---|
| Hydrogen (H2) | 12.7 | 0.069 | ~15.2 |
| Biogas (60% CH4) | ~23 | ~0.85 | ~25 |
| Natural gas (typical pipeline) | ~39 | ~0.60 | ~50 |
| Propane (C3H8) | 93.2 | 1.52 | ~75 |
| Butane (C4H10) | 121.8 | 2.01 | ~86 |

Natural gas and propane have very different calorific values *and* very different Wobbe indices — they are **not interchangeable** without re-jetting the burner.

## Wobbe Index and Gas Families (EN 437)

European appliance standards group gases into families by Wobbe range:

- **1st family** (manufactured gas): WI ≈ 22.4–24.8 MJ/m³
- **2nd family** (natural gas): WI ≈ 39.1–54.7 MJ/m³ (groups E, L, H)
- **3rd family** (LPG): WI ≈ 72.9–87.3 MJ/m³

A burner designed for one family generally cannot accept another family without hardware changes. Within a family, utilities guarantee WI stays inside the declared band so appliances remain safe.

## Hydrogen Blending: Why WI Drops

Adding hydrogen to natural gas lowers the Wobbe index sharply (H2 WI ≈ 15 MJ/m³ vs ~50 for NG). A 20 vol% hydrogen blend typically reduces WI by about 7–8%. Consequences:

1. **Lower heat input** at constant pressure — appliances run "cold" unless derated or re-jetted.
2. **Higher flame speed** — increased flashback risk in premix burners.
3. **Changed flame stability limits** — lift-off and blow-off behavior shifts.

Most current appliances tolerate only a few percent of hydrogen without modification. Any blending study must track WI alongside flame speed and stoichiometric air requirement — all three are outputs of our [Fuel Gas Properties Manager](https://burnerdesignpro.com/fuel-manager) (ISO 6976).

## Worked Example

A burner is rated for natural gas: H = 39.1 MJ/m³, d = 0.60.

WI = 39.1 / √0.60 = 39.1 / 0.7746 = **50.5 MJ/m³**

The utility announces a gas change to a richer gas: H = 41.0 MJ/m³, d = 0.64.

WI = 41.0 / √0.64 = 41.0 / 0.80 = **51.3 MJ/m³**

Change = +1.6%. Most appliance standards allow ±5% WI variation without adjustment, so this swap is acceptable. If the change exceeded ~5%, re-jetting or governor adjustment would be required.

## Calculation Notes (ISO 6976)

- ISO 6976 computes calorific values and densities from the full gas composition (mole fractions of CH4, C2H6, CO2, N2, ...) at reference conditions (commonly 15°C/15°C or 25°C/25°C — always state the basis).
- Use **gross** WI for appliance rating comparisons in most standards; some markets quote net WI — never mix the two.
- For mixtures, compute H and d of the blend first, then take the ratio. WI is *not* a mole-fraction-weighted average of component WIs.

## FAQ

**What is a "good" Wobbe index for natural gas?**
Pipeline natural gas typically lands between 48 and 52 MJ/m³ gross (≈ 1,290–1,400 BTU/ft³). The exact acceptable band is defined by your national gas quality regulation (e.g., EN 16726 in the EU).

**Does the Wobbe index change with temperature and pressure?**
WI uses densities and calorific values at defined reference conditions, so it is a property of composition, not of line conditions. But metering and burner orifice flow depend on actual density, so always convert to operating conditions for flow calculations.

**Can two gases with identical Wobbe index always be interchanged?**
WI is necessary but not sufficient. Complete interchangeability checks also consider flame speed, stoichiometric air requirement, and burner design limits (e.g., Weaver or AGA interchangeability indices).

**How do I calculate WI for a biogas or syngas mixture?**
Enter the full composition (CH4, CO2, CO, H2, N2...) into the [Fuel Manager](https://burnerdesignpro.com/fuel-manager); it computes H, d and WI per ISO 6976.

## Related Tools

- [Fuel Gas Properties Manager](https://burnerdesignpro.com/fuel-manager) — WI, calorific value and density per ISO 6976
- [Flame Temperature Calculator](https://burnerdesignpro.com/flame-temperature) — flame behavior of blended gases
- [Natural Gas Combustion Calculation Guide](https://burnerdesignpro.com/blog/natural-gas-combustion-calculation-guide)
