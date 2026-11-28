---
title: "Ammonia Co-Firing: Combustion Properties, the NOx Challenge, and What It Means for Burner Calculations"
seoTitle: "Ammonia Co-Firing: Flame & NOx Explained"
description: "Ammonia co-firing has been demonstrated at 20% ratio on a 1000 MW unit. What NH₃ does to flame temperature, flame speed, ignition range and NOx — and which combustion parameters you must recalculate before co-firing."
date: "2026-11-28"
tags: ["ammonia co-firing", "NOx", "flame temperature", "decarbonization", "boiler"]
category: "Combustion Engineering"
keywords: "ammonia co-firing combustion, ammonia coal co-firing NOx, ammonia flame temperature, ammonia flame speed, ammonia co-firing 20%, ammonia boiler burner calculation"
---

## Quick Answer

Ammonia (NH₃) burns without producing CO₂, but it is a difficult fuel: **slow flame speed (~7 cm/s vs ~40 cm/s for methane), a narrow flammability range (15–28 vol% in air), a lower flame temperature, and a strong tendency to produce NOx from fuel-bound nitrogen**. Pilot data from a 4 MW facility shows NOx climbing from ~146 mg/m³ (pure coal) to ~760 mg/m³ (pure ammonia) as the NH₃ ratio rises — so co-firing works best at moderate ratios (around 20%) with staged combustion, exactly the level already demonstrated on a 1000 MW commercial unit.

## Why ammonia is being co-fired at all

Co-firing ammonia in existing coal plants lets operators cut CO₂ without replacing the boiler. Japan's IHI demonstrated ammonia firing at commercial scale, and a 20% ammonia fuel ratio has been successfully demonstrated on a **1000 MW** power plant. China has also completed a high-ratio ammonia co-firing engineering demonstration on a 320 MW unit under a national R&D program. The technology is real — the combustion engineering is the hard part.

## Combustion properties you must recalculate

| Property | Methane (reference) | Ammonia (NH₃) | Design consequence |
|---|---|---|---|
| LHV | ~50 MJ/kg | ~18.6 MJ/kg | More fuel mass per MW |
| Laminar flame speed | ~40 cm/s | **~7 cm/s** | Flame stability, need pilot/co-fire support |
| Flammability range in air | 5–15 vol% | **15–28 vol%** | Harder ignition, longer ignition delay |
| Adiabatic flame temp. | ~2,227 K | **lower (~2,075 K est.)** | Check with the [Flame Temperature calculator](/flame-temperature) |
| Fuel-bound nitrogen | none | **high** | NOx formation pathway dominates |
| CO₂ per unit energy | baseline | **zero** | The point of co-firing |

**Practical implications:** at 20% co-firing the boiler keeps most of its coal flame characteristics, ignition is supported by the coal flame, and NOx stays manageable with air staging. As the ammonia ratio increases, flame visibility and main-zone temperature drop and NOx rises monotonically — which is why demonstrations cluster at the 20% level.

## The NOx problem in numbers

In 4 MW pilot tests, moving from pure coal to pure ammonia combustion raised NOx from **146 to 760 mg/m³**, driven primarily by fuel-bound nitrogen rather than thermal NOx. The countermeasures are the standard ones from our [NOx reduction guide](/blog/nox-emission-reduction-strategies), applied more aggressively:

1. **Air staging / OFA** — push primary zone stoichiometry below 1.0 so fuel-N converts to N₂ instead of NO.
2. **Low primary-zone ammonia slip control** — unburned NH₃ in flue gas is itself a regulated pollutant and an SCR interference risk.
3. **Flue gas monitoring** — track NOx, O₂ and residual NH₃ continuously; convert measurements to reference-oxygen concentrations with the [Emission Calculator](/emission).

## Checklist before a co-firing trial

- Recalculate the fuel flow at target heat input (NH₃ LHV is ~37% of methane's).
- Re-check burner flame stabilization margin against the slower flame speed.
- Update the combustion air and excess-air settings — see the [excess air calculation guide](/blog/excess-air-calculation-combustion-o2).
- Baseline NOx at coal-only operation, then map NOx vs NH₃ ratio during the trial.

## FAQ

**Why is ammonia's flame so slow?**
NH₃ has high ignition energy and a narrow flammability window; its laminar burning velocity is roughly one-sixth of methane's, which is why co-firing with a stable coal or gas flame is used as the pilot.

**Does ammonia co-firing increase or decrease flame temperature?**
It decreases the main-zone flame temperature (ammonia's adiabatic flame temperature is lower than hydrocarbons'), which changes heat transfer distribution in the furnace — recheck with the [Flame Temperature calculator](/flame-temperature).

**Is the extra NOx from the air or the fuel?**
Mostly the fuel. With ammonia, fuel-bound nitrogen dominates NOx formation, unlike natural gas combustion where thermal NOx dominates.

**What co-firing ratio is commercially proven?**
Around 20% by fuel ratio, demonstrated on a 1000 MW commercial unit; higher ratios are at demonstration stage on smaller units.
