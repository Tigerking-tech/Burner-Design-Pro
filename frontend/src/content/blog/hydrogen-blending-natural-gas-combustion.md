---
title: "Hydrogen Blending in Natural Gas: How 20% H₂ Changes Wobbe Index, Flame Temperature and Air Demand"
seoTitle: "Hydrogen Blending: Wobbe & Flame Effects"
description: "What a 20% hydrogen blend does to Wobbe index, adiabatic flame temperature, flame speed and stoichiometric air — with worked numbers for a typical natural gas and links to free calculators."
date: "2026-11-28"
tags: ["hydrogen blending", "wobbe index", "flame temperature", "natural gas", "decarbonization"]
category: "Combustion Engineering"
keywords: "hydrogen blending natural gas, 20% hydrogen blend wobbe index, hydrogen blend flame temperature, hydrogen natural gas stoichiometric air, hydrogen-ready burner, hydrogen blend combustion calculation"
---

## Quick Answer

Blending 20 vol% hydrogen into a typical natural gas **lowers the volumetric heat content by roughly 13% and the Wobbe index by only about 4%**, because hydrogen's low density partially compensates for its low heating value. **Stoichiometric air demand per m³ of blend falls by ~15%**, while laminar flame speed rises sharply and adiabatic flame temperature stays slightly higher than pure methane. The practical consequence: appliances and burners certified for natural gas usually tolerate 20% H₂ without re-jetting, but flashback and NOx behavior must be re-checked.

## Why this is the hottest burner topic in 2026

EU member states are piloting hydrogen-ready boilers, and burner manufacturers (e.g. SAACKE, Weishaupt) have filed safety certifications for 20% hydrogen operation. The bridge strategy widely cited for industrial furnaces is: **start at 20% H₂ in 2026, move to ~50% around 2028–2029, and reach 100% near 2032–2035** as green hydrogen approaches cost parity. If you design or operate combustion equipment, hydrogen-blend property calculations are now a routine task.

## Worked example: 20% H₂ blend vs pure methane

Illustrative numbers for a methane-rich natural gas; use the [Fuel Gas Properties calculator](/fuel-manager) for your actual gas composition.

| Property | Pure CH₄ | 80% CH₄ + 20% H₂ | Change |
|---|---|---|---|
| HHV (volumetric) | ~37.7 MJ/m³ | ~32.7 MJ/m³ | **−13%** |
| Density | ~0.717 kg/m³ | ~0.590 kg/m³ | −18% |
| Specific gravity (air=1) | ~0.586 | ~0.482 | −18% |
| **Wobbe index (HHV)** | **~49.2 MJ/m³** | **~47.1 MJ/m³** | **−4%** |
| Stoichiometric air | ~9.53 m³/m³ | ~8.10 m³/m³ | **−15%** |
| Adiabatic flame temp. | ~2,227 K | ~2,280 K (est.) | slightly ↑ |
| Laminar flame speed | ~0.4 m/s | rises 2–3× locally | **↑↑** |

**Why Wobbe barely moves:** Wobbe = HHV / √SG. Blending cuts HHV by 13% but also cuts specific gravity, and the square root softens the impact. This is why a 20% blend typically stays inside the appliance acceptance band — see our [Wobbe index guide](/blog/wobbe-index-gas-interchangeability) for the interchangeability rules.

## What actually changes at the burner

1. **Air demand drops ~15% per m³ of blend.** Because the blend's volumetric heat content is lower, you will also pass more cubic meters of fuel for the same heat input — recalculate both the fuel flow and the combustion air, not just the ratio. The excess-air setting then has to be verified from flue gas O₂; our [excess air calculation guide](/blog/excess-air-calculation-combustion-o2) shows the lambda formula.
2. **Flame speed rises and the flame shortens.** Hydrogen's laminar burning velocity is roughly 6–7× methane's, so even a 20% blend measurably increases the mixture's burning velocity. This is what drives **flashback risk** in premixed burners and why certification bodies test the blend rather than extrapolating from natural gas.
3. **Flame temperature and NOx.** The adiabatic flame temperature stays comparable to or slightly above methane's — check yours with the [Flame Temperature calculator](/flame-temperature). Locally hotter zones can increase thermal NOx even though the fuel itself is carbon-free; monitor NOx during commissioning.
4. **CO and CO₂ fall.** Carbon emissions per m³ of blend drop roughly 20% (only the methane part contains carbon), which is the entire point of the transition.

## FAQ

**Does a 20% hydrogen blend require re-jetting appliances?**
Usually not. The ~4% Wobbe shift is inside the typical ±5–10% interchangeability tolerance, but it must be confirmed against the appliance's specified Wobbe band.

**Is the flame temperature much higher with hydrogen?**
Pure hydrogen's adiabatic flame temperature in air (~2,400 K) is only ~170 K above methane's. At 20% blending the difference is a few tens of kelvin. Calculate it for your mixture with the [Flame Temperature calculator](/flame-temperature).

**How do I compute the blend's properties?**
Mass/volume-weight the component properties (HHV, density), then Wobbe = HHV/√SG. Our [Fuel Gas Properties calculator](/fuel-manager) does this per ISO 6976 for custom mixtures including H₂.

**Does hydrogen blending reduce CO₂ at the stack?**
Yes — roughly in proportion to the carbon-free fraction, ~20% less CO₂ per m³ of blend at 20% H₂, before accounting for the higher volumetric fuel flow at constant heat input.
