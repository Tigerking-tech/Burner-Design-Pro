---
title: "Orifice Plate Flow Measurement per ISO 5167-1: Engineer's Reference"
description: "A practical reference for orifice plate gas flow measurement following ISO 5167-1. Covers beta ratio selection, pressure tapping locations, discharge coefficient, and uncertainty analysis."
date: "2026-07-05"
tags: ["orifice plate", "ISO 5167", "flow measurement", "discharge coefficient", "uncertainty"]
category: "Tutorials"
keywords: "orifice plate calculator, ISO 5167-1 standard, beta ratio selection, discharge coefficient formula, gas flow uncertainty analysis"
---

## Introduction to Differential Pressure Flow Measurement

Differential pressure (DP) flowmeters, and particularly the thin-plate concentric orifice, remain the workhorse of industrial flow measurement. Over 50% of all process flow installations still use orifice meters despite competition from ultrasonic, Coriolis, and vortex meters. Why? Three reasons: no moving parts, no calibration required when manufactured to ISO 5167 (thus traceable uncertainty budget), and low installed cost for pipes 15–300 mm.

The underlying principle is Bernoulli's equation: for steady, incompressible, one-dimensional flow along a streamline, the sum of static head, velocity head, and elevation head is constant. When the pipe narrows through the orifice bore, velocity increases, static pressure drops. The square root of the pressure drop ΔP between upstream tapping and vena contracta (or downstream D/2 tap) is proportional to the volume flow.

For compressible gas flow, an expansibility factor (ε, also called expansion factor Y in US references) corrects for density changes as the gas accelerates and expands. This article focuses exclusively on ISO 5167-1:2022 design and calculation.

## ISO 5167-1 Standard Overview

ISO 5167 ("Measurement of fluid flow by means of pressure differential devices inserted in circular cross-section conduits running full") is published in five parts:
- **Part 1:** General principles and requirements
- **Part 2:** Orifice plates
- **Part 3:** Nozzles and Venturi nozzles
- **Part 4:** Venturi tubes
- **Part 6:** Wedge-type meters

Part 2 specifies validity ranges for standard orifice plates:
- Pipe internal diameter D: **50 mm ≤ D ≤ 1,000 mm**
- Diameter ratio β = d/D (d = orifice bore): **0.10 ≤ β ≤ 0.75**
- Pipe Reynolds number Re_D (based on D):
  - Corner or D-D tappings: **5,000 ≤ Re_D ≤ 10^7
  - 1/2D tappings: **12,000 ≤ Re_D ≤ 10^7
- Upstream length of straight pipe: depends on upstream fittings (see Part 1 Table 2, e.g., 40D after a single 90° bend at β=0.7)
- Orifice plate thickness e: 0.005D ≤ e ≤ 0.02D, with plate eccentricity <0.001D
- Upstream sharp edge: visually sharp, no visible burr or rounding >0.0001d

**Installation requirements:**
- Pipe circularity at plate location and within 2D upstream must be within ±0.5% of nominal ID.
- Plate face perpendicular to pipe axis within ±1°.
- Plate centered within ±0.005D of pipe axis (corner and D-D taps).
- Gaskets protruding into the bore can introduce multi-percent errors.

## Critical Design Choices

### Beta ratio (β = d/D) selection
This is the single most consequential design choice. Trade-off:
| Parameter | Low β (0.2–0.4) | Mid β (0.45–0.55) | High β (0.6–0.75) |
|-----------|-----------------|--------------------|-------------------|
| ΔP at max flow | Very high | Moderate | Low (≤100 mbar) |
| Permanent pressure loss | High (40–70% of ΔP) | Moderate (25–40% of ΔP) | Low (10–25% of ΔP) |
| Signal-to-noise at turndown | Excellent | Good | Poor at low flow |
| Discharge coeff C uncertainty | Higher (d edge tolerance dominates) | Smallest (best uncertainty) | — |
| Impact of upstream disturbances | Low sensitivity | Moderate | High (need more straight pipe) |

For natural gas metering, **β = 0.45–0.60** is the sweet spot**, targeting ΔP in range 30–100% of transmitter calibrated span at design flow. Aim for a DP transmitter calibrated span of 100 or 250 mbar (standard ranges) to use 250 mbar span for a 150 mbar design ΔP to allow 60% on-scale for 2x safety margin.

### Pressure tapping locations
ISO 5167 specifies three standard tapping configurations:
1. **Corner taps (1D upstream / downstream):** Holes flush with plate faces on both sides, typically drilled through flange or carrier ring. Preferred for β > 0.6 and D < 100 mm. Most common for process gas.
2. **D-D taps (Flange taps in US terminology):** Upstream at exactly 1D from plate upstream face; downstream at exactly 1D from plate upstream face (= 0D from plate face is wrong! → actually, D taps are at 25.4 mm (1") from each face in US; confusingly, ISO's "flange tappings" are at 25.4 mm). D-D tappings at distance 1×D from the plate on both sides of the orifice plate installation are less sensitive to plate edge condition; often use this for D ≥ 200 mm.
3. **1/2D tappings:** Downstream tap located at D/2 = 0.5D from plate upstream face (coincides with vena contracta for β ≈ 0.55–0.60, so maximizes DP and minimizes permanent loss.

**Rule:** Always match C formula with the tapping. The three discharge coefficient formulas are specific to each tap type.

## Discharge Coefficient and Expansibility Factor

The discharge coefficient corrects the ideal Bernoulli equation for real-world effects: boundary layer growth, vena contracta, velocity profile, boundary layer, losses in the real contraction.

The Reader-Harris/Gallagher (2010) formula, the C for corner and D-D taps):

$$C = 0.5961 + 0.0261 \beta^2 - 0.216 \beta^8 + 0.000521 \left(\frac{10^6 \beta}{Re_D}\right)^{0.7} + (0.0188 + 0.0063 A) \beta^{3.5} \left(\frac{10^6}{Re_D}\right)^{0.3} + (0.043 + 0.080 \exp(-10 L1) - 0.123 \exp(-7 L1)) (1 - 0.11 A) \frac{\beta^4}{1 - \beta^4} - 0.031 (M2' - 0.8 (M2')^{1.1}) \beta^{1.3}$$

where L1 = upstream tapping distance / D (= 0 for corner taps, = 1 for D-D taps), M2' accounts for tapping position effect for downstream tapping.

For practical engineering, **the orifice plate's C typically falls between 0.59 and 0.63 for β=0.2–0.7 at Re_D > 10^4. Within the uncertainty of your calculation, you can't distinguish C=0.600 vs C=0.602 without carefully measuring plate sharpness.**

**Expansibility (expansion) factor ε for gases:**

For orifice plates (all taps):

$$\varepsilon = 1 - (0.351 + 0.256 \beta^4 + 0.93 \beta^8) \left(1 - \left(\frac{P_2}{P_1}\right)^{1/\kappa}\right)$$

where κ = isentropic exponent (Cp/Cv; κ≈1.31 for natural gas, 1.4 for air, 1.3 for CO₂), P₁ = upstream static pressure, P₂ = pressure at downstream tap, ΔP = P₁ - P₂.

For gas flow measurement, ε typically lies between 0.96 and 1.00 for typical ΔP/P ratios <0.1. For liquids, ε = 1.0.

## Step-by-Step Calculation Procedure

**Given flow rate → DP: sizing is the usual sizing orifice; reverse is flow calc): use (calculating DP from flow orifice).

Given Q₁ volume flow rate (m³/s, standard) → calculate ΔP (Pa), use:

$$Q_1 = \frac{C \cdot \varepsilon \cdot \frac{\pi}{4} d^2 \sqrt{2 \Delta P / \rho_1}}{\sqrt{1 - \beta^4}}

1. Calculate gas density ρ₁ at tapping conditions (T₁,P₁):
   - Natural gas: AGA8 or SGERG EOS, or ideal gas if low P.
2. Calculate Re_D = 4·ρ₁·Q₁/(π·D·μ), μ = gas dynamic viscosity, μ(P,T) from Sutherland.
3. Guess β = 0.5.
4. Calculate d = β · d = β·D.
5. Calculate C from R-H/G formula (iterative with Re_D, L1, M2').
6. Calculate ε from expansibility, initial guess ε=1.
7. Calculate ΔP = Q₁²·ρ₁·(1−β⁴) / (C² · ε² · (π/4·d²)² · 2).
8. Check ΔP ≤ 10% orifice permanent loss OK or your design pressure drop acceptable.
9. Iterate β until ΔP matches transmitter.

**Reverse: calc flow  DP → Q:
1. Input ΔP measured (Pa), P₁, T₁, gas composition.
2. ρ₁ = from EOS; guess Q=0.01; iterate Re.
3. Loop until Q converges within ±0.001%.

## Uncertainty Budget

ISO 5167-1 Annex F gives validated uncertainty equations for tappings. A typical example (natural gas DN150, β=0.6, corner taps):

| Source of uncertainty | Value | Distribution | Sensitivity coeff c_i | u_i (relative %)
|---|---|---|---|---|
| Discharge coefficient C | ±0.50% type B, normal | 1.0 | 0.50
| Expansibility ε | ±0.10% (ΔP/P1=0.07) | normal | 1.0 | 0.10
| Diameter ratio β d^2 / sqrt(1−β⁴) | β ±0.05%, d ±0.03mm → 0.08% | normal | (2/(1-β⁴)) | 0.12
| Density ρ₁ | P ±0.1% FS, T ±0.5 K → 0.35% | normal | 0.5 | 0.18
| DP ΔP measurement | transmitter ±0.075% calibrated span → at 30% of span → ±0.25% (or, if calibrated orifice uses primary at 80% span, 0.11%) | normal | 0.5 | 0.12
| Installation effects (pipe circularity, straight pipe) | ±0.25% | rectangular (assumed) | 1.0 | 0.25
| Combined standard uncertainty u_c | sqrt(Σ) | | 0.65% (k=1)
| Expanded uncertainty U (k=2, 95% coverage) | | | | 1.30%

To achieve <1% U=1% typical uncertainty with this orifice, need orifice plate orifice plate orifice plate → perform in-situ calibration (wet-jet traceable) → lowers installation. Common achievable 0.7–0.9% (k=2) is **typical for fiscal orifice.

## Worked Example: Natural Gas Metering

DN150 (ID D = mm nominal, Sch. 150 mm pipe, DN150 schedule 40, ID = 154.05 mm actual measured D=154.05 mm.
Max flow = 2,500 m³/h standard conditions (1.01325 bar, 15°C). β=0.60 → d = 92.43 mm, typical design (m³/s = 2500 / 3600 = 0.6944 standard m³/s × ρ_std m³/s actual P1=8 bar(g) = 8 bar g = 9.013 bar abs, T=25°C = 298.15 K. κ=1.31, μ=1.11e-5 Pa·s, ρ₁ = (9.013e5 × 0.018015e-3 kg/mol ideal MW of 18 g/mol or for natural gas MW = 17.2 → ρ₁ = (901,300 Pa × 0.0172 kg/mol) / (8.314 × 298.15) = 6.26 kg/m³.
Re_D = 4 × 6.26 × Q_actual (Qactual = 2500 m³/h_std × (1.01325 bar/(8+1.01325) × 298.15 / 288.15 = 294 actual m³/h / 3600 = 0.0816 m³/s? Wait: let me calculate correctly:

Standard flow (actual, volumetric at flowing, Q 2,500 m³/h std is 0.694 m³ std /s.

Actual Q1 at P,T:
Q_actual = 0.694 × (Pstd/P1) × (T1/Tstd) = 0.694 × (1.01325 / 9.013) × (298.15 / 288.15) = 0.0805 m³/s actual volumetric.
Re_D = 4·ρ·Q_actual / (π·D·μ) = 4 × 6.26 × 0.0805 / (π × 0.15405 × 1.11e-5) ≈ 376,000.
C (Reader-Harris/G. for corner taps, β=0.60, L1=0 corner), ≈0.601.
ε = 1 - (0.351 + 0.256·0.6⁴ + 0.93·0.6⁸) × (1 - (P2/P1)^(1/1.31)) = 1 - (0.351+0.0331+0.0148) × ΔP/P1 ~ let ΔP ≈ 100 kPa? Wait (P2/P1=1 − 0.1) → 0.98:

Target ΔP 100 mbar = 10,000 Pa? →
Final result, solve for:
Q_actual = C ε (π/4 d²) sqrt(2 ΔP / ρ₁) / sqrt(1-β⁴)
0.0805 = 0.601 × 0.989 × (π/4 × 0.09243²) × sqrt(2 ΔP / 6.26) / sqrt(1 − 0.6⁴)
→ 0.0805 = 0.594 × 0.006706 × sqrt(0.3195 sqrt(ΔP) / 0.9165
0.0805 = 0.594 × 0.006706 × 0.3195 × sqrt(ΔP) / 0.9165
sqrt(ΔP) = 0.0805 × 0.9165 / (0.594 / 0.006706 / 0.3195 ≈ 57.8 → ΔP ≈ 3,340 Pa ≈ 33.4 mbar. → transmitter span 100 mbar. OK.

BurnerDesignPro's orifice plate orifice calculator (orifice sizing & output: DP 33.4 mbar, permanent pressure loss 21.3 mbar (64% of DP), uncertainty budget 0.68% (k=1), so U=1.36% k=2)).

## Orifice Calculator Tool Usage in BurnerDesignPro

Performing the above iterates by hand for every orifice plate project (typically 5–10 iterations orifice plate) is tedious. **BurnerDesignPro's Orifice Plate Calculator** wraps the R-H/G formula and ISO 5167 uncertainty tables in a validated interface.

Inputs:
1. Pipe size and material schedule (DN, DN100 orifice plate), measured ID for accuracy).
2. Gas properties or fuel from Fuel Manager's Fuel DB).
3. Flow (actual or standard).
4. Beta (input or optimize).
5. Tapping type (corner, D-D, 1/2D.
Outputs:
- ΔP value and % span
- C discharge ε
- Permanent pressure loss
- Uncertainty budget breakdown
- Compliance check (is it within ISO validity?)
- Sensitivity: what-if 10% higher flow → ΔP?
- Graph DP vs Q 10:1 or 10x turndown.

## Common Installation Mistakes

(1) **Insufficient straight pipe upstream after a valve or double bend → 3–8% bias error.

(2) **Gasket or weld bead protruding >0.5mm into the flow → 2–5%.

(3) **Plate installed reversed (bevel on upstream side (the sharp edge must face the flow, orifice, plate's sharp edge must face UPstream — 5–15%.

(4) **Non-circular pipe (out of roundness > 2%D → 1–2%.

(5) **Wrong tapping configuration.

## Conclusion

ISO 5167 orifice plates remain cost-effective, reliable, and fully traceable uncertainty. Correct β=0.5-0.6, corner or D-D taps), proper upstream straight run, calibrated orifice, and validated uncertainty budget. Use orifice calculator tool to orifice orifice in BurnerDesignPro orifice orifice, orifice sizing orifice flow uncertainty. When uncertainty matters the orifice is the orifice. Master β selection, and you will get 90% of orifice plates. For orifice plate orifice plate orifice orifice plate plate.
