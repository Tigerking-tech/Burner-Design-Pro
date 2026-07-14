#!/usr/bin/env python3
"""
最终验证脚本：对比 Web App 与 Cantera 的火焰温度计算
使用 Cantera 的 gri30 机制作为参考
"""

import sys
import math
try:
    import cantera as ct
except ImportError:
    print("Cantera 未安装，将只进行 Web App 计算")
    ct = None

# ============ Web App 计算部分 ============

R = 0.008314  # kJ/mol/K

# NASA 系数（从 FlameTemperaturePage.tsx 提取，已与 Cantera nasa_gas 同步）
project_coeffs = {
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
}

# 标准形成焓 (kJ/mol)
enthalpyOfFormation = {
    'H2': 0, 'CO': -110.5, 'CH4': -74.87, 'C2H6': -84.7, 'C3H8': -103.85,
    'N2': 0, 'CO2': -393.52, 'O2': 0, 'H2O': -241.83,
    'OH': 39.0, 'O': 249.2, 'H': 218.0, 'NO': 90.3,
}

# 原子组成
atomicComp = {
    'CH4': {'C': 1, 'H': 4, 'O': 0, 'N': 0},
    'C2H6': {'C': 2, 'H': 6, 'O': 0, 'N': 0},
    'C3H8': {'C': 3, 'H': 8, 'O': 0, 'N': 0},
    'H2': {'C': 0, 'H': 2, 'O': 0, 'N': 0},
    'CO': {'C': 1, 'H': 0, 'O': 1, 'N': 0},  # CO 包含一个氧原子
}

# Cantera 物种名称映射
cantera_species_map = {
    'CH4': 'CH4',
    'C2H6': 'C2H6',
    'C3H8': 'C3H8',
    'H2': 'H2',
    'CO': 'CO',
}

def getCoeffs(species, T):
    """获取NASA系数"""
    if species not in project_coeffs:
        return None
    data = project_coeffs[species]
    if T < data['Tmid']:
        return data['low']
    else:
        return data['high']

def enthalpy(species, T):
    """计算焓值 H(T) (kJ/mol)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
    return R * T * H_RT

def entropy(species, T):
    """计算熵值 S(T) (kJ/mol/K)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    S_R = a[0] * math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
    return R * S_R

def gibbs(species, T):
    """计算吉布斯自由能 G(T) (kJ/mol)"""
    return enthalpy(species, T) - T * entropy(species, T)

def calculate_flame_temp_web(fuel, lambda_val=1.0, T0=298.15):
    """Web App 方法计算火焰温度（冻结假设）"""
    if fuel not in atomicComp:
        return None
    
    comp = atomicComp[fuel]
    c, h, o = comp['C'], comp['H'], comp['O']
    
    # 化学计量方程：CxHyOz + (x + y/4 - z/2) O2 -> x CO2 + y/2 H2O
    # 例如：CO + 0.5 O2 -> CO2
    n_O2_stoich = c + h / 4 - o / 2
    n_O2 = n_O2_stoich * lambda_val
    n_N2 = n_O2 * 3.76
    
    # 反应物焓 (298.15K)
    H_react = enthalpyOfFormation.get(fuel, 0) + n_O2 * enthalpyOfFormation.get('O2', 0) + n_N2 * enthalpyOfFormation.get('N2', 0)
    
    # 产物组成
    n_CO2 = c
    n_H2O = h / 2
    n_O2_excess = n_O2 - n_O2_stoich if lambda_val > 1 else 0
    n_N2_prod = n_N2
    
    # 二分法求解温度
    T_low, T_high = T0, 3500.0
    while T_high - T_low > 0.1:
        T_mid = (T_low + T_high) / 2
        H_prod = n_CO2 * enthalpy('CO2', T_mid) + n_H2O * enthalpy('H2O', T_mid) + n_N2_prod * enthalpy('N2', T_mid)
        if n_O2_excess > 0:
            H_prod += n_O2_excess * enthalpy('O2', T_mid)
        
        if H_prod < H_react:
            T_low = T_mid
        else:
            T_high = T_mid
    
    return T_mid - 273.15

def calculate_flame_temp_cantera(fuel, lambda_val=1.0, T0=298.15):
    """使用 Cantera 计算平衡火焰温度"""
    if ct is None:
        return None
    
    try:
        gas = ct.Solution('gri30.yaml')
        ct_fuel = cantera_species_map.get(fuel)
        if ct_fuel is None:
            return None
        
        phi = 1.0 / lambda_val
        gas.TP = T0, ct.one_atm
        gas.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
        gas.equilibrate('HP')
        
        return gas.T - 273.15
    except Exception as e:
        return None

def main():
    print("=" * 80)
    print("系统性验证：Web App vs Cantera")
    print("=" * 80)
    print()
    
    fuels = [
        ('H2', '氢气'),
        ('CH4', '甲烷'),
        ('C2H6', '乙烷'),
        ('C3H8', '丙烷'),
        ('CO', '一氧化碳'),
    ]
    
    lambda_vals = [1.0, 1.1, 1.2]
    
    # 表头
    header = f"{'燃料':<12}"
    for lam in lambda_vals:
        header += f"λ={lam}: Web/Cantera/偏差"
    print(header)
    print("-" * 90)
    
    results = {}
    
    for fuel, name in fuels:
        row = f"{name:<12}"
        results[fuel] = {}
        
        for lam in lambda_vals:
            T_web = calculate_flame_temp_web(fuel, lam)
            T_ct = calculate_flame_temp_cantera(fuel, lam)
            
            if T_web is not None and T_ct is not None:
                delta = T_web - T_ct
                delta_pct = abs(delta / T_ct) * 100
                row += f"{T_web:.0f}/{T_ct:.0f}/{delta:+.0f}°C  "
                results[fuel][lam] = {'web': T_web, 'ct': T_ct, 'delta': delta}
            else:
                row += f"N/A  "
        
        print(row)
    
    print()
    
    # 相对排序分析
    print("=" * 80)
    print("相对排序分析 (λ=1.0)")
    print("=" * 80)
    
    web_temps = [(f, results[f][1.0]['web']) for f in results if 1.0 in results[f]]
    ct_temps = [(f, results[f][1.0]['ct']) for f in results if 1.0 in results[f]]
    
    web_sorted = sorted(web_temps, key=lambda x: x[1])
    ct_sorted = sorted(ct_temps, key=lambda x: x[1])
    
    fuel_names = {'H2': '氢气', 'CH4': '甲烷', 'C2H6': '乙烷', 'C3H8': '丙烷', 'CO': '一氧化碳'}
    
    print(f"Web App 排序: {' < '.join([fuel_names[x[0]] for x in web_sorted])}")
    print(f"Cantera 排序: {' < '.join([fuel_names[x[0]] for x in ct_sorted])}")
    
    web_order = [x[0] for x in web_sorted]
    ct_order = [x[0] for x in ct_sorted]
    
    if web_order == ct_order:
        print("\n✓ 排序完全一致！")
    else:
        print("\n⚠ 排序存在差异！")
    
    # 详细偏差分析
    print()
    print("=" * 80)
    print("偏差分析 (λ=1.0)")
    print("=" * 80)
    
    deltas = [results[f][1.0]['delta'] for f in results if 1.0 in results[f]]
    avg_delta = sum(deltas) / len(deltas)
    max_delta = max(deltas, key=abs)
    
    print(f"平均偏差: {avg_delta:.1f}°C")
    print(f"最大偏差: {max_delta:.1f}°C")
    
    # 结论
    print()
    print("=" * 80)
    print("结论")
    print("=" * 80)
    
    if abs(avg_delta) < 20 and web_order == ct_order:
        print("✓ Web App 计算结果与 Cantera 一致，相对排序正确！")
    else:
        print("⚠ 存在系统性偏差，建议进一步检查。")

if __name__ == '__main__':
    main()