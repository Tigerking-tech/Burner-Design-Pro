---
title: "Orifice Plate Beta Ratio (β) Selection: d/D Trade-offs and Permanent Pressure Loss"
seoTitle: "Orifice Beta Ratio Selection | ISO 5167"
description: "How to choose the orifice beta ratio per ISO 5167: the 0.2–0.75 validity range, permanent pressure loss vs beta, signal strength, and a sizing worked example."
date: "2026-11-14"
tags: ["orifice plate", "beta ratio", "ISO 5167", "flow measurement", "differential pressure"]
category: "Flow Measurement"
keywords: "orifice plate beta ratio selection, orifice beta ratio range, permanent pressure loss orifice plate, orifice plate sizing calculation, ISO 5167 beta limits, d/D ratio orifice"
---

## Quick Answer

The beta ratio **β = d/D** (orifice bore ÷ pipe internal diameter) is the single most important design choice for an orifice meter. Practical guidance per ISO 5167:

- **Validity range:** roughly **0.10 ≤ β ≤ 0.75** for standard corner/flange/D-D/2 tappings.
- **Sweet spot:** **β ≈ 0.5–0.7** — good signal strength, acceptable permanent loss, low sensitivity to edge wear.
- **β < 0.2:** tiny bore, weak differential signal, high clogging risk.
- **β > 0.75:** discharge coefficient becomes very sensitive to Reynolds number and edge sharpness; uncertainty grows sharply.

## Why Beta Controls Everything

The differential pressure across the plate scales approximately with **1/β⁴** at a given flow. Halving β multiplies the ΔP by about 16. That single relationship drives every trade-off:

| β | ΔP signal | Permanent pressure loss | Uncertainty | Clogging risk |
|---|---|---|---|---|
| 0.2 | very high | very high (~96% of ΔP) | higher | high |
| 0.5 | moderate | ~75% of ΔP | low | moderate |
| 0.7 | low-moderate | ~51% of ΔP | low | low |
| 0.75 | low | ~44% of ΔP | rising | low |

**Permanent pressure loss** — the pumping energy you never recover — is approximately **(1 − β²) × measured ΔP**. This is the hidden operating cost of orifice metering: at β = 0.5 with a 250 mbar design ΔP, about 188 mbar is lost forever; at β = 0.7 only about 128 mbar.

## ISO 5167 Limits You Must Respect

ISO 5167-2 defines validity bounds; outside them the Reader-Harris/Gallagher discharge-coefficient equation is not applicable:

- Orifice plates: **0.10 ≤ β ≤ 0.75** (with corner, flange or D and D/2 tappings; some tapping types tighten the lower bound to β ≥ 0.15 or require Re_D limits).
- Reynolds number limits depend on β and tapping type (e.g., Re_D ≥ 5,000 for β ≤ 0.56 with corner taps).
- Pipe internal diameter and straight-length requirements upstream/downstream grow as β increases — a β = 0.7 plate after a single elbow may need 30+ D of straight pipe or a flow conditioner.

## Worked Sizing Example

**Given:** water, 120 m³/h, DN150 Sch 40 pipe (ID ≈ 154.1 mm), target ΔP ≈ 250 mbar at max flow, flange taps.

1. Pipe area A_D = π/4 × 0.1541² = 0.01865 m². Velocity V_D = (120/3600)/0.01865 ≈ 1.79 m/s.
2. Iterate β using q_m = C/√(1−β⁴) × ε × (π/4) d² × √(2 ΔP ρ). With C ≈ 0.606 and ε = 1 (liquid): solving gives **d ≈ 96 mm → β ≈ 0.62**.
3. Check permanent loss: (1 − 0.62²) × 250 ≈ **154 mbar**.
4. Check Re_D ≈ ρ V_D D/μ ≈ 2.7×10⁵ — comfortably inside ISO 5167 validity.

If the pump margin were tight, you could accept β = 0.7 (larger ΔP span needed for the same accuracy, or a lower design ΔP) to recover ~25 mbar of permanent loss. The [Orifice Calculator](https://burnerdesignpro.com/orifice-calculator) performs this iteration exactly, including the full Reader-Harris/Gallagher C equation and compressible-flow expansibility ε.

## Selection Checklist

1. Fix the design ΔP from transmitter range and available pump head.
2. Compute β; reject if outside 0.2–0.75 (practical band).
3. Verify Reynolds number limits at *minimum* flow, not just maximum.
4. Check straight-run availability against ISO 5167 tables for your β and fitting layout.
5. For steam/gas, include expansibility ε and density at flowing conditions.
6. Confirm bore edge sharpness and plate thickness tolerances (they dominate real-world uncertainty at high β).

## FAQ

**What beta ratio do most engineers use by default?**
β ≈ 0.6–0.7 is the common default for new installations: strong enough signal, moderate permanent loss, forgiving uncertainty.

**Why not always use a high β to save pumping cost?**
Above ~0.75 the discharge coefficient becomes extremely sensitive to plate edge wear, Reynolds number and upstream disturbances, so measurement uncertainty — and billing risk — outweighs the energy saving.

**Can I use one orifice plate over a wide flow range?**
Turndown is limited to roughly 3:1–4:1 because ΔP scales with flow squared; below ~25% of design flow the differential signal is hard to measure accurately.

**How does β affect the required straight pipe length?**
Higher β needs longer straight runs upstream of elbows/valves. ISO 5167-2 tables give exact lengths; at β = 0.7 after a 90° bend you may need 22–30 D without a conditioner.

## Related Tools

- [Orifice Plate Calculator](https://burnerdesignpro.com/orifice-calculator) — ISO 5167 sizing, C coefficient, ΔP and permanent loss
- [Orifice Plate Flow Measurement Guide (ISO 5167)](https://burnerdesignpro.com/blog/orifice-plate-flow-measurement-iso5167)
- [Engineering Unit Converter](https://burnerdesignpro.com/unit-converter) — flow and pressure unit conversions
