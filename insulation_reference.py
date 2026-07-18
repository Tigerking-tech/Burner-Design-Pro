#!/usr/bin/env python3
"""
保温厚度计算参考实现 (Reference Implementation)
================================================
对标权威标准:
  - ASTM C680  : Standard Practice for Estimate of the Heat Gain or Loss and the
                 Surface Temperatures of Insulated Flat, Cylindrical, and Spherical
                 Systems by Use of Computer Programs
  - ISO 12241  : Thermal insulation for building equipment and industrial installations
                 - Calculation rules

本模块作为项目 InsulationCalculatorPage.tsx 的"黄金参考"(golden reference),
角色等同于火焰计算模块中的 Cantera。

物理模型 (与项目页面一致的部分):
  圆柱 (pipe, 单位长度):
      R_cond = ln(r2/r1) / (2*pi*k)        [m·K/W, per metre]
      R_conv = 1 / (h * 2*pi*r2)            [m·K/W, per metre]
      q_l    = (Tf - Ta) / (R_cond + R_conv)[W/m]
      q_flux = q_l / (2*pi*r2)              [W/m^2]
      Ts     = Ta + q_l * R_conv            [°C]

  平壁 (flat):
      R_cond = delta / k
      R_conv = 1 / h
      q_flux = (Tf - Ta) / (R_cond + R_conv)
      Ts     = Ta + q_flux * R_conv

辐射换热系数 (与项目一致):
      h_r = epsilon * sigma * (Ts_K^4 - Ta_K^4) / (Ts_K - Ta_K)

对流换热系数 h_c:
  项目页面使用简化 Jurges 类公式:  h_c = 4 + 7*sqrt(v)
  本参考实现 ASTM C680 推荐的混合对流关联式 (横向冲刷水平圆管/垂直平壁):
      自然对流 (Churchill-Chu, 水平圆柱):
          Ra = g*beta*(Ts-Ta)*D^3 / (nu*alpha)
          Nu_nat = 0.36 + 0.518*Ra^0.25 / (1 + (0.559/Pr)^0.5625)^0.45
      强制对流 (Churchill-Bernstein, 横掠圆柱):
          Re = v*D/nu
          Nu_for = 0.3 + 0.62*Re^0.5*Pr^0.33 / (1+(0.4/Pr)^0.67)^0.25
                  * (1 + 0.07*Re^0.6)^0.05
      混合对流:  Nu = (Nu_nat^3.5 + Nu_for^3.5)^(1/3.5)
      h_c = Nu * k_air / D    (圆柱)
      h_c = Nu * k_air / L    (平壁, 特征长度 L = 面积/周长)

空气物性 (温度拟合, ASTM C680 附录, T_mean = (Ts+Ta)/2, °C):
      k_air  = 2.421e-3 + 7.8e-5*T - 1.4e-8*T^2          [W/m·K]
      nu     = 1.334e-5 + 9.0e-8*T                        [m^2/s]
      alpha  = 1.887e-5 + 1.26e-7*T                       [m^2/s]
      Pr     = 0.71
      beta   = 1/(T_mean + 273.15)
"""

import math

SIGMA = 5.670374419e-8  # Stefan-Boltzmann [W/m^2·K^4]
G = 9.81                 # 重力加速度 [m/s^2]


# ---------------------------------------------------------------------------
# 管子材质库 (对标 3E Plus "Base Metal / Pipe Material")
# k 单位 W/m·K, 取常温~中温典型值;  maxTemp 为材质长期使用上限 [°C]
# ---------------------------------------------------------------------------
PIPE_MATERIALS = {
    'carbon_steel':   {'name': 'Carbon Steel',         'k': 50.0,  'maxTemp': 540},
    'stainless_316':  {'name': 'Stainless Steel 316',  'k': 16.0,  'maxTemp': 815},
    'stainless_304':  {'name': 'Stainless Steel 304',  'k': 16.2,  'maxTemp': 815},
    'copper':         {'name': 'Copper',               'k': 400.0, 'maxTemp': 200},
    'aluminum':       {'name': 'Aluminum',             'k': 200.0, 'maxTemp': 200},
    'pvc':            {'name': 'PVC',                  'k': 0.19,  'maxTemp': 60},
    'frp':            {'name': 'FRP (Glass Composite)','k': 0.35,  'maxTemp': 120},
    'custom':         {'name': 'Custom',               'k': 50.0,  'maxTemp': 9999},
}


# ---------------------------------------------------------------------------
# 空气物性
# ---------------------------------------------------------------------------
def air_properties(t_mean_c: float):
    """返回 (k_air, nu, alpha, Pr, beta).  ASTM C680 附录拟合, T_mean 单位 °C"""
    # 注意: 系数 0.02421 而非 2.421e-3 (早期笔误导致 hc 偏低约 5 倍)
    k_air = 0.02421 + 7.8e-5 * t_mean_c - 1.4e-8 * t_mean_c ** 2   # W/m·K
    nu = 1.334e-5 + 9.0e-8 * t_mean_c                              # m^2/s
    alpha = 1.887e-5 + 1.26e-7 * t_mean_c                          # m^2/s
    Pr = 0.71
    beta = 1.0 / (t_mean_c + 273.15)
    return k_air, nu, alpha, Pr, beta


# ---------------------------------------------------------------------------
# 对流换热系数  (ASTM C680 关联式)
# ---------------------------------------------------------------------------
def hc_cylinder_astm(d_m: float, ts_c: float, ta_c: float, v: float) -> float:
    """水平圆柱混合对流 h_c [W/m^2·K]"""
    t_mean = (ts_c + ta_c) / 2
    k_air, nu, alpha, Pr, beta = air_properties(t_mean)
    d = max(d_m, 1e-3)
    dT = abs(ts_c - ta_c)

    # 自然对流 (Churchill-Chu)
    Ra = G * beta * dT * d ** 3 / (nu * alpha) if dT > 1e-6 else 0.0
    Nu_nat = (0.36 + 0.518 * Ra ** 0.25 /
              (1 + (0.559 / Pr) ** 0.5625) ** 0.45) if Ra > 0 else 0.36

    # 强制对流 (Churchill-Bernstein)
    Re = v * d / nu
    if Re > 1e-3:
        Nu_for = (0.3 + 0.62 * Re ** 0.5 * Pr ** (1.0 / 3) /
                  (1 + (0.4 / Pr) ** (2.0 / 3)) ** 0.25 *
                  (1 + 0.07 * Re ** 0.6) ** 0.05)
    else:
        Nu_for = 0.0

    # 混合对流
    Nu = (Nu_nat ** 3.5 + Nu_for ** 3.5) ** (1.0 / 3.5) if (Nu_nat + Nu_for) > 0 else 0.36
    return max(Nu * k_air / d, 0.5)


def hc_flat_astm(length_m: float, width_m: float, ts_c: float, ta_c: float, v: float,
                 vertical: bool = False) -> float:
    """平壁混合对流 h_c [W/m^2·K];  特征长度 L = 面积/周长 (水平板)"""
    t_mean = (ts_c + ta_c) / 2
    k_air, nu, alpha, Pr, beta = air_properties(t_mean)
    area = length_m * width_m
    perim = 2 * (length_m + width_m)
    L = area / perim if perim > 0 else 1.0
    dT = abs(ts_c - ta_c)

    Ra = G * beta * dT * L ** 3 / (nu * alpha) if dT > 1e-6 else 0.0
    # 水平板热面朝上/冷面朝下
    if Ra > 0:
        Nu_nat = 0.15 * Ra ** (1.0 / 3) if Ra > 1e7 else 0.59 * Ra ** 0.25
    else:
        Nu_nat = 0.5

    Re = v * L / nu
    if Re > 1e-3:
        # 平板外掠 (层流段+湍流段混合, 简化)
        Nu_for = 0.664 * Re ** 0.5 * Pr ** (1.0 / 3) + 0.037 * Re ** 0.8 * Pr ** (1.0 / 3)
    else:
        Nu_for = 0.0

    Nu = (Nu_nat ** 3.5 + Nu_for ** 3.5) ** (1.0 / 3.5) if (Nu_nat + Nu_for) > 0 else Nu_nat
    return max(Nu * k_air / L, 0.5)


def hr_radiation(epsilon: float, ts_c: float, ta_c: float) -> float:
    """辐射换热系数 h_r [W/m^2·K]"""
    Ts = ts_c + 273.15
    Ta = ta_c + 273.15
    if abs(Ts - Ta) < 1e-6:
        # 极限情形:  4 * eps * sigma * T^3
        return 4 * epsilon * SIGMA * Ts ** 3
    return epsilon * SIGMA * (Ts ** 4 - Ta ** 4) / (Ts - Ta)


# ---------------------------------------------------------------------------
# 露点 (Magnus 公式, 与项目一致)
# ---------------------------------------------------------------------------
def dew_point(t_c: float, rh: float) -> float:
    a = 17.62
    b = 243.12
    gamma = (a * t_c) / (b + t_c) + math.log(rh / 100.0)
    return (b * gamma) / (a - gamma)


# ---------------------------------------------------------------------------
# 表面温度求解 (给定厚度)
#   position='external': D1=管道外径, 保温在外;  热流链 Tf→壁→保温→环境
#   position='internal': D1=管道内径, 保温在内;  热流链 Tf→保温→壁→环境
#   k_pipe=0 时跳过 R_wall (兼容旧行为)
# ---------------------------------------------------------------------------
def surface_state_pipe(d1_mm: float, k_ins: float, tf: float, ta: float,
                       delta_mm: float, h: float,
                       position: str = 'external',
                       k_pipe: float = 0.0, wall_t_mm: float = 0.0):
    """给定保温厚度求表面温度、热流、线热损失、界面温度"""
    delta = delta_mm / 1000.0  # [m]
    if position == 'external':
        # 保温在管道外侧, 散热面在保温外表面
        r_inner_pipe = (d1_mm - 2 * wall_t_mm) / 2000.0   # [m] 管内径
        r_outer_pipe = d1_mm / 2000.0                      # [m] 管外径 = 保温内径
        r_outer_ins  = r_outer_pipe + delta                # [m] 保温外径 = 散热半径
        r_surface    = r_outer_ins
        # 热阻链: R_wall + R_ins + R_conv (顺序由内向外)
        R_wall = (math.log(r_outer_pipe / r_inner_pipe) / (2 * math.pi * k_pipe)
                  if (k_pipe > 0 and wall_t_mm > 0 and r_inner_pipe > 0) else 0.0)
        R_ins  = math.log(r_outer_ins / r_outer_pipe) / (2 * math.pi * k_ins)
        R_conv = 1.0 / (h * 2 * math.pi * r_surface)
        q_l = (tf - ta) / (R_wall + R_ins + R_conv)
        # 界面温度 = 管壁外表面 = 保温内表面
        T_interface = tf - q_l * R_wall
        Ts = ta + q_l * R_conv
        q_flux = q_l / (2 * math.pi * r_surface)
    else:
        # 内保温: D1=管道内径, 保温向管中心延伸, 散热面在管道外表面
        r_inner_pipe = d1_mm / 2000.0                      # [m] 管内径 = 保温外径
        r_outer_pipe = (d1_mm + 2 * wall_t_mm) / 2000.0    # [m] 管外径 = 散热半径
        r_inner_ins  = r_inner_pipe - delta                # [m] 保温内径
        if r_inner_ins <= 0:
            r_inner_ins = 1e-6
        r_surface    = r_outer_pipe
        # 热阻链: R_ins + R_wall + R_conv (顺序由内向外)
        R_ins  = math.log(r_inner_pipe / r_inner_ins) / (2 * math.pi * k_ins)
        R_wall = (math.log(r_outer_pipe / r_inner_pipe) / (2 * math.pi * k_pipe)
                  if (k_pipe > 0 and wall_t_mm > 0) else 0.0)
        R_conv = 1.0 / (h * 2 * math.pi * r_surface)
        q_l = (tf - ta) / (R_ins + R_wall + R_conv)
        # 界面温度 = 保温外表面 = 管壁内表面
        T_interface = tf - q_l * R_ins
        Ts = ta + q_l * R_conv
        q_flux = q_l / (2 * math.pi * r_surface)
    return Ts, q_flux, q_l, T_interface, R_wall, R_ins, R_conv


def surface_state_flat(k: float, tf: float, ta: float, delta_mm: float, h: float, k_wall: float = 0, wall_t_mm: float = 0):
    delta = delta_mm / 1000.0
    R_cond = delta / k
    R_conv = 1.0 / h
    if k_wall > 0 and wall_t_mm > 0:
        R_wall = (wall_t_mm / 1000.0) / k_wall
    else:
        R_wall = 0
    q_flux = (tf - ta) / (R_wall + R_cond + R_conv)
    Ts = ta + q_flux * R_conv
    T_int = tf - q_flux * R_wall
    return Ts, q_flux, T_int, R_wall, R_cond, R_conv


# ---------------------------------------------------------------------------
# 厚度求解 (二分法, 与项目相同的迭代结构, 但 h 使用 ASTM C680 自洽迭代)
# ---------------------------------------------------------------------------
def get_k_temp(baseK, kCoeff, Tf, Ts):
    T_mean = (Tf + Ts) / 2
    return baseK + kCoeff * T_mean + 5.6e-7 * T_mean * T_mean

def _solve_sc_state_pipe(d1_mm, baseK, kCoeff, tf, ta, delta_mm, v, epsilon,
                         position='external', k_pipe=0.0, wall_t_mm=0.0):
    """圆柱自洽 Ts↔h 状态 (内部辅助, 给 solve_pipe 的 bounds 搜索和二分搜索共用)"""
    is_heating = tf > ta
    ts_guess = ta + 0.5 * (tf - ta)
    for _ in range(30):
        k = get_k_temp(baseK, kCoeff, tf, ts_guess)
        # 散热面直径: 外保温=保温外径, 内保温=管道外径
        d_surface = (d1_mm + 2 * delta_mm) if position == 'external' else (d1_mm + 2 * wall_t_mm)
        hc = hc_cylinder_astm(d_surface / 1000.0, ts_guess, ta, v)
        hr = hr_radiation(epsilon, ts_guess, ta)
        h = hc + hr
        Ts, q_flux, q_l, T_int, R_wall, R_ins, R_conv = surface_state_pipe(
            d1_mm, k, tf, ta, delta_mm, h, position, k_pipe, wall_t_mm)
        if abs(Ts - ts_guess) < 0.01:
            break
        ts_guess = 0.5 * ts_guess + 0.5 * Ts
    return Ts, q_flux, q_l, hc, hr, h, T_int, R_wall, R_ins, R_conv


def solve_pipe(d1_mm: float, baseK: float, kCoeff: float, tf: float, ta: float, target: float,
               mode: str, v: float, epsilon: float,
               length_m: float = 1.0, width_m: float = 1.0,
               position: str = 'external', k_pipe: float = 0.0, wall_t_mm: float = 0.0):
    """mode ∈ {'surface','heatloss','condensation'};  返回 dict"""
    is_heating = tf > ta
    lower, upper = 0.01, 1.0   # mm
    # 找上界 (用自洽 h, 而非固定 h=10, 与 webapp 一致)
    for _ in range(60):
        Ts, q_flux, q_l, _, _, _, _, _, _, _ = _solve_sc_state_pipe(
            d1_mm, baseK, kCoeff, tf, ta, upper, v, epsilon, position, k_pipe, wall_t_mm)
        if mode in ('surface', 'condensation'):
            if (is_heating and Ts < target) or ((not is_heating) and Ts > target):
                break
        else:
            if q_flux < target:
                break
        upper *= 2
        if upper > 5000:
            break

    converged_delta = None
    for _ in range(200):
        delta = 0.5 * (lower + upper)
        Ts, q_flux, q_l, hc, hr, h, T_int, R_wall, R_ins, R_conv = _solve_sc_state_pipe(
            d1_mm, baseK, kCoeff, tf, ta, delta, v, epsilon, position, k_pipe, wall_t_mm)

        if mode in ('surface', 'condensation'):
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
            if abs(Ts - target) < 0.05:
                converged_delta = delta
                break
        else:
            if q_flux > target:
                lower = delta
            else:
                upper = delta
            if abs(q_flux - target) < 0.5:
                converged_delta = delta
                break

    # 修复: 若 break 由收敛条件触发, 用本次通过检验的 delta, 而非 (lower+upper)/2
    delta = converged_delta if converged_delta is not None else 0.5 * (lower + upper)
    # 最终自洽计算
    Ts, q_flux, q_l, hc, hr, h, T_int, R_wall, R_ins, R_conv = _solve_sc_state_pipe(
        d1_mm, baseK, kCoeff, tf, ta, delta, v, epsilon, position, k_pipe, wall_t_mm)

    return {
        'thickness_mm': delta,
        'surface_temp_c': Ts,
        'heat_flux_w_m2': q_flux,
        'linear_heat_loss_w_m': q_l,
        'interface_temp_c': T_int,
        'R_wall': R_wall,
        'R_insulation': R_ins,
        'R_conv': R_conv,
        'hc': hc, 'hr': hr, 'h': h,
    }


def _solve_sc_state_flat(baseK, kCoeff, tf, ta, delta_mm, v, epsilon, length_m, width_m, k_wall=0, wall_t_mm=0):
    """平壁自洽 Ts↔h 状态 (内部辅助)"""
    ts_guess = ta + 0.5 * (tf - ta)
    for _ in range(30):
        k = get_k_temp(baseK, kCoeff, tf, ts_guess)
        hc = hc_flat_astm(length_m, width_m, ts_guess, ta, v)
        hr = hr_radiation(epsilon, ts_guess, ta)
        h = hc + hr
        Ts, q_flux, T_int, R_wall, R_ins, R_conv = surface_state_flat(k, tf, ta, delta_mm, h, k_wall, wall_t_mm)
        if abs(Ts - ts_guess) < 0.01:
            break
        ts_guess = 0.5 * ts_guess + 0.5 * Ts
    return Ts, q_flux, hc, hr, h, T_int, R_wall, R_ins, R_conv


def solve_flat(baseK: float, kCoeff: float, tf: float, ta: float, target: float, mode: str,
               v: float, epsilon: float, length_m: float, width_m: float, k_wall=0, wall_t_mm=0):
    is_heating = tf > ta
    lower, upper = 0.01, 1.0
    # 找上界 (用自洽 h, 与 webapp 一致)
    for _ in range(60):
        Ts, q_flux, _, _, _, _, _, _, _ = _solve_sc_state_flat(baseK, kCoeff, tf, ta, upper, v, epsilon, length_m, width_m, k_wall, wall_t_mm)
        if mode in ('surface', 'condensation'):
            if (is_heating and Ts < target) or ((not is_heating) and Ts > target):
                break
        else:
            if q_flux < target:
                break
        upper *= 2
        if upper > 5000:
            break

    converged_delta = None
    for _ in range(200):
        delta = 0.5 * (lower + upper)
        Ts, q_flux, hc, hr, h, _, _, _, _ = _solve_sc_state_flat(baseK, kCoeff, tf, ta, delta, v, epsilon, length_m, width_m, k_wall, wall_t_mm)

        if mode in ('surface', 'condensation'):
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
            if abs(Ts - target) < 0.05:
                converged_delta = delta
                break
        else:
            if q_flux > target:
                lower = delta
            else:
                upper = delta
            if abs(q_flux - target) < 0.5:
                converged_delta = delta
                break

    # 修复: 若 break 由收敛条件触发, 用本次通过检验的 delta, 而非 (lower+upper)/2
    delta = converged_delta if converged_delta is not None else 0.5 * (lower + upper)
    Ts, q_flux, hc, hr, h, T_int, R_wall, R_ins, R_conv = _solve_sc_state_flat(baseK, kCoeff, tf, ta, delta, v, epsilon, length_m, width_m, k_wall, wall_t_mm)

    return {
        'thickness_mm': delta,
        'surface_temp_c': Ts,
        'heat_flux_w_m2': q_flux,
        'interface_temp_c': T_int,
        'R_wall': R_wall,
        'R_insulation': R_ins,
        'R_conv': R_conv,
        'hc': hc, 'hr': hr, 'h': h,
    }


# ---------------------------------------------------------------------------
# 标准厚度 (与项目一致)
# ---------------------------------------------------------------------------
STD_THK = [10, 13, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]


def standard_thickness(thk: float) -> float:
    for t in STD_THK:
        if t >= thk:
            return t
    return STD_THK[-1]


# ---------------------------------------------------------------------------
# 顶层入口
# ---------------------------------------------------------------------------
def calculate(case: dict) -> dict:
    """统一参考计算入口;  case 字段与项目页面变量一一对应"""
    equip = case['equipmentType']           # 'pipe' | 'flat'
    mode = case.get('mode', 'surface')      # 'surface' | 'heatloss' | 'condensation'
    baseK = case['k']
    kCoeff = case.get('kCoeff', 0.00023)
    tf = case['mediumTemp']
    ta = case['ambientTemp']
    v = case['windSpeed']
    eps = case['emittance']
    hours = case['operatingHours']

    # 管子材质 (与 3E Plus "Base Metal" 对齐)
    pipe_material_key = case.get('pipeMaterial', 'carbon_steel')
    pipe_mat = PIPE_MATERIALS.get(pipe_material_key, PIPE_MATERIALS['carbon_steel'])
    k_pipe = case.get('pipeMaterialK', pipe_mat['k'])   # 允许用户自定义 k
    pipe_max_temp = pipe_mat['maxTemp']

    # 保温材质最高使用温度 (用于界面温度校核)
    ins_max_temp = case.get('insulationMaxTemp', 9999)

    if mode == 'condensation':
        target = dew_point(ta, case['relativeHumidity']) + 1.0
        dp = dew_point(ta, case['relativeHumidity'])
    elif mode == 'surface':
        target = case['targetSurfaceTemp']
        dp = None
    else:
        target = case['targetHeatLoss']
        dp = None

    interface_temp = None
    material_warnings = []

    if equip == 'pipe':
        position = case.get('insulationPosition', 'external')
        if position == 'external':
            d1 = case['outerDiameter']
            wall_t = case.get('wallThickness', 0.0)
        else:
            d1 = case.get('innerDiameter', case['outerDiameter'] - 2 * case.get('wallThickness', 0))
            wall_t = case.get('wallThickness', 0.0)
        r = solve_pipe(d1, baseK, kCoeff, tf, ta, target, mode, v, eps,
                       position=position, k_pipe=k_pipe, wall_t_mm=wall_t)
        linear = r['linear_heat_loss_w_m']
        annual = linear * hours / 1000.0
        interface_temp = r.get('interface_temp_c')
        # 材质温度校核
        if interface_temp is not None and ins_max_temp < interface_temp:
            material_warnings.append(
                f"Interface temp {interface_temp:.1f}°C exceeds insulation max {ins_max_temp}°C")
        if tf > pipe_max_temp:
            material_warnings.append(
                f"Medium temp {tf:.1f}°C exceeds pipe material ({pipe_mat['name']}) max {pipe_max_temp}°C")
    else:
        k_wall = case.get('k_wall', 0)
        wall_t_mm = case.get('wall_t_mm', 0)
        r = solve_flat(baseK, kCoeff, tf, ta, target, mode, v, eps,
                       case['surfaceLength'], case['surfaceWidth'],
                       k_wall=k_wall, wall_t_mm=wall_t_mm)
        area = case['surfaceLength'] * case['surfaceWidth']
        annual = r['heat_flux_w_m2'] * area * hours / 1000.0
        linear = None
        interface_temp = r.get('interface_temp_c', tf)

    return {
        'thickness_mm': r['thickness_mm'],
        'standardThickness': standard_thickness(r['thickness_mm']),
        'surfaceTemp': r['surface_temp_c'],
        'heatFlux': r['heat_flux_w_m2'],
        'linearHeatLoss': linear,
        'annualHeatLoss': annual,
        'dewPoint': dp,
        'interfaceTemp': interface_temp,
        'pipeMaterial': pipe_mat['name'],
        'pipeMaterialK': k_pipe,
        'hc': r['hc'],
        'hr': r['hr'],
        'h': r['h'],
        'R_wall': r.get('R_wall', 0),
        'R_insulation': r.get('R_insulation', 0),
        'R_conv': r.get('R_conv', 0),
        'warnings': material_warnings,
    }


if __name__ == '__main__':
    # 自检: 与项目默认工况对照
    demo = {
        'equipmentType': 'pipe', 'mode': 'surface',
        'outerDiameter': 60.3, 'k': 0.040, 'kCoeff': 9.4e-5,
        'mediumTemp': 150.0, 'ambientTemp': 20.0,
        'windSpeed': 0.0, 'emittance': 0.9, 'operatingHours': 8760,
        'targetSurfaceTemp': 50.0,
        'pipeMaterial': 'carbon_steel', 'wallThickness': 3.91,
        'insulationMaxTemp': 650,
    }
    print('参考实现自检 (2" 碳钢管, 矿棉, 150°C→50°C):')
    for k_, v_ in calculate(demo).items():
        print(f'  {k_:>18} = {v_}')
