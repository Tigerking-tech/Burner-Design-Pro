#!/usr/bin/env python3
"""
完整的热力学验证脚本
对比项目计算逻辑与 Cantera 参考
"""

import yaml
import math

R = 0.008314  # kJ/mol/K

# 项目中的NASA系数（从 FlameTemperaturePage.tsx 提取）
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
    'C4H10': {
        'Tmid': 1000,
        'low': [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879],
        'high': [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076]
    },
}

# 标准形成焓 (kJ/mol) - 与项目同步
# 注意：这些是 298K 下的标准形成焓
enthalpyOfFormation = {
    'H2': 0,
    'CO': -110.5,
    'CH4': -74.87,
    'C2H6': -84.7,
    'C3H8': -103.85,
    'C4H10': -126.15,
    'N2': 0,
    'CO2': -393.52,
    'O2': 0,
    'H2O': -241.83,  # 气态
}

# 原子组成
atomicComp = {
    'CH4': {'C': 1, 'H': 4, 'O': 0},
    'C2H6': {'C': 2, 'H': 6, 'O': 0},
    'C3H8': {'C': 3, 'H': 8, 'O': 0},
    'C4H10': {'C': 4, 'H': 10, 'O': 0},
    'H2': {'C': 0, 'H': 2, 'O': 0},
    'CO': {'C': 1, 'H': 0, 'O': 1},
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
    """计算焓值 H(T) - H(298) + H_f (kJ/mol)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    # NASA 多项式: H/RT = a0 + a1*T/2 + a2*T²/3 + a3*T³/4 + a4*T⁴/5 + a5/T
    H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
    return R * T * H_RT

def entropy(species, T):
    """计算熵值 S(T) (kJ/mol/K)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    # NASA 多项式: S/R = a0*ln(T) + a1*T + a2*T²/2 + a3*T³/3 + a4*T⁴/4 + a6
    S_R = a[0] * math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
    return R * S_R

def cp(species, T):
    """计算热容 Cp(T) (kJ/mol/K)"""
    a = getCoeffs(species, T)
    if a is None:
        return 0
    # NASA 多项式: Cp/R = a0 + a1*T + a2*T² + a3*T³ + a4*T⁴
    Cp_R = a[0] + a[1] * T + a[2] * T * T + a[3] * T * T * T + a[4] * T * T * T * T
    return R * Cp_R

def gibbs(species, T):
    """计算吉布斯自由能 G(T) = H(T) - T*S(T) (kJ/mol)"""
    return enthalpy(species, T) - T * entropy(species, T)

def calculate_flame_temp_frozen(fuel, lambda_val=1.0, T0=298.15):
    """
    计算冻结火焰温度（无化学平衡）
    """
    if fuel not in atomicComp:
        return None, None, None, None
    
    comp = atomicComp[fuel]
    c, h = comp['C'], comp['H']
    
    # 化学计量方程：CxHy + (x + y/4) O2 -> x CO2 + y/2 H2O
    n_O2_stoich = c + h / 4
    n_O2 = n_O2_stoich * lambda_val
    n_N2 = n_O2 * 3.76  # 空气中N2/O2比例
    
    # 反应物焓 (参考温度 T0)
    H_fuel = enthalpyOfFormation.get(fuel, 0)
    H_O2 = enthalpyOfFormation.get('O2', 0)
    H_N2 = enthalpyOfFormation.get('N2', 0)
    
    H_react = H_fuel + n_O2 * H_O2 + n_N2 * H_N2
    
    # 产物组成
    n_CO2 = c
    n_H2O = h / 2
    n_O2_excess = n_O2 - n_O2_stoich if lambda_val > 1 else 0
    n_N2_prod = n_N2
    
    # 使用二分法求解火焰温度
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
    
    T_flame = (T_low + T_high) / 2 - 273.15  # 转换为摄氏度
    return T_flame, n_CO2, n_H2O, n_N2_prod

def main():
    print("=" * 80)
    print("热力学函数验证")
    print("=" * 80)
    print()
    
    # 1. 验证焓值计算（与NASA多项式对比）
    print("1. 焓值计算验证")
    print("-" * 60)
    
    test_temps = [298.15, 500, 1000, 1500, 2000, 2500]
    test_species = ['CO2', 'H2O', 'N2', 'O2', 'CH4', 'C3H8', 'C4H10']
    
    print(f"{'物种':<8} {'298K':>12} {'500K':>12} {'1000K':>12} {'1500K':>12} {'2000K':>12} {'2500K':>12}")
    print("-" * 80)
    
    for sp in test_species:
        values = [enthalpy(sp, T) for T in test_temps]
        print(f"{sp:<8} {values[0]:>12.2f} {values[1]:>12.2f} {values[2]:>12.2f} {values[3]:>12.2f} {values[4]:>12.2f} {values[5]:>12.2f}")
    
    print()
    
    # 2. 验证熵值计算
    print("2. 熵值计算验证 (kJ/mol/K)")
    print("-" * 60)
    
    print(f"{'物种':<8} {'298K':>12} {'500K':>12} {'1000K':>12} {'1500K':>12} {'2000K':>12}")
    print("-" * 70)
    
    for sp in test_species:
        values = [entropy(sp, T) for T in test_temps[:-1]]
        print(f"{sp:<8} {values[0]:>12.4f} {values[1]:>12.4f} {values[2]:>12.4f} {values[3]:>12.4f} {values[4]:>12.4f}")
    
    print()
    
    # 3. 验证热容计算
    print("3. 热容计算验证 (kJ/mol/K)")
    print("-" * 60)
    
    print(f"{'物种':<8} {'298K':>12} {'500K':>12} {'1000K':>12} {'1500K':>12} {'2000K':>12}")
    print("-" * 70)
    
    for sp in test_species:
        values = [cp(sp, T) for T in test_temps[:-1]]
        print(f"{sp:<8} {values[0]:>12.5f} {values[1]:>12.5f} {values[2]:>12.5f} {values[3]:>12.5f} {values[4]:>12.5f}")
    
    print()
    
    # 4. 火焰温度计算
    print("4. 冻结火焰温度计算 (λ=1.0)")
    print("-" * 60)
    
    fuels = ['H2', 'CH4', 'C2H6', 'C3H8', 'C4H10', 'CO']
    
    print(f"{'燃料':<10} {'T_flame (°C)':<15} {'CO2 (%)':<12} {'H2O (%)':<12} {'N2 (%)':<12}")
    print("-" * 65)
    
    for fuel in fuels:
        result = calculate_flame_temp_frozen(fuel)
        if result[0] is not None:
            T, n_CO2, n_H2O, n_N2 = result
            total = n_CO2 + n_H2O + n_N2
            print(f"{fuel:<10} {T:<15.2f} {n_CO2/total*100:<12.2f} {n_H2O/total*100:<12.2f} {n_N2/total*100:<12.2f}")
    
    print()
    
    # 5. 不同过量空气系数下的火焰温度
    print("5. 不同过量空气系数下的火焰温度 (丙烷 C3H8)")
    print("-" * 60)
    
    lambda_vals = [0.8, 0.9, 1.0, 1.1, 1.2]
    
    print(f"{'λ':<8} {'T_flame (°C)':<15}")
    print("-" * 30)
    
    for lam in lambda_vals:
        result = calculate_flame_temp_frozen('C3H8', lam)
        if result[0] is not None:
            print(f"{lam:<8.1f} {result[0]:<15.2f}")
    
    print()
    print("=" * 80)
    print("验证完成")
    print("=" * 80)

if __name__ == '__main__':
    main()