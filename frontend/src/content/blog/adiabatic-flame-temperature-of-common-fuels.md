---
title: "Adiabatic Flame Temperature of 12 Common Fuels: Hydrogen, Methane, Propane Table"
seoTitle: "Flame Temperatures of Common Fuels"
description: "Reference table of adiabatic flame temperatures in air for hydrogen, methane, propane, butane, CO, methanol and more — equilibrium values with dissociation, plus effects of excess air and preheat."
date: "2026-11-11"
tags: ["flame temperature", "adiabatic", "hydrogen", "methane", "NASA CEA"]
category: "Thermal Design"
keywords: "methane flame temperature, hydrogen flame temperature in air, propane flame temperature, adiabatic flame temperature table, acetylene flame temperature air, flame temperature excess air"
---

## Quick Answer

The adiabatic flame temperature (AFT) is the maximum temperature a fuel–air mixture reaches when burned without heat loss. For **stoichiometric combustion in air at 25°C and 1 atm**, equilibrium values (including high-temperature dissociation) for common fuels are:

| Fuel | Formula | AFT in air (°C, equilibrium) |
|---|---|---|
| Acetylene | C2H2 | ~2,300 |
| Ethylene | C2H4 | ~2,100 |
| Hydrogen | H2 | ~2,110 |
| Carbon monoxide | CO | ~2,100 |
| Diesel (C12H26 surrogate) | — | ~2,000 |
| Gasoline (isooctane) | C8H18 | ~2,000 |
| Propane | C3H8 | ~1,980 |
| n-Butane | C4H10 | ~1,980 |
| Ethane | C2H6 | ~1,960 |
| Methane / natural gas | CH4 | ~1,950 |
| Ethanol | C2H5OH | ~1,920 |
| Methanol | CH3OH | ~1,870 |
| Ammonia | NH3 | ~1,800 |

Values are typical of NASA-CEA-class equilibrium calculations; expect ±30–50°C spread between data sources depending on reference conditions and property sets. For your exact conditions (preheat, excess air, pressure, humidity) use the [Flame Temperature Calculator](https://burnerdesignpro.com/flame-temperature).

## Equilibrium vs Frozen: Don't Trust the Higher Number

Above ~1,500°C, combustion products dissociate endothermically (CO2 ⇌ CO + ½O2, H2O ⇌ OH + ½H2, N2 + O2 ⇌ 2NO). Dissociation absorbs real heat:

- **Frozen AFT** (no dissociation): for methane ≈ 2,327 K (≈ 2,054°C).
- **Equilibrium AFT** (with dissociation): for methane ≈ 2,226 K (≈ 1,953°C).
- The gap is ~100 K (~4–8%) for hydrocarbons and is what separates textbook answers from physically realistic ones.

Any serious burner design, NOx assessment or material selection must use the **equilibrium** value. See [Adiabatic Flame Temperature: Theory and Calculation](https://burnerdesignpro.com/blog/adiabatic-flame-temperature-explained) for the full derivation.

## Why Hydrogen Is Not the Hottest Flame (Surprise Result)

Despite hydrogen's reputation, its AFT in air (~2,110°C) is only modestly above methane's (~1,950°C). Two reasons:

1. Hydrogen needs 34.3 kg of air per kg of fuel — the largest dilution of any common fuel.
2. Its combustion products are almost pure H2O + N2, and H2O has a high heat capacity.

Hydrogen's real differences are **flame speed** (~8× methane), **emissivity** (nearly invisible, low-radiation flame) and **NOx behavior** — not peak temperature.

## Effect of Excess Air

Every increment of excess air dilutes the flame. Approximate equilibrium AFT for methane/natural gas:

| Excess air λ | AFT (°C) |
|---|---|
| 1.0 | ~1,950 |
| 1.1 | ~1,850 |
| 1.2 | ~1,760 |
| 1.5 | ~1,530 |
| 2.0 | ~1,280 |

(Butane follows the same pattern within ~20°C — e.g., λ = 1.2 gives ≈ 1,800°C.) This is the primary lever for controlling furnace temperature and thermal NOx.

## Effect of Air Preheat

Preheating combustion air raises AFT almost proportionally at first approximation: **+200°C air preheat ≈ +150–190°C flame temperature** for natural gas. This is why recuperative and regenerative burners reach furnace temperatures impossible with cold air — and why preheat must always be stated when quoting a flame temperature.

## Effect of Pressure

Pressure has a secondary effect on AFT (a few tens of °C between 1 and 20 bar for most fuels, slightly higher equilibrium temperature at high pressure because dissociation is suppressed). It is far less important than excess air and preheat.

## FAQ

**What is the flame temperature of natural gas in a real burner?**
Real flame temperatures are typically 100–300°C below the adiabatic value because of radiation and mixing losses. A stoichiometric natural-gas flame measured in practice is commonly 1,700–1,850°C.

**Which fuel has the highest flame temperature in air?**
Among common fuels, acetylene (~2,300°C in air) and cyanogen-class gases top the list; in oxygen rather than air, acetylene reaches ~3,100°C. Dicyanoacetylene in oxygen is the classic extreme (~4,800°C) but is not a practical fuel.

**Does a hotter flame always mean more NOx?**
Thermal (Zeldovich) NOx grows exponentially above ~1,500°C, so peak flame temperature is the dominant driver — but residence time and local oxygen matter too. Staged combustion lowers peak temperature and NOx simultaneously.

**Why do different websites quote different methane flame temperatures?**
Because they mix frozen vs equilibrium values, different reference temperatures (0°C vs 25°C), HHV vs LHV bases, and sometimes air vs oxygen. Always check the stated conditions; our calculator shows all assumptions with every result.

## Related Tools

- [Flame Temperature Calculator](https://burnerdesignpro.com/flame-temperature) — NASA-data equilibrium AFT for any fuel, excess air, preheat and humidity
- [Excess Air Calculation Guide](https://burnerdesignpro.com/blog/excess-air-calculation-combustion-o2)
- [NOx Emission Reduction Strategies](https://burnerdesignpro.com/blog/nox-emission-reduction-strategies)
