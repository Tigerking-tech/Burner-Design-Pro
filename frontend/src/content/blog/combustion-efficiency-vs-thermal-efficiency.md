---
title: "Combustion Efficiency vs Thermal Efficiency: Definitions, Formulas and Stack Loss"
seoTitle: "Combustion vs Thermal Efficiency | BurnerDesignPro"
description: "The precise difference between combustion efficiency and thermal efficiency, how to calculate stack loss with the Siegert formula from flue gas O2/CO2 and temperature, and typical values for boilers."
date: "2026-11-07"
tags: ["combustion efficiency", "thermal efficiency", "stack loss", "Siegert", "boiler"]
category: "Combustion Engineering"
keywords: "combustion efficiency vs thermal efficiency, boiler efficiency calculation, stack loss formula, Siegert formula flue gas, flue gas loss O2, boiler efficiency from O2 and temperature"
---

## Quick Answer

- **Combustion efficiency** measures how completely the fuel burns and how much heat escapes in the dry flue gas and unburned species (CO, soot). Typical modern gas boiler: **85–92%** (non-condensing, LHV basis).
- **Thermal (overall) efficiency** additionally subtracts radiation, convection and blowdown losses from the appliance body. It is always **lower** than combustion efficiency, typically by 1–5 percentage points.

Both are usually quoted on the fuel's **net calorific value (LHV)** basis in Europe; condensing units can exceed 100% on LHV because they recover latent heat from water vapor — which is why the HHV/LHV basis must always be stated.

## The Loss-Based (Indirect) Method

Efficiency is most reliably computed by subtracting losses from 100% (indirect method, per ASME PTC 4 / EN 12952-15 style accounting):

**η = 100% − q_stack − q_unburned − q_radiation − q_blowdown − ...**

| Loss | Typical size (gas boiler) | Driver |
|---|---|---|
| Stack (dry flue gas) loss | 6–15% | flue gas temperature and excess air |
| Latent (H2O) loss | ~11% of LHV if not condensed | fuel hydrogen content |
| Unburned (CO, soot) | <0.5% when tuned | burner condition |
| Radiation/convection | 0.5–3% | insulation, size, load |

## Stack Loss: The Siegert Formula

The dominant loss can be estimated directly from flue gas analysis. The classic **Siegert formula**:

**q_stack (%) ≈ A × (T_flue − T_air) / CO2%**

where A is a fuel-specific constant (≈ 0.5–0.65 for natural gas when CO2 is in % and temperatures in °C). Equivalent O2-based forms exist; modern analyzers compute it from measured O2, CO and temperatures.

**Worked example:** natural gas boiler, flue gas 180°C, combustion air 20°C, O2 = 3% (≈ 15% excess air, CO2 ≈ 10% dry):

q_stack ≈ 0.6 × (180 − 20) / 10 ≈ **9.6%**

Add ~0.3% unburned and ~1.5% radiation → combustion efficiency ≈ 100 − 9.6 − 0.3 = **90.1%**, thermal efficiency ≈ **88.6%** (LHV basis). Lowering flue gas to 120°C (e.g., economizer) cuts stack loss to ~6% — a ~3.5-point efficiency gain.

**Rule of thumb:** each **20°C reduction in stack temperature** saves about **1 percentage point** of efficiency; each **1% reduction in O2** (less excess air) saves roughly **0.5 point** — see the [excess air guide](https://burnerdesignpro.com/blog/excess-air-calculation-combustion-o2).

## Why Condensing Boilers Exceed 100%

Natural gas produces ~1.6 kg of water vapor per kg of fuel; condensing it recovers ~11% of the LHV as latent heat. On an LHV basis, condensing boilers reach **105–109%**; on an HHV basis the same performance is **94–98%**. Neither number is wrong — the basis differs. Always compare efficiencies on the same calorific-value basis (our [Fuel Manager](https://burnerdesignpro.com/fuel-manager) computes both per ISO 6976).

## Combustion vs Thermal vs Seasonal Efficiency

| Metric | Includes | Typical use |
|---|---|---|
| Combustion efficiency | stack + unburned losses | tuning, diagnostics |
| Thermal efficiency | + radiation, convection, blowdown | rating plates, acceptance tests |
| Seasonal efficiency | + cycling, standby, part-load losses | energy labeling (e.g., EU ErP) |

A boiler with 92% combustion efficiency may deliver only 84–87% seasonal efficiency in a poorly controlled heating system — which is why diagnostics should measure both flue gas and operating pattern.

## FAQ

**How do I calculate boiler efficiency from O2 and stack temperature alone?**
Use the Siegert/indirect method: compute stack loss from (T_flue − T_air) and O2 or CO2, add an estimate for unburned and radiation losses, subtract from 100%. The [Combustion Efficiency Calculator](https://burnerdesignpro.com/efficiency) does this with fuel-specific constants.

**What is a good combustion efficiency for a gas boiler?**
Non-condensing: 88–92% (LHV). Condensing: 100–108% (LHV). Below ~85% usually indicates excess air, fouled heat transfer surfaces, or poor burner tuning.

**Does higher excess air ever improve efficiency?**
No — it always raises stack loss. It is only increased to guarantee complete combustion when mixing is imperfect; the optimum is the minimum air that keeps CO near zero.

**LHV or HHV — which should I report?**
Follow your regulation or contract. EU practice and most burner datasheets use LHV; US boiler ratings often use HHV. Converting: HHV ≈ LHV + latent heat of fuel hydrogen (≈ 10% for natural gas).

## Related Tools

- [Combustion Efficiency Calculator](https://burnerdesignpro.com/efficiency) — Siegert-method efficiency from O2/CO2 and temperatures
- [Emission Calculator](https://burnerdesignpro.com/emission) — full flue gas composition
- [Fuel Gas Properties Manager](https://burnerdesignpro.com/fuel-manager) — HHV/LHV per ISO 6976
