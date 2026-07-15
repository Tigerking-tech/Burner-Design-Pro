#!/usr/bin/env python3
"""诊断 Z-05 失败原因"""
import json
import insulation_reference as ref
import insulation_verify as v

with open('insulation_test_cases.json') as f:
    cases = {c['id']: c for c in json.load(f)['cases']}

# Z-05: 平壁防凝露+玻璃棉+室外
c = cases['Z-05']
print(f"Case Z-05: {c['group']} | {c['varies']}")
print(f"  flat, k={c['k']}, Tf={c['mediumTemp']}, Ta={c['ambientTemp']}, RH={c['relativeHumidity']}")
print(f"  v={c['windSpeed']}, eps={c['emittance']}, L={c['surfaceLength']}, W={c['surfaceWidth']}")

dp = ref.dew_point(c['ambientTemp'], c['relativeHumidity'])
target = dp + 1
print(f"  dew_point={dp:.3f}, target(Ts)=dew+1={target:.3f}")

w = v.webapp_calculate(c)
r = ref.calculate(c)
print(f"\n  Webapp: delta={w['thickness_mm']:.3f}mm, Ts={w['surfaceTemp']:.3f}, h={w['h']:.3f}")
print(f"  Ref:    delta={r['thickness_mm']:.3f}mm, Ts={r['surfaceTemp']:.3f}, h={r['h']:.3f}")

# 用 ref 的 surface_state_flat_sc 手算几个 delta 的 Ts
print("\n  Delta (mm) | Ts_webapp_SC | Ts_ref_SC")
for delta_mm in [2, 4, 4.4, 5, 6, 8, 10, 16, 32]:
    delta_m = delta_mm / 1000.0
    Ts_w, _, _, _, h_w = v.webapp_surface_state_flat_sc(
        c['k'], c['mediumTemp'], c['ambientTemp'], delta_m,
        c['windSpeed'], c['emittance'], c['surfaceLength'], c['surfaceWidth'])
    # ref 的等价: 手算 self-consistent
    ts_g = c['ambientTemp'] + 0.5 * (c['mediumTemp'] - c['ambientTemp'])
    for _ in range(50):
        hc = ref.hc_flat_astm(c['surfaceLength'], c['surfaceWidth'], ts_g, c['ambientTemp'], c['windSpeed'])
        hr = ref.hr_radiation(c['emittance'], ts_g, c['ambientTemp'])
        h = hc + hr
        R_cond = delta_m / c['k']
        R_conv = 1.0 / h
        q = (c['mediumTemp'] - c['ambientTemp']) / (R_cond + R_conv)
        Ts = c['ambientTemp'] + q * R_conv
        if abs(Ts - ts_g) < 0.005:
            break
        ts_g = 0.5 * ts_g + 0.5 * Ts
    print(f"  {delta_mm:>6}     |   {Ts_w:>8.3f}    |  {Ts:>8.3f}    (h_w={h_w:.2f}, h_r={h:.2f})")
