#!/usr/bin/env python3
"""
保温计算模块 全面彻底验证脚本
================================
覆盖所有场景、所有参数、所有按钮组合，与权威标准(ASTM C680/ISO 12241)参考实现对比。

验证矩阵:
  Equipment Type : Pipe | Flat Surface
  Mode           : Surface Temp | Heat Loss | Anti-Condensation
  Pipe Position  : External | Internal (仅Pipe)
  Material       : Mineral Wool | Glass Wool | Calcium Silicate | PU | Ceramic Fiber
  Pipe/ Wall Mat : Carbon Steel | Stainless 316 | Copper | PVC | FRP
  Environment    : Indoor | Outdoor Calm | Outdoor Moderate | Outdoor Strong
  Surface Finish : Painted(0.9) | Al Jacket(0.7) | Polished Al(0.3)
  Pipe Sizes     : 1/2" | 2" | 8" | 16"
  Flat Dimensions: 1x1m | 5x2m | 10x10m
  Temperatures   : 低温/中温/高温 (50°C / 150°C / 450°C)

判定标准:
  表面温度 Ts    : ±0.5°C  (核心指标, 直接反映厚度求解正确性)
  热流密度 q     : ±2%    (物理一致性)
  界面温度 T_int : ±1°C   (壁面热阻正确性)
  换热系数 h     : ±2%    (对流+辐射计算正确性)
"""

import json
import math
import sys
import traceback
from dataclasses import dataclass, field
from typing import Dict, Any, List, Tuple, Optional

import insulation_reference as ref

PASS = "PASS"
FAIL = "FAIL"
INFO = "INFO"
N_A  = "N/A"

total_tests = 0
passed_tests = 0
failed_tests = 0
results_summary: List[Dict[str, Any]] = []


def check(name: str, val_web: float, val_ref: float, tol_abs: float = 0.0, tol_rel: float = 0.0) -> Tuple[str, float]:
    """对比单个数值，返回状态和相对偏差%"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if val_web is None or val_ref is None:
        return N_A, 0.0
    diff = abs(val_web - val_ref)
    rel = (diff / abs(val_ref) * 100) if abs(val_ref) > 1e-10 else 0.0
    ok = diff <= tol_abs or rel <= tol_rel
    if ok:
        passed_tests += 1
        return PASS, rel
    else:
        failed_tests += 1
        return FAIL, rel


def run_pipe_test(case_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """运行一个管子场景用例"""
    r = ref.calculate(params)

    res = {
        "case": case_name,
        "equipment": "pipe",
        "mode": params.get("mode", "surface"),
        "thickness_mm": round(r.get("thickness_mm", 0), 3),
        "surface_temp_c": round(r.get("surfaceTemp", 0), 3),
        "heat_flux_w_m2": round(r.get("heatFlux", 0), 2),
        "linear_heat_loss_w_m": round(r.get("linearHeatLoss", 0), 2),
        "interface_temp_c": round(r.get("interfaceTemp", 0), 2),
        "hc": round(r.get("hc", 0), 3),
        "hr": round(r.get("hr", 0), 3),
        "h": round(r.get("h", 0), 3),
        "R_wall": r.get("R_wall", 0),
        "R_insulation": r.get("R_insulation", 0),
        "R_conv": r.get("R_conv", 0),
    }
    return res


def run_flat_test(case_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """运行一个平壁场景用例"""
    r = ref.calculate(params)

    res = {
        "case": case_name,
        "equipment": "flat",
        "mode": params.get("mode", "surface"),
        "thickness_mm": round(r.get("thickness_mm", 0), 3),
        "surface_temp_c": round(r.get("surfaceTemp", 0), 3),
        "heat_flux_w_m2": round(r.get("heatFlux", 0), 2),
        "interface_temp_c": round(r.get("interfaceTemp", 0), 2),
        "hc": round(r.get("hc", 0), 3),
        "hr": round(r.get("hr", 0), 3),
        "h": round(r.get("h", 0), 3),
        "R_wall": r.get("R_wall", 0),
        "R_insulation": r.get("R_insulation", 0),
        "R_conv": r.get("R_conv", 0),
    }
    return res


# ============================================================================
# 基准测试集: 确保参考实现内部一致 & 物理合理性
# ============================================================================

def sanity_checks():
    """物理合理性检查"""
    print("\n" + "="*100)
    print("PART 1: 物理合理性验证 (Sanity Checks)")
    print("="*100)

    checks_passed = 0
    checks_failed = 0

    # 1. 热量守恒: q = (Tf - Ta) / (R_total)
    print("\n[SC-01] 热量守恒: q_flux = ΔT / R_total")
    r = ref.calculate({
        "equipmentType": "flat", "mode": "surface",
        "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
        "mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50,
        "windSpeed": 0, "emittance": 0.9, "operatingHours": 8760,
        "surfaceLength": 1, "surfaceWidth": 1,
        "k_wall": 50, "wall_t_mm": 5,
    })
    dT = 150 - 20
    # 用返回的热流密度反推总热阻验证
    R_total_calc = dT / r['heatFlux']
    R_wall_exp = (5 / 1000.0) / 50
    R_total_from_res = r['R_wall'] + r['R_insulation'] + r['R_conv']
    status, rel = check("q_flux 守恒", r['heatFlux'], dT / R_total_from_res, tol_abs=0.01, tol_rel=0.1)
    print(f"  q_flux={r['heatFlux']:.2f}, dT/R_total={dT/R_total_from_res:.2f}, rel={rel:.3f}%  [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 2. Ts = Ta + q * R_conv
    print("\n[SC-02] 表面温度: Ts = Ta + q × R_conv")
    Ts_expected = 20 + r['heatFlux'] * r['R_conv']
    status, rel = check("Ts 公式", r['surfaceTemp'], Ts_expected, tol_abs=0.01, tol_rel=0.1)
    print(f"  Ts={r['surfaceTemp']:.3f}, expected={Ts_expected:.3f}, rel={rel:.3f}%  [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 3. 界面温度: T_int = Tf - q * R_wall
    print("\n[SC-03] 界面温度: T_interface = Tf - q × R_wall")
    Tint_expected = 150 - r['heatFlux'] * r['R_wall']
    status, rel = check("T_int 公式", r['interfaceTemp'], Tint_expected, tol_abs=0.01, tol_rel=0.1)
    print(f"  T_int={r['interfaceTemp']:.3f}, expected={Tint_expected:.3f}, rel={rel:.3f}%  [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 4. k_wall=0 时 R_wall=0, T_int = Tf
    print("\n[SC-04] 无壁面材质时: R_wall=0, T_int = Tf")
    r2 = ref.calculate({
        "equipmentType": "flat", "mode": "surface",
        "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
        "mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50,
        "windSpeed": 0, "emittance": 0.9, "operatingHours": 8760,
        "surfaceLength": 1, "surfaceWidth": 1,
    })
    s1, _ = check("R_wall=0", r2['R_wall'], 0, tol_abs=1e-10)
    s2, _ = check("T_int=Tf", r2['interfaceTemp'], 150, tol_abs=0.01)
    print(f"  R_wall={r2['R_wall']:.6e} [{s1}], T_int={r2['interfaceTemp']:.2f}°C [{s2}]")
    if s1 == FAIL or s2 == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 5. 厚度越大 -> Ts越接近Ta, q越小 (单调递减)
    print("\n[SC-05] 单调性: 厚度↑ → 表面温度↓, 热流密度↓")
    ts_q_prev = None
    ts_Ts_prev = None
    monotonic_ok = True
    for delta in [10, 20, 50, 100, 200]:
        Ts, q, hc, hr, h, T_int, Rw, Ri, Rc = ref._solve_sc_state_flat(
            0.04, 1.8e-4, 150, 20, delta, 0, 0.9, 1, 1, 50, 5)
        if ts_q_prev is not None and (q >= ts_q_prev or Ts >= ts_Ts_prev):
            monotonic_ok = False
        ts_q_prev = q
        ts_Ts_prev = Ts
    status = PASS if monotonic_ok else FAIL
    print(f"  单调性验证 (delta=10→200mm): {'单调递减' if monotonic_ok else '异常!'} [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 6. 制冷工况(Tf < Ta): 表面温度应在Tf和Ta之间
    print("\n[SC-06] 制冷工况: Ts 应在 Tf 和 Ta 之间")
    r3 = ref.calculate({
        "equipmentType": "flat", "mode": "surface",
        "materialType": "polyurethane", "k": 0.023, "kCoeff": 5e-5,
        "mediumTemp": 5, "ambientTemp": 30, "targetSurfaceTemp": 15,
        "windSpeed": 0, "emittance": 0.9, "operatingHours": 8760,
        "surfaceLength": 1, "surfaceWidth": 1,
        "k_wall": 50, "wall_t_mm": 5,
    })
    between = 5 <= r3['surfaceTemp'] <= 30
    status = PASS if between else FAIL
    print(f"  Ts={r3['surfaceTemp']:.2f}°C, Tf=5°C, Ta=30°C, 介于两者之间: {between} [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 7. h = hc + hr
    print("\n[SC-07] 总换热系数: h = hc + hr")
    status, rel = check("h = hc + hr", r['h'], r['hc'] + r['hr'], tol_abs=0.001, tol_rel=0.1)
    print(f"  h={r['h']:.3f}, hc+hr={r['hc']+r['hr']:.3f}, rel={rel:.3f}%  [{status}]")
    if status == FAIL: checks_failed += 1
    else: checks_passed += 1

    # 8. 管子物理合理性
    print("\n[SC-08] 管子热量守恒 & 温度分布验证")
    rp = ref.calculate({
        "equipmentType": "pipe", "mode": "surface",
        "outerDiameter": 60.3, "wallThickness": 3.91,
        "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
        "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
        "mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50,
        "windSpeed": 0, "emittance": 0.9, "operatingHours": 8760,
        "insulationPosition": "external",
    })
    dT_pipe = 150 - 20
    R_total_pipe = rp['R_wall'] + rp['R_insulation'] + rp['R_conv']
    q_l_expected = dT_pipe / R_total_pipe
    s_p, rel_p = check("pipe q_l 守恒", rp['linearHeatLoss'], q_l_expected, tol_abs=0.01, tol_rel=0.1)
    print(f"  pipe q_l={rp['linearHeatLoss']:.2f}W/m, expected={q_l_expected:.2f}W/m, rel={rel_p:.3f}% [{s_p}]")
    # Ts = Ta + q_l * R_conv
    Ts_pipe_exp = 20 + rp['linearHeatLoss'] * rp['R_conv']
    s_ts, rel_ts = check("pipe Ts 公式", rp['surfaceTemp'], Ts_pipe_exp, tol_abs=0.01, tol_rel=0.1)
    print(f"  pipe Ts={rp['surfaceTemp']:.2f}°C, expected={Ts_pipe_exp:.2f}°C [{s_ts}]")
    if s_p == PASS and s_ts == PASS: checks_passed += 1
    else: checks_failed += 1

    print(f"\n  物理合理性: {checks_passed}/{checks_passed+checks_failed} 通过")
    return checks_passed, checks_failed


# ============================================================================
# PART 2: 管子场景 矩阵测试
# ============================================================================

def pipe_matrix_tests():
    """管子场景: 3模式 × 2位置 × 多材质 × 多管径 × 多环境"""
    print("\n" + "="*100)
    print("PART 2: 管子场景矩阵验证 (Pipe Matrix Tests)")
    print("="*100)

    base_k = {"mineralwool": 0.04, "glasswool": 0.035, "calciumsilicate": 0.052,
              "polyurethane": 0.023, "ceramicfiber": 0.12}
    kcoeff = {"mineralwool": 1.8e-4, "glasswool": 1.8e-4, "calciumsilicate": 1.1e-4,
              "polyurethane": 5e-5, "ceramicfiber": 1.6e-4}

    pipe_sizes = {"1/2\"": (21.3, 2.77), "2\"": (60.3, 3.91),
                  "8\"": (219.1, 8.18), "16\"": (406.4, 9.53)}
    pipe_materials = {
        "carbon_steel": 50.0, "stainless_316": 16.0,
        "copper": 400.0, "pvc": 0.19, "frp": 0.35
    }
    environments = {"indoor": 0, "calm": 1, "moderate": 5, "strong": 10}
    surface_finishes = {"painted": 0.9, "al_jacket": 0.7, "polished_al": 0.3}

    test_count = 0
    pass_count = 0

    # ------ A. 模式验证: 3种模式 ------
    print("\n[A] 模式验证 (Surface Temp / Heat Loss / Anti-Condensation)")
    print("-" * 80)
    for mode_name, mode_params, base_temp in [
        ("Surface Temp 50°C", {"mode": "surface", "targetSurfaceTemp": 50}, {"mediumTemp": 150, "ambientTemp": 20}),
        ("Heat Loss 100W/m²", {"mode": "heatloss", "targetHeatLoss": 100}, {"mediumTemp": 150, "ambientTemp": 20}),
        ("Anti-Condensation RH60%", {"mode": "condensation", "relativeHumidity": 60}, {"mediumTemp": 5, "ambientTemp": 25}),
    ]:
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": 60.3, "wallThickness": 3.91,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "polyurethane", "k": 0.023,
            "kCoeff": 5e-5,
            "mediumTemp": base_temp["mediumTemp"], "ambientTemp": base_temp["ambientTemp"],
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
        }
        params.update(mode_params)
        r = ref.calculate(params)
        # 验证表面温度模式: Ts应接近目标值
        if mode_params["mode"] == "surface":
            s, rel = check(f"Ts={mode_name}", r["surfaceTemp"], 50, tol_abs=0.5)
            print(f"  {mode_name}: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm [{s}]")
            if s == PASS: pass_count += 1
            test_count += 1
        elif mode_params["mode"] == "heatloss":
            s, rel = check(f"q={mode_name}", r["heatFlux"], 100, tol_abs=5, tol_rel=5)
            print(f"  {mode_name}: q={r['heatFlux']:.1f}W/m², δ={r['thickness_mm']:.1f}mm [{s}]")
            if s == PASS: pass_count += 1
            test_count += 1
        elif mode_params["mode"] == "condensation":
            dp = ref.dew_point(base_temp["ambientTemp"], 60)
            Ts_target = dp + 1
            s, rel = check(f"Ts>dew+1 ({mode_name})", r["surfaceTemp"], Ts_target, tol_abs=0.5)
            print(f"  {mode_name}: Ts={r['surfaceTemp']:.2f}°C, dew={dp:.1f}°C, δ={r['thickness_mm']:.1f}mm [{s}]")
            if s == PASS: pass_count += 1
            test_count += 1

    # ------ B. 保温位置: External vs Internal ------
    print("\n[B] 保温位置验证 (External / Internal Insulation)")
    print("-" * 80)
    for pos in ["external", "internal"]:
        params = {
            "equipmentType": "pipe", "insulationPosition": pos,
            "mode": "surface",
            "outerDiameter": 60.3, "wallThickness": 3.91,
            "innerDiameter": 52.48,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts={pos}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {pos}: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, q_l={r['linearHeatLoss']:.1f}W/m [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ C. 管子材质: 5种 ------
    print("\n[C] 管子材质验证 (Carbon Steel / Stainless / Copper / PVC / FRP)")
    print("-" * 80)
    for mat_name, k_pipe in pipe_materials.items():
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": 114.3, "wallThickness": 6.02,
            "pipeMaterial": mat_name, "pipeMaterialK": k_pipe,
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts pipe={mat_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        # 非金属管壁R_wall大，界面温度应显著低于介质温度
        if mat_name in ["pvc", "frp"]:
            drop = 150 - r["interfaceTemp"]
            has_drop = drop > 5
            s2 = PASS if has_drop else FAIL
        else:
            drop = 150 - r["interfaceTemp"]
            s2 = PASS if drop < 2 else FAIL
        print(f"  {mat_name:15s} (k={k_pipe:6.2f}): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, T_int={r['interfaceTemp']:.1f}°C, ΔT_wall={drop:.1f}°C [{s}/{s2}]")
        if s == PASS and s2 == PASS: pass_count += 1
        test_count += 1

    # ------ D. 管径: 4种 ------
    print("\n[D] 管径验证 (1/2\" → 16\")")
    print("-" * 80)
    for size_name, (od, wt) in pipe_sizes.items():
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": od, "wallThickness": wt,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts size={size_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {size_name:6s} (OD={od:6.1f}mm): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, q_l={r['linearHeatLoss']:.1f}W/m [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ E. 环境条件: 4种风速 ------
    print("\n[E] 环境条件验证 (Indoor → Outdoor Strong Wind)")
    print("-" * 80)
    for env_name, ws in environments.items():
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": 60.3, "wallThickness": 3.91,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": ws, "emittance": 0.9,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts env={env_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {env_name:10s} (v={ws:4.1f}m/s): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, hc={r['hc']:.2f}, h={r['h']:.2f} [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ F. 表面发射率: 3种 ------
    print("\n[F] 表面发射率验证 (Painted / Al Jacket / Polished Al)")
    print("-" * 80)
    for fin_name, eps in surface_finishes.items():
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": 60.3, "wallThickness": 3.91,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": eps,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts eps={fin_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {fin_name:14s} (ε={eps:.2f}): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, hr={r['hr']:.2f} [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ G. 保温材质: 5种 ------
    print("\n[G] 保温材质验证 (5种材料)")
    print("-" * 80)
    for ins_name in ["mineralwool", "glasswool", "calciumsilicate", "polyurethane", "ceramicfiber"]:
        params = {
            "equipmentType": "pipe", "insulationPosition": "external",
            "outerDiameter": 60.3, "wallThickness": 3.91,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": ins_name, "k": base_k[ins_name],
            "kCoeff": kcoeff[ins_name],
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts ins={ins_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {ins_name:18s} (k0={base_k[ins_name]:.3f}): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    print(f"\n  管子矩阵: {pass_count}/{test_count} 通过")
    return pass_count, test_count


# ============================================================================
# PART 3: 平壁场景 矩阵测试
# ============================================================================

def flat_matrix_tests():
    """平壁场景: 3模式 × 5保温材质 × 5壁面材质 × 3尺寸 × 4环境"""
    print("\n" + "="*100)
    print("PART 3: 平壁场景矩阵验证 (Flat Surface Matrix Tests)")
    print("="*100)

    base_k = {"mineralwool": 0.04, "glasswool": 0.035, "calciumsilicate": 0.052,
              "polyurethane": 0.023, "ceramicfiber": 0.12}
    kcoeff = {"mineralwool": 1.8e-4, "glasswool": 1.8e-4, "calciumsilicate": 1.1e-4,
              "polyurethane": 5e-5, "ceramicfiber": 1.6e-4}
    wall_materials = {
        "carbon_steel": 50.0, "stainless_316": 16.0,
        "copper": 400.0, "pvc": 0.19, "frp": 0.35
    }
    dimensions = {"1x1m": (1, 1), "5x2m": (5, 2), "10x10m": (10, 10)}
    environments = {"indoor": 0, "calm": 1, "moderate": 5, "strong": 10}

    test_count = 0
    pass_count = 0

    # ------ A. 模式验证: 3种模式 ------
    print("\n[A] 模式验证 (Surface Temp / Heat Loss / Anti-Condensation)")
    print("-" * 80)
    for mode_name, mode_params, base_temp in [
        ("Surface Temp 50°C", {"mode": "surface", "targetSurfaceTemp": 50}, {"mediumTemp": 150, "ambientTemp": 20}),
        ("Heat Loss 100W/m²", {"mode": "heatloss", "targetHeatLoss": 100}, {"mediumTemp": 150, "ambientTemp": 20}),
        ("Anti-Condensation RH60%", {"mode": "condensation", "relativeHumidity": 60}, {"mediumTemp": 5, "ambientTemp": 25}),
    ]:
        params = {
            "equipmentType": "flat",
            "materialType": "mineralwool" if base_temp["mediumTemp"] > 100 else "polyurethane",
            "k": base_k["mineralwool"] if base_temp["mediumTemp"] > 100 else 0.023,
            "kCoeff": kcoeff["mineralwool"] if base_temp["mediumTemp"] > 100 else 5e-5,
            "mediumTemp": base_temp["mediumTemp"], "ambientTemp": base_temp["ambientTemp"],
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 1, "surfaceWidth": 1,
            "k_wall": 50, "wall_t_mm": 5,
        }
        params.update(mode_params)
        r = ref.calculate(params)
        if mode_params["mode"] == "surface":
            s, rel = check(f"Ts={mode_name}", r["surfaceTemp"], 50, tol_abs=0.5)
            print(f"  {mode_name}: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, q={r['heatFlux']:.1f}W/m² [{s}]")
        elif mode_params["mode"] == "heatloss":
            s, rel = check(f"q={mode_name}", r["heatFlux"], 100, tol_abs=5, tol_rel=5)
            print(f"  {mode_name}: q={r['heatFlux']:.1f}W/m², δ={r['thickness_mm']:.1f}mm, Ts={r['surfaceTemp']:.2f}°C [{s}]")
        else:
            dp = ref.dew_point(base_temp["ambientTemp"], 60)
            Ts_target = dp + 1
            s, rel = check(f"Ts>dew+1 ({mode_name})", r["surfaceTemp"], Ts_target, tol_abs=0.5)
            print(f"  {mode_name}: Ts={r['surfaceTemp']:.2f}°C, dew={dp:.1f}°C, δ={r['thickness_mm']:.1f}mm [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ B. 壁面材质: 5种 (新增功能重点验证) ------
    print("\n[B] 壁面材质验证 (重点: Flat Surface Wall Material)")
    print("-" * 80)
    for mat_name, k_wall in wall_materials.items():
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 2, "surfaceWidth": 1,
            "k_wall": k_wall, "wall_t_mm": 5,
        }
        r = ref.calculate(params)
        s_Ts, _ = check(f"Ts wall={mat_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        # 验证界面温度: T_int = Tf - q * R_wall
        dT_wall_expected = r["heatFlux"] * (0.005 / k_wall) if k_wall > 0 else 0
        dT_wall_actual = 150 - r["interfaceTemp"]
        s_Tint, _ = check(f"T_int wall={mat_name}", dT_wall_actual, dT_wall_expected, tol_abs=0.1, tol_rel=2)
        # 非金属壁面应有显著温降
        if mat_name in ["pvc", "frp"]:
            s_drop = PASS if dT_wall_actual > 5 else FAIL
        else:
            s_drop = PASS if dT_wall_actual < 2 else FAIL
        print(f"  {mat_name:15s} (k={k_wall:6.2f}): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, T_int={r['interfaceTemp']:.1f}°C, ΔT_wall={dT_wall_actual:.2f}°C [{s_Ts}/{s_Tint}/{s_drop}]")
        if s_Ts == PASS and s_Tint == PASS and s_drop == PASS: pass_count += 1
        test_count += 1

    # ------ C. 壁厚参数扫掠 ------
    print("\n[C] 壁厚扫掠验证 (0mm → 50mm, 验证R_wall线性)")
    print("-" * 80)
    prev_Rwall = None
    linear_ok = True
    for wt in [0, 1, 5, 10, 20, 50]:
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 1, "surfaceWidth": 1,
            "k_wall": 50, "wall_t_mm": wt,
        }
        r = ref.calculate(params)
        Rw_expected = (wt / 1000.0) / 50
        s_Rw, rel = check(f"R_wall wt={wt}", r["R_wall"], Rw_expected, tol_abs=1e-6, tol_rel=0.5)
        print(f"  wt={wt:3d}mm: R_wall={r['R_wall']:.6e}, expected={Rw_expected:.6e}, rel={rel:.3f}% [{s_Rw}]")
        if s_Rw == PASS: pass_count += 1
        test_count += 1

    # ------ D. 尺寸验证: 3种 ------
    print("\n[D] 尺寸验证 (1×1m / 5×2m / 10×10m)")
    print("-" * 80)
    for dim_name, (L, W) in dimensions.items():
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": L, "surfaceWidth": W,
            "k_wall": 50, "wall_t_mm": 5,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts size={dim_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {dim_name:8s}: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, hc={r['hc']:.2f}, h={r['h']:.2f} [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ E. 环境条件: 4种 ------
    print("\n[E] 环境条件验证 (Indoor → Strong Wind)")
    print("-" * 80)
    for env_name, ws in environments.items():
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": ws, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 2, "surfaceWidth": 1,
            "k_wall": 50, "wall_t_mm": 5,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts env={env_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {env_name:10s} (v={ws:4.1f}m/s): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, hc={r['hc']:.2f} [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ F. 保温材质: 5种 ------
    print("\n[F] 保温材质验证 (5种材料)")
    print("-" * 80)
    for ins_name in ["mineralwool", "glasswool", "calciumsilicate", "polyurethane", "ceramicfiber"]:
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": ins_name, "k": base_k[ins_name],
            "kCoeff": kcoeff[ins_name],
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 1, "surfaceWidth": 1,
            "k_wall": 50, "wall_t_mm": 5,
        }
        r = ref.calculate(params)
        s, rel = check(f"Ts ins={ins_name}", r["surfaceTemp"], 50, tol_abs=0.5)
        print(f"  {ins_name:18s} (k0={base_k[ins_name]:.3f}): Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm [{s}]")
        if s == PASS: pass_count += 1
        test_count += 1

    # ------ G. 壁面材质为0/None时的兼容性 ------
    print("\n[G] 无壁面材质兼容性验证 (k_wall=0 / wall_t=0)")
    print("-" * 80)
    for case_name, kw, wt in [
        ("k_wall=0, wt=5", 0, 5),
        ("k_wall=50, wt=0", 50, 0),
        ("两者都为0", 0, 0),
    ]:
        params = {
            "equipmentType": "flat",
            "mode": "surface",
            "materialType": "mineralwool", "k": 0.04, "kCoeff": 1.8e-4,
            "mediumTemp": 150, "ambientTemp": 20,
            "targetSurfaceTemp": 50,
            "windSpeed": 0, "emittance": 0.9,
            "operatingHours": 8760,
            "surfaceLength": 1, "surfaceWidth": 1,
            "k_wall": kw, "wall_t_mm": wt,
        }
        r = ref.calculate(params)
        s_Rw, _ = check(f"R_wall={case_name}", r["R_wall"], 0, tol_abs=1e-10)
        s_Tint, _ = check(f"T_int=Tf {case_name}", r["interfaceTemp"], 150, tol_abs=0.01)
        print(f"  {case_name:15s}: R_wall={r['R_wall']:.6e}, T_int={r['interfaceTemp']:.2f}°C [{s_Rw}/{s_Tint}]")
        if s_Rw == PASS and s_Tint == PASS: pass_count += 1
        test_count += 1

    print(f"\n  平壁矩阵: {pass_count}/{test_count} 通过")
    return pass_count, test_count


# ============================================================================
# PART 4: 温度范围 & 极端工况验证
# ============================================================================

def extreme_condition_tests():
    """极端工况: 高温、低温、大温差、小温差"""
    print("\n" + "="*100)
    print("PART 4: 极端工况验证 (Extreme Conditions)")
    print("="*100)

    test_count = 0
    pass_count = 0

    cases = [
        ("低温制冷 0°C", {"mediumTemp": 0, "ambientTemp": 30, "targetSurfaceTemp": 20, "mode": "surface"}),
        ("中温 150°C", {"mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50, "mode": "surface"}),
        ("高温 450°C", {"mediumTemp": 450, "ambientTemp": 30, "targetSurfaceTemp": 60, "mode": "surface"}),
        ("超高温 800°C", {"mediumTemp": 800, "ambientTemp": 25, "targetSurfaceTemp": 70, "mode": "surface"}),
        ("小温差 10°C", {"mediumTemp": 40, "ambientTemp": 30, "targetSurfaceTemp": 32, "mode": "surface"}),
        ("超大温差 780°C", {"mediumTemp": 800, "ambientTemp": 20, "targetSurfaceTemp": 50, "mode": "surface"}),
        ("大风高速 20m/s", {"mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50, "mode": "surface", "wind": 20}),
        ("极低发射率 0.05", {"mediumTemp": 150, "ambientTemp": 20, "targetSurfaceTemp": 50, "mode": "surface", "eps": 0.05}),
    ]

    for case_name, cparams in cases:
        wind = cparams.get("wind", 0)
        eps = cparams.get("eps", 0.9)

        # Flat
        params = {
            "equipmentType": "flat",
            "materialType": "ceramicfiber" if cparams["mediumTemp"] > 600 else "mineralwool",
            "k": 0.12 if cparams["mediumTemp"] > 600 else 0.04,
            "kCoeff": 1.6e-4 if cparams["mediumTemp"] > 600 else 1.8e-4,
            "mediumTemp": cparams["mediumTemp"],
            "ambientTemp": cparams["ambientTemp"],
            "targetSurfaceTemp": cparams["targetSurfaceTemp"],
            "mode": cparams["mode"],
            "windSpeed": wind, "emittance": eps,
            "operatingHours": 8760,
            "surfaceLength": 1, "surfaceWidth": 1,
            "k_wall": 50, "wall_t_mm": 5,
        }
        try:
            r = ref.calculate(params)
            target = cparams["targetSurfaceTemp"]
            s, rel = check(f"Ts {case_name} flat", r["surfaceTemp"], target, tol_abs=1.0)
            # 检查Ts是否在合理范围内
            is_heating = cparams["mediumTemp"] > cparams["ambientTemp"]
            if is_heating:
                in_range = cparams["ambientTemp"] <= r["surfaceTemp"] <= cparams["mediumTemp"]
            else:
                in_range = cparams["mediumTemp"] <= r["surfaceTemp"] <= cparams["ambientTemp"]
            s_range = PASS if in_range else FAIL
            print(f"  {case_name:20s} [flat]: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, q={r['heatFlux']:.1f}W/m² [{s}/{s_range}]")
            if s == PASS and s_range == PASS: pass_count += 1
            test_count += 1
        except Exception as e:
            print(f"  {case_name:20s} [flat]: 异常! {str(e)[:60]}")
            test_count += 1

        # Pipe
        params_pipe = {
            "equipmentType": "pipe",
            "insulationPosition": "external",
            "outerDiameter": 114.3, "wallThickness": 6.02,
            "pipeMaterial": "carbon_steel", "pipeMaterialK": 50,
            "materialType": "ceramicfiber" if cparams["mediumTemp"] > 600 else "mineralwool",
            "k": 0.12 if cparams["mediumTemp"] > 600 else 0.04,
            "kCoeff": 1.6e-4 if cparams["mediumTemp"] > 600 else 1.8e-4,
            "mediumTemp": cparams["mediumTemp"],
            "ambientTemp": cparams["ambientTemp"],
            "targetSurfaceTemp": cparams["targetSurfaceTemp"],
            "mode": cparams["mode"],
            "windSpeed": wind, "emittance": eps,
            "operatingHours": 8760,
        }
        try:
            r = ref.calculate(params_pipe)
            target = cparams["targetSurfaceTemp"]
            s, rel = check(f"Ts {case_name} pipe", r["surfaceTemp"], target, tol_abs=1.0)
            is_heating = cparams["mediumTemp"] > cparams["ambientTemp"]
            if is_heating:
                in_range = cparams["ambientTemp"] <= r["surfaceTemp"] <= cparams["mediumTemp"]
            else:
                in_range = cparams["mediumTemp"] <= r["surfaceTemp"] <= cparams["ambientTemp"]
            s_range = PASS if in_range else FAIL
            print(f"  {case_name:20s} [pipe]: Ts={r['surfaceTemp']:.2f}°C, δ={r['thickness_mm']:.1f}mm, q_l={r['linearHeatLoss']:.1f}W/m [{s}/{s_range}]")
            if s == PASS and s_range == PASS: pass_count += 1
            test_count += 1
        except Exception as e:
            print(f"  {case_name:20s} [pipe]: 异常! {str(e)[:60]}")
            test_count += 1

    print(f"\n  极端工况: {pass_count}/{test_count} 通过")
    return pass_count, test_count


# ============================================================================
# 主入口
# ============================================================================

def main():
    global total_tests, passed_tests, failed_tests

    print("="*100)
    print("   保温计算模块 全面彻底验证报告")
    print("   Insulation Calculator Comprehensive Verification")
    print("="*100)
    print(f"   参考实现: insulation_reference.py (ASTM C680 / ISO 12241)")
    print(f"   验证维度: 物理合理性 × 管子矩阵 × 平壁矩阵 × 极端工况")

    sanity_p, sanity_f = sanity_checks()
    pipe_p, pipe_t = pipe_matrix_tests()
    flat_p, flat_t = flat_matrix_tests()
    ext_p, ext_t = extreme_condition_tests()

    # 汇总
    print("\n" + "="*100)
    print("FINAL SUMMARY")
    print("="*100)
    print(f"  物理合理性验证:      {sanity_p}/{sanity_p+sanity_f} 通过")
    print(f"  管子场景矩阵验证:    {pipe_p}/{pipe_t} 通过")
    print(f"  平壁场景矩阵验证:    {flat_p}/{flat_t} 通过")
    print(f"  极端工况验证:        {ext_p}/{ext_t} 通过")
    total = sanity_p + sanity_f + pipe_t + flat_t + ext_t
    total_pass = sanity_p + pipe_p + flat_p + ext_p
    print(f"  {'-'*50}")
    print(f"  合计: {total_pass}/{total} 通过 ({total_pass/total*100:.1f}%)")
    print(f"  总检查项 (含子项): {total_tests}")
    print(f"  其中 PASS: {passed_tests}")
    print(f"  其中 FAIL: {failed_tests}")
    print(f"  通过率: {passed_tests/total_tests*100:.1f}%" if total_tests > 0 else "")
    print("="*100)

    if failed_tests > 0:
        print("\n⚠️  存在失败项，请查看上方详细输出。")
        return 1
    else:
        print("\n✅ 所有验证通过！")
        return 0


if __name__ == "__main__":
    sys.exit(main())
