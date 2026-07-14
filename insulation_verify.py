#!/usr/bin/env python3
"""
保温模块对比校准脚本
====================
将项目 InsulationCalculatorPage.tsx 的计算逻辑 1:1 移植为 Python (webapp_*),
再用 insulation_reference.py 的 ASTM C680 / ISO 12241 参考实现 (ref_*) 计算
同一组测试用例 (insulation_test_cases.json), 逐项比较并输出偏差报告。

用法:
    python3 insulation_verify.py                 # 控制台汇总 + 详细表
    python3 insulation_verify.py --json out.json # 同时导出机器可读结果
    python3 insulation_verify.py --report report.md  # 同时导出 Markdown 报告
"""

import json
import math
import os
import sys
from typing import Dict, Any, Tuple

import insulation_reference as ref


HERE = os.path.dirname(os.path.abspath(__file__))


# ============================================================================
# 1. Web App 计算逻辑 (1:1 移植自 InsulationCalculatorPage.tsx)
#    严禁改动任何公式, 保证与前端行为完全一致。
# ============================================================================
SIGMA = 5.67e-8  # 与项目一致 (注意: 项目用 5.67e-8, 参考 5.670374419e-8)

WEBAPP_STD_THK = [10, 13, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]


def webapp_dew_point(temp: float, humidity: float) -> float:
    a = 17.62
    b = 243.12
    gamma = (a * temp) / (b + temp) + math.log(humidity / 100)
    return (b * gamma) / (a - gamma)


def webapp_ts_for_thickness(D1: float, k: float, Tf: float, Ta: float,
                            delta: float, h: float):
    """delta, D1 单位: mm;  与项目 calculateTsForThickness 完全一致"""
    r1 = D1 / 2000.0          # m
    r2 = r1 + delta           # m  (项目: r1 + delta, delta 已是 m)
    # 注意: 项目把 delta 当作 m 传入, 这里我们统一传 mm, 内部转换
    r2 = r1 + delta / 1000.0
    R_cond = math.log(r2 / r1) / (2 * math.pi * k)
    R_conv = 1.0 / (h * 2 * math.pi * r2)
    q_linear = (Tf - Ta) / (R_cond + R_conv)
    Ts = Ta + q_linear * R_conv
    return Ts, q_linear


def webapp_find_pipe_bounds(D1, k, Tf, Ta, target, h, calc_mode):
    lower = 0.0001  # 0.1 mm  (项目用 m, 这里我们用 mm 保持一致)
    upper = 0.001   # 1 mm
    # 项目里 lower/upper 是 m, 这里改为 mm
    lower = 0.1     # mm
    upper = 1.0     # mm
    is_heating = Tf > Ta
    if calc_mode in ('surface', 'condensation'):
        if is_heating:
            while True:
                Ts, _ = webapp_ts_for_thickness(D1, k, Tf, Ta, upper, h)
                if Ts < target:
                    break
                upper *= 2
                if upper > 5000:
                    break
        else:
            while True:
                Ts, _ = webapp_ts_for_thickness(D1, k, Tf, Ta, upper, h)
                if Ts > target:
                    break
                upper *= 2
                if upper > 5000:
                    break
    else:
        while True:
            _, q_linear = webapp_ts_for_thickness(D1, k, Tf, Ta, upper, h)
            r2 = (D1 / 2000.0) + upper / 1000.0
            q_flux = q_linear / (2 * math.pi * r2)
            if q_flux < target:
                break
            upper *= 2
            if upper > 5000:
                break
    return lower, upper


def webapp_calc_pipe_thickness(D1, k, Tf, Ta, target, h, calc_mode):
    lower, upper = webapp_find_pipe_bounds(D1, k, Tf, Ta, target, h, calc_mode)
    iterations = 0
    max_iter = 100
    is_heating = Tf > Ta
    while iterations < max_iter:
        delta = (lower + upper) / 2
        Ts, q_linear = webapp_ts_for_thickness(D1, k, Tf, Ta, delta, h)
        r2 = (D1 / 2000.0) + delta / 1000.0
        q_flux = q_linear / (2 * math.pi * r2)
        if calc_mode in ('surface', 'condensation'):
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
            if abs(Ts - target) < 0.1:
                break
        else:
            if q_flux > target:
                lower = delta
            else:
                upper = delta
            if abs(q_flux - target) < 1:
                break
        iterations += 1
    final_delta = (lower + upper) / 2
    Ts, q_linear = webapp_ts_for_thickness(D1, k, Tf, Ta, final_delta, h)
    r2 = (D1 / 2000.0) + final_delta / 1000.0
    q_flux = q_linear / (2 * math.pi * r2)
    return {
        'thickness_mm': final_delta,         # 与项目 thickness = finalDelta*1000 对齐
        'surfaceTemp': Ts,
        'heatFlux': q_flux,
        'linearHeatLoss': q_linear,
    }


def webapp_calc_flat_thickness(k, Tf, Ta, target, h, calc_mode):
    lower = 1.0     # mm  (项目: 0.001 m)
    upper = 1000.0  # mm  (项目: 1.0 m)
    iterations = 0
    max_iter = 100
    is_heating = Tf > Ta
    while iterations < max_iter:
        delta = (lower + upper) / 2
        delta_m = delta / 1000.0
        R_cond = delta_m / k
        R_conv = 1.0 / h
        q_flux = (Tf - Ta) / (R_cond + R_conv)
        Ts = Ta + q_flux * R_conv
        if calc_mode in ('surface', 'condensation'):
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
            if abs(Ts - target) < 0.1:
                break
        else:
            if q_flux > target:
                lower = delta
            else:
                upper = delta
            if abs(q_flux - target) < 1:
                break
        iterations += 1
    final_delta = (lower + upper) / 2
    delta_m = final_delta / 1000.0
    R_cond = delta_m / k
    R_conv = 1.0 / h
    q_flux = (Tf - Ta) / (R_cond + R_conv)
    Ts = Ta + q_flux * R_conv
    return {
        'thickness_mm': final_delta,
        'surfaceTemp': Ts,
        'heatFlux': q_flux,
    }


def webapp_standard_thickness(calculated: float) -> float:
    for t in WEBAPP_STD_THK:
        if t >= calculated:
            return t
    return WEBAPP_STD_THK[-1]


def webapp_calculate(case: Dict[str, Any]) -> Dict[str, Any]:
    """完全对标 handleCalculate()"""
    k = case['k']
    # 风/环境 → hc  (项目: hc = 4 + 7*sqrt(v))
    v = case['windSpeed']
    hc_val = 4 + 7 * math.sqrt(max(v, 0))
    epsilon = case['emittance']
    Ts_K = case.get('_target_for_hr', case.get('targetSurfaceTemp', 50)) + 273.15
    Ta_K = case['ambientTemp'] + 273.15
    # 注意: 项目用 targetSurfaceTemp 估 hr, 但实际 Ts 由厚度决定; 这里复刻同样行为
    hr_val = epsilon * SIGMA * (Ts_K ** 4 - Ta_K ** 4) / (Ts_K - Ta_K) \
        if abs(Ts_K - Ta_K) > 1e-6 else 4 * epsilon * SIGMA * Ts_K ** 3
    h = hc_val + hr_val

    equip = case['equipmentType']
    mode = case['mode']
    if mode == 'condensation':
        target = webapp_dew_point(case['ambientTemp'], case['relativeHumidity']) + 1
        dp = webapp_dew_point(case['ambientTemp'], case['relativeHumidity'])
    elif mode == 'surface':
        target = case['targetSurfaceTemp']
        dp = None
    else:
        target = case['targetHeatLoss']
        dp = None

    if equip == 'pipe':
        calc_mode = 'surface' if mode in ('surface', 'condensation') else 'heatloss'
        r = webapp_calc_pipe_thickness(case['outerDiameter'], k, case['mediumTemp'],
                                       case['ambientTemp'], target, h, calc_mode)
        annual = r['linearHeatLoss'] * case['operatingHours'] / 1000.0
        return {
            'thickness_mm': r['thickness_mm'],
            'standardThickness': webapp_standard_thickness(r['thickness_mm']),
            'surfaceTemp': r['surfaceTemp'],
            'heatFlux': r['heatFlux'],
            'linearHeatLoss': r['linearHeatLoss'],
            'annualHeatLoss': annual,
            'dewPoint': dp,
            'hc': hc_val, 'hr': hr_val, 'h': h,
        }
    else:
        calc_mode = 'surface' if mode in ('surface', 'condensation') else 'heatloss'
        r = webapp_calc_flat_thickness(k, case['mediumTemp'], case['ambientTemp'],
                                       target, h, calc_mode)
        area = case['surfaceLength'] * case['surfaceWidth']
        heat_loss = r['heatFlux'] * area
        annual = heat_loss * case['operatingHours'] / 1000.0
        return {
            'thickness_mm': r['thickness_mm'],
            'standardThickness': webapp_standard_thickness(r['thickness_mm']),
            'surfaceTemp': r['surfaceTemp'],
            'heatFlux': r['heatFlux'],
            'linearHeatLoss': None,
            'annualHeatLoss': annual,
            'dewPoint': dp,
            'hc': hc_val, 'hr': hr_val, 'h': h,
        }


# ============================================================================
# 2. 偏差统计
# ============================================================================
def rel_err(a: float, b: float) -> float:
    if a is None or b is None:
        return float('nan')
    if abs(b) < 1e-9:
        return 0.0 if abs(a) < 1e-9 else float('inf')
    return (a - b) / abs(b) * 100.0


def abs_err(a: float, b: float) -> float:
    if a is None or b is None:
        return float('nan')
    return a - b


# 容差 (按输出量分别设定)
TOLERANCES = {
    # 输出量: (相对容差%, 绝对容差, 主要判据 'rel'/'abs')
    'thickness_mm':     (10.0, 5.0,   'rel'),   # 厚度 10% 或 5mm
    'surfaceTemp':      (5.0,  2.0,   'rel'),   # 表面温度 5% 或 2°C
    'heatFlux':         (15.0, 10.0,  'rel'),   # 热流 15% 或 10 W/m²
    'linearHeatLoss':   (15.0, 10.0,  'rel'),
    'annualHeatLoss':   (15.0, 50.0,  'rel'),
    'dewPoint':         (0.5,  0.5,   'abs'),   # 露点 0.5°C (公式应完全一致)
    'hc':               (25.0, 2.0,   'rel'),   # hc 简化 vs 关联式, 容差大
    'hr':               (5.0,  0.5,   'rel'),
    'h':                (20.0, 2.0,   'rel'),
}


def _judge(key: str, webapp_v: float, ref_v: float) -> Tuple[str, float, float]:
    if webapp_v is None or ref_v is None:
        return ('N/A', float('nan'), float('nan'))
    rel, absv, judg = TOLERANCES[key]
    re = rel_err(webapp_v, ref_v)
    ae = abs_err(webapp_v, ref_v)
    if judg == 'rel':
        ok = (abs(re) <= rel) or (abs(ae) <= absv)
    else:
        ok = abs(ae) <= absv
    return ('PASS' if ok else 'FAIL', re, ae)


# ============================================================================
# 3. 主流程
# ============================================================================
def load_cases(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['cases']


def run_one(case: Dict[str, Any]) -> Dict[str, Any]:
    webapp = webapp_calculate(case)
    refer = ref.calculate(case)
    keys = ['thickness_mm', 'standardThickness', 'surfaceTemp', 'heatFlux',
            'linearHeatLoss', 'annualHeatLoss', 'dewPoint', 'hc', 'hr', 'h']
    diffs = {}
    for key in keys:
        wv = webapp.get(key)
        rv = refer.get(key)
        if key in TOLERANCES:
            status, re, ae = _judge(key, wv, rv)
            diffs[key] = {'webapp': wv, 'ref': rv, 'rel_err_%': re,
                          'abs_err': ae, 'status': status}
        else:
            # standardThickness: 仅记录差异不判据
            diffs[key] = {'webapp': wv, 'ref': rv,
                          'rel_err_%': rel_err(wv, rv) if (wv is not None and rv is not None) else float('nan'),
                          'abs_err': (wv - rv) if (wv is not None and rv is not None) else float('nan'),
                          'status': 'INFO'}
    return {'webapp': webapp, 'ref': refer, 'diffs': diffs}


def fmt(v, w=10, p=3):
    if v is None:
        return f"{'N/A':>{w}}"
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return f"{'inf':>{w}}"
    return f"{v:>{w}.{p}f}"


def print_detail(results):
    header = f"{'ID':<8}{'Group':<20}{'Varies':<28}{'Metric':<14}{'WebApp':>10}{'Reference':>10}{'RelErr%':>9}{'Status':>7}"
    print('=' * len(header))
    print('保温模块对比校准  Web App  vs  ASTM C680 / ISO 12241 参考')
    print('=' * len(header))
    for r in results:
        c = r['case']
        print(f"\n[{c['id']}] {c['group']}  varies={c['varies']}")
        for key, d in r['diffs'].items():
            print(f"   {key:<16}{fmt(d['webapp']):>12}{fmt(d['ref']):>12}"
                  f"{fmt(d['rel_err_%'], 9, 2):>11}{d['status']:>8}")


def print_summary(results):
    print('\n' + '=' * 78)
    print('汇总 / Summary')
    print('=' * 78)
    total = 0
    passed = 0
    failed = 0
    by_group = {}
    metric_stats = {}
    for r in results:
        g = r['case']['group']
        by_group.setdefault(g, {'pass': 0, 'fail': 0, 'na': 0})
        for key, d in r['diffs'].items():
            if key not in TOLERANCES:
                continue
            total += 1
            st = d['status']
            if st == 'PASS':
                passed += 1
                by_group[g]['pass'] += 1
            elif st == 'FAIL':
                failed += 1
                by_group[g]['fail'] += 1
            else:
                by_group[g]['na'] += 1
            # 收集各指标最大相对偏差
            re = d['rel_err_%']
            if not (math.isnan(re) or math.isinf(re)):
                ms = metric_stats.setdefault(key, {'max': 0.0, 'min': 0.0, 'sum': 0.0, 'n': 0})
                ms['max'] = max(ms['max'], re)
                ms['min'] = min(ms['min'], re)
                ms['sum'] += abs(re)
                ms['n'] += 1

    print(f"  总判据点数: {total}   PASS: {passed}   FAIL: {failed}   "
          f"通过率: {passed/total*100:.1f}%" if total else "  无判据点")
    print(f"\n  {'Group':<22}{'PASS':>6}{'FAIL':>6}{'N/A':>6}")
    for g in sorted(by_group):
        s = by_group[g]
        print(f"  {g:<22}{s['pass']:>6}{s['fail']:>6}{s['na']:>6}")

    print(f"\n  {'Metric':<18}{'MaxRelErr%':>12}{'MinRelErr%':>12}{'Mean|RelErr|%':>16}")
    for m in sorted(metric_stats):
        s = metric_stats[m]
        print(f"  {m:<18}{s['max']:>12.2f}{s['min']:>12.2f}{s['sum']/s['n']:>16.2f}")


def main():
    args = sys.argv[1:]
    json_out = None
    report_out = None
    for i, a in enumerate(args):
        if a == '--json' and i + 1 < len(args):
            json_out = args[i + 1]
        if a == '--report' and i + 1 < len(args):
            report_out = args[i + 1]

    cases = load_cases(os.path.join(HERE, 'insulation_test_cases.json'))
    results = []
    for c in cases:
        r = run_one(c)
        r['case'] = c
        results.append(r)

    print_detail(results)
    print_summary(results)

    if json_out:
        serializable = []
        for r in results:
            serializable.append({
                'case_id': r['case']['id'],
                'group': r['case']['group'],
                'varies': r['case']['varies'],
                'inputs': {k: v for k, v in r['case'].items() if not k.startswith('_')},
                'webapp': r['webapp'],
                'reference': r['ref'],
                'diffs': r['diffs'],
            })
        with open(json_out, 'w', encoding='utf-8') as f:
            json.dump(serializable, f, ensure_ascii=False, indent=2)
        print(f"\n[已导出机器可读结果] {json_out}")

    if report_out:
        write_markdown_report(report_out, results)
        print(f"[已导出 Markdown 报告] {report_out}")


def write_markdown_report(path, results):
    total = passed = failed = 0
    metric_stats = {}
    for r in results:
        for key, d in r['diffs'].items():
            if key not in TOLERANCES:
                continue
            total += 1
            if d['status'] == 'PASS':
                passed += 1
            elif d['status'] == 'FAIL':
                failed += 1
            re = d['rel_err_%']
            if not (math.isnan(re) or math.isinf(re)):
                ms = metric_stats.setdefault(key, {'max': 0.0, 'min': 0.0, 'sum': 0.0, 'n': 0})
                ms['max'] = max(ms['max'], re)
                ms['min'] = min(ms['min'], re)
                ms['sum'] += abs(re)
                ms['n'] += 1
    rate = passed / total * 100 if total else 0

    lines = []
    lines.append('# 保温模块对比校准报告\n')
    lines.append('**参考基准**: ASTM C680 / ISO 12241 参考实现 (`insulation_reference.py`)\n')
    lines.append('**被测对象**: `InsulationCalculatorPage.tsx` 计算逻辑 (1:1 Python 移植)\n')
    lines.append(f'**测试用例数**: {len(results)}   **判据点**: {total}   '
                 f'**通过**: {passed}   **失败**: {failed}   **通过率**: {rate:.1f}%\n')
    lines.append('\n## 1. 指标偏差统计\n')
    lines.append('| 指标 | 最大相对偏差% | 最小相对偏差% | 平均|相对偏差|% | 容差% |')
    lines.append('|---|---|---|---|---|')
    for m in sorted(metric_stats):
        s = metric_stats[m]
        tol = TOLERANCES.get(m, ('-', '-', '-'))
        lines.append(f"| {m} | {s['max']:.2f} | {s['min']:.2f} | {s['sum']/s['n']:.2f} | {tol[0]} |")

    lines.append('\n## 2. 逐用例详情\n')
    for r in results:
        c = r['case']
        lines.append(f"### [{c['id']}] {c['group']} — {c['varies']}\n")
        lines.append('| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |')
        lines.append('|---|---|---|---|---|---|')
        for key, d in r['diffs'].items():
            wv = d['webapp']; rv = d['ref']; re = d['rel_err_%']; ae = d['abs_err']
            wv_s = f"{wv:.3f}" if isinstance(wv, float) and not (math.isnan(wv) or math.isinf(wv)) else str(wv)
            rv_s = f"{rv:.3f}" if isinstance(rv, float) and not (math.isnan(rv) or math.isinf(rv)) else str(rv)
            re_s = f"{re:.2f}" if isinstance(re, float) and not (math.isnan(re) or math.isinf(re)) else '—'
            ae_s = f"{ae:.3f}" if isinstance(ae, float) and not (math.isnan(ae) or math.isinf(ae)) else '—'
            lines.append(f"| {key} | {wv_s} | {rv_s} | {re_s} | {ae_s} | {d['status']} |")
        lines.append('')

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    main()
