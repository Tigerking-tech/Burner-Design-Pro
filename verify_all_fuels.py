#!/usr/bin/env python3
"""
系统性验证所有燃料组分的火焰温度计算
对比 Web App 与 Cantera 的结果
"""

import cantera as ct
import yaml
import math

# Cantera nasa_gas 形成焓和NASA系数（与项目同步）
R = 0.008314  # kJ/mol/K

# 从 nasa_gas.yaml 提取的NASA系数（与 FlameTemperaturePage.tsx 同步）
nasaCoeffs = {
    'CO2': {
        'Tmid': 1000,
        'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
        'high': [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855]
    },
    'H2O': {
        'Tmid': 1000,
        'low': [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208],
        'high': [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571]
    },
    'N2': {
        'Tmid': 1000,
        'low': [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468],
        'high': [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252]
    },
    'O2': {
        'Tmid': 1000,
        'low': [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573],
        'high': [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184]
    },
    'CO': {
        'Tmid': 1000,
        'low': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928],
        'high': [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979]
    },
    'H2': {
        'Tmid': 1000,
        'low': [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238],
        'high': [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887]
    },
    'OH': {
        'Tmid': 1000,
        'low': [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458],
        'high': [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662]
    },
    'O': {
        'Tmid': 1000,
        'low': [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346],
        'high': [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457]
    },
    'H': {
        'Tmid': 1000,
        'low': [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853],
        'high': [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494]
    },
    'NO': {
        'Tmid': 1000,
        'low': [4.21847630, -0.004638976, 1.10410220e-05, -9.33613540e-09, 2.80357700e-12, 9844.623, 2.28084640],
        'high': [3.26060560, 0.0011911043, -4.29170480e-07, 6.94576690e-11, -4.03360990e-15, 9920.9746, 6.3693027]
    },
    'H2S': {
        'Tmid': 1000,
        'low': [3.9323476, -0.00050260905, 4.5928473e-06, -3.1807214e-09, 6.6497561e-13, -3650.5359, 2.3157905],
        'high': [2.7452199, 0.0040434607, -1.538451e-06, 2.7520249e-10, -1.8592095e-14, -3419.9444, 8.0546745]
    },
    'CH4': {
        'Tmid': 1000,
        'low': [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376],
        'high': [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326]
    },
    'C2H6': {
        'Tmid': 1000,
        'low': [4.29142492, -0.0055015427, 5.99438288e-05, -7.08466285e-08, 2.68685771e-11, -11522.2055, 2.66682316],
        'high': [4.04666674, 0.0153538766, -5.47039321e-06, 8.77826228e-10, -5.23167305e-14, -12447.3512, -0.968683607]
    },
    'C3H8': {
        'Tmid': 1000,
        'low': [4.2110262, 0.00171599803, 7.06183472e-05, -9.19594116e-08, 3.64421372e-11, -14381.2106, 5.60930491],
        'high': [6.66789363, 0.0206120214, -7.36553027e-06, 1.18440761e-09, -7.0695321e-14, -16274.8521, -13.1859503]
    },
    'C4H10': {
        'Tmid': 1000,
        'low': [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879],
        'high': [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076]
    },
    'C2H4': {
        'Tmid': 1000,
        'low': [3.95920148, -0.00757052247, 5.70990292e-05, -6.91588753e-08, 2.69884373e-11, 5089.77593, 4.09733096],
        'high': [3.99182761, 0.010483391, -3.71721385e-06, 5.94628514e-10, -3.53630526e-14, 4268.65819, -0.269052151]
    },
    'NH3': {
        'Tmid': 1000,
        'low': [4.30177808, -0.0047712733, 2.19341619e-05, -2.29856489e-08, 8.28992268e-12, -6748.06394, -0.690644393],
        'high': [2.71709692, 0.00556856338, -1.76886396e-06, 2.6741726e-10, -1.52731419e-14, -6584.51989, 6.09289837]
    },
}

# 形成焓 (kJ/mol) - 与项目同步
enthalpyOfFormation = {
    'H2': 0, 'CO': -110.5, 'NH3': -45.9, 'H2S': -20.6,
    'CH4': -74.87, 'C2H6': -84.7, 'C3H8': -103.85, 'C4H10': -126.15,
    'N2': 0, 'CO2': -393.52, 'O2': 0, 'H2O': -241.83,
    'C2H4': 52.5
}

# 原子组成
atomicComp = {
    'H2': {'C': 0, 'H': 2, 'O': 0, 'N': 0},
    'CO': {'C': 1, 'H': 0, 'O': 1, 'N': 0},
    'NH3': {'C': 0, 'H': 3, 'O': 0, 'N': 1},
    'H2S': {'C': 0, 'H': 2, 'O': 0, 'N': 0},
    'CH4': {'C': 1, 'H': 4, 'O': 0, 'N': 0},
    'C2H6': {'C': 2, 'H': 6, 'O': 0, 'N': 0},
    'C3H8': {'C': 3, 'H': 8, 'O': 0, 'N': 0},
    'C4H10': {'C': 4, 'H': 10, 'O': 0, 'N': 0},
    'C2H4': {'C': 2, 'H': 4, 'O': 0, 'N': 0},
}

def getCoeffs(species, T):
    """获取NASA系数"""
    sp = species.upper().replace('₂', '2')
    if sp not in nasaCoeffs:
        return None
    data = nasaCoeffs[sp]
    if T < data['Tmid']:
        return data['low']
    else:
        return data['high']

def enthalpy(species, T):
    """计算焓值 (kJ/mol)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
    return R * T * H_RT

def entropy(species, T):
    """计算熵值 (kJ/mol/K)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    S_R = a[0] * math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
    return R * S_R

def cp(species, T):
    """计算热容 (kJ/mol/K)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    Cp_R = a[0] + a[1] * T + a[2] * T * T + a[3] * T * T * T + a[4] * T * T * T * T
    return R * Cp_R

def calculate_flame_temperature_web(fuel, T0=298.15, P=101325, lambda_val=1.0):
    """Web App 方法计算火焰温度（简化版：仅冻结温度）"""
    if fuel not in atomicComp:
        return None, None, None
    
    comp = atomicComp[fuel]
    c, h = comp['C'], comp['H']
    
    # 化学计量方程：CxHy + (x + y/4) O2 -> x CO2 + y/2 H2O
    n_O2_stoich = c + h / 4
    n_O2 = n_O2_stoich * lambda_val
    n_N2 = n_O2 * 3.76  # 空气中N2/O2比例
    
    # 反应物焓 (298.15K)
    H_react = enthalpyOfFormation.get(fuel, 0) + n_O2 * enthalpyOfFormation.get('O2', 0) + n_N2 * enthalpyOfFormation.get('N2', 0)
    
    # 产物组成（冻结假设）
    n_CO2 = c
    n_H2O = h / 2
    n_O2_excess = n_O2 - n_O2_stoich if lambda_val > 1 else 0
    n_N2_prod = n_N2
    
    # 产物焓
    H_prod_ref = n_CO2 * enthalpy('CO2', T0) + n_H2O * enthalpy('H2O', T0) + n_N2_prod * enthalpy('N2', T0)
    if n_O2_excess > 0:
        H_prod_ref += n_O2_excess * enthalpy('O2', T0)
    
    # 能量守恒：H_react = H_prod(T)
    # 使用二分法求解温度
    T_low, T_high = T0, 3000.0
    while T_high - T_low > 0.1:
        T_mid = (T_low + T_high) / 2
        H_prod = n_CO2 * enthalpy('CO2', T_mid) + n_H2O * enthalpy('H2O', T_mid) + n_N2_prod * enthalpy('N2', T_mid)
        if n_O2_excess > 0:
            H_prod += n_O2_excess * enthalpy('O2', T_mid)
        if H_prod < H_react:
            T_low = T_mid
        else:
            T_high = T_mid
    
    return T_mid - 273.15, n_CO2, n_H2O, n_N2_prod

def calculate_flame_temperature_cantera(fuel, T0=298.15, P=101325, lambda_val=1.0):
    """使用 Cantera 计算火焰温度"""
    try:
        # 设置燃料和氧化剂
        fuel_species = {
            'CH4': 'CH4',
            'C2H6': 'C2H6',
            'C3H8': 'C3H8',
            'H2': 'H2',
            'CO': 'CO',
            'C2H4': 'C2H4',
        }
        
        if fuel not in fuel_species:
            return None, None, None, None
        
        ct_fuel = fuel_species[fuel]
        
        # 每次创建新的 Solution 对象
        gas = ct.Solution('gri30.yaml')
        
        # 设置当量比
        phi = 1.0 / lambda_val
        gas.TP = T0, P
        gas.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
        
        # 平衡计算
        gas.equilibrate('HP')
        T_eq = gas.T - 273.15
        
        # 产物组成
        n_CO2 = gas['CO2'].X[0] * 100 if 'CO2' in gas.species_names else 0
        n_H2O = gas['H2O'].X[0] * 100 if 'H2O' in gas.species_names else 0
        n_N2 = gas['N2'].X[0] * 100 if 'N2' in gas.species_names else 0
        
        return T_eq, n_CO2, n_H2O, n_N2
        
    except Exception as e:
        print(f"Cantera error for {fuel}: {e}")
        return None, None, None, None

def main():
    print("=" * 80)
    print("系统性验证所有燃料组分的火焰温度计算")
    print("=" * 80)
    print()
    
    fuels = ['CH4', 'C2H6', 'C3H8', 'C4H10', 'H2', 'CO', 'C2H4']
    fuel_names = {
        'CH4': '甲烷',
        'C2H6': '乙烷',
        'C3H8': '丙烷',
        'C4H10': '丁烷',
        'H2': '氢气',
        'CO': '一氧化碳',
        'C2H4': '乙烯'
    }
    
    print(f"{'燃料':<12} {'Web App (°C)':<15} {'Cantera (°C)':<15} {'偏差 (°C)':<12} {'偏差 (%)':<10}")
    print("-" * 70)
    
    results = []
    for fuel in fuels:
        # Web App 计算
        T_web, _, _, _ = calculate_flame_temperature_web(fuel)
        
        # Cantera 计算
        T_ct, _, _, _ = calculate_flame_temperature_cantera(fuel)
        
        if T_web is not None and T_ct is not None:
            delta = T_web - T_ct
            delta_pct = (delta / T_ct) * 100 if T_ct != 0 else 0
            print(f"{fuel_names[fuel]:<12} {T_web:<15.2f} {T_ct:<15.2f} {delta:<12.2f} {delta_pct:<10.3f}")
            results.append((fuel, T_web, T_ct, delta, delta_pct))
        else:
            print(f"{fuel_names[fuel]:<12} 计算失败")
    
    print()
    print("=" * 80)
    print("详细分析")
    print("=" * 80)
    
    # 统计分析
    if results:
        deltas = [r[3] for r in results]
        avg_delta = sum(deltas) / len(deltas)
        max_delta = max(deltas, key=abs)
        
        print(f"平均偏差: {avg_delta:.2f}°C")
        print(f"最大偏差: {max_delta:.2f}°C ({fuel_names[results[deltas.index(max_delta)][0]]})")
        
        # 检查相对顺序
        web_temps = [(r[0], r[1]) for r in results]
        ct_temps = [(r[0], r[2]) for r in results]
        
        web_sorted = sorted(web_temps, key=lambda x: x[1])
        ct_sorted = sorted(ct_temps, key=lambda x: x[1])
        
        print()
        print("温度排序对比 (从低到高):")
        print(f"Web App:  {' < '.join([fuel_names[t[0]] for t in web_sorted])}")
        print(f"Cantera:  {' < '.join([fuel_names[t[0]] for t in ct_sorted])}")
        
        # 检查排序是否一致
        web_order = [t[0] for t in web_sorted]
        ct_order = [t[0] for t in ct_sorted]
        if web_order == ct_order:
            print("✓ 排序完全一致!")
        else:
            print("⚠ 排序存在差异!")

if __name__ == '__main__':
    main()