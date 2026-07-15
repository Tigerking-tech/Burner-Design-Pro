#!/usr/bin/env python3
"""追踪 ref.solve_flat 在 Z-05 上的真实行为"""
import json
import insulation_reference as ref

with open('insulation_test_cases.json') as f:
    cases = {c['id']: c for c in json.load(f)['cases']}
c = cases['Z-05']

# 模拟 ref.solve_flat 的内部逻辑, 加打印
k = c['k']
tf = c['mediumTemp']
ta = c['ambientTemp']
v = c['windSpeed']
eps = c['emittance']
L = c['surfaceLength']
W = c['surfaceWidth']
dp = ref.dew_point(ta, c['relativeHumidity'])
target = dp + 1
print(f"target={target:.4f}, Tf={tf}, Ta={ta}, is_heating={tf>ta}")

# 复刻 ref.solve_flat
is_heating = tf > ta
lower, upper = 0.01, 1.0
print(f"\n== Bounds search ==")
for i in range(60):
    Ts, q_flux = ref.surface_state_flat(k, tf, ta, upper, 10.0)
    brk = (is_heating and Ts < target) or ((not is_heating) and Ts > target)
    print(f"  iter {i}: upper={upper:.4f}mm, Ts(h=10)={Ts:.3f}, break={brk}")
    if brk:
        break
    upper *= 2
    if upper > 5000:
        break

print(f"\n== Binary search in [{lower}, {upper}] mm ==")
for it in range(30):
    delta = 0.5 * (lower + upper)
    ts_g = ta + 0.5 * (tf - ta)
    for _ in range(50):
        hc = ref.hc_flat_astm(L, W, ts_g, ta, v)
        hr = ref.hr_radiation(eps, ts_g, ta)
        h = hc + hr
        Ts, q_flux = ref.surface_state_flat(k, tf, ta, delta, h)
        if abs(Ts - ts_g) < 0.01:
            break
        ts_g = 0.5 * ts_g + 0.5 * Ts
    if is_heating:
        if Ts > target:
            lower = delta
        else:
            upper = delta
    else:
        if Ts < target:
            lower = delta
        else:
            upper = delta
    brk = abs(Ts - target) < 0.05
    print(f"  iter {it}: delta={delta:.5f}mm, Ts={Ts:.4f}, h={h:.3f}, [{lower:.5f}, {upper:.5f}], break={brk}")
    if brk:
        break

print(f"\nFinal: delta={(lower+upper)/2:.5f}mm")
