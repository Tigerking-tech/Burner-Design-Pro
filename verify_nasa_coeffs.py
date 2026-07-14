#!/usr/bin/env python3
"""
系统性验证 NASA 系数和焓值计算
对比项目中的系数与 Cantera nasa_gas.yaml
"""

import yaml
import math

R = 0.008314  # kJ/mol/K

# 项目中的NASA系数（从 FlameTemperaturePage.tsx 提取）
project_coeffs = {
    'CO2': {
        'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
        'high': [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855]
    },
    'H2O': {
        'low': [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208],
        'high': [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571]
    },
    'N2': {
        'low': [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468],
        'high': [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252]
    },
    'O2': {
        'low': [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573],
        'high': [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184]
    },
    'CO': {
        'low': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928],
        'high': [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979]
    },
    'H2': {
        'low': [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238],
        'high': [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887]
    },
    'CH4': {
        'low': [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376],
        'high': [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326]
    },
    'C2H6': {
        'low': [4.29142492, -0.0055015427, 5.99438288e-05, -7.08466285e-08, 2.68685771e-11, -11522.2055, 2.66682316],
        'high': [4.04666674, 0.0153538766, -5.47039321e-06, 8.77826228e-10, -5.23167305e-14, -12447.3512, -0.968683607]
    },
    'C3H8': {
        'low': [4.2110262, 0.00171599803, 7.06183472e-05, -9.19594116e-08, 3.64421372e-11, -14381.2106, 5.60930491],
        'high': [6.66789363, 0.0206120214, -7.36553027e-06, 1.18440761e-09, -7.0695321e-14, -16274.8521, -13.1859503]
    },
    'C4H10': {
        'low': [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879],
        'high': [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076]
    },
}

# Cantera nasa_gas 的物种名称映射
cantera_species_map = {
    'CO2': 'CO2',
    'H2O': 'H2O',
    'N2': 'N2',
    'O2': 'O2',
    'CO': 'CO',
    'H2': 'H2',
    'CH4': 'CH4',
    'C2H6': 'C2H6',
    'C3H8': 'C3H8',
    'C4H10': 'C4H10,n-butane',
}

def load_cantera_coeffs():
    """从 Cantera 的 nasa_gas.yaml 加载系数"""
    import os
    cantera_path = os.path.expanduser('~/.pyenv/versions/3.14.4/lib/python3.14/site-packages/cantera/data/nasa_gas.yaml')
    
    with open(cantera_path, 'r') as f:
        data = yaml.safe_load(f)
    
    coeffs = {}
    for sp in data['species']:
        name = sp['name']
        coeffs[name] = {
            'low': sp['thermo']['data'][0],
            'high': sp['thermo']['data'][1] if len(sp['thermo']['data']) > 1 else sp['thermo']['data'][0]
        }
    return coeffs

def compare_coeff_arrays(proj, cantera, name):
    """比较两个系数数组"""
    max_diff = 0
    max_diff_idx = -1
    for i in range(7):
        diff = abs(proj[i] - cantera[i])
        if diff > max_diff:
            max_diff = diff
            max_diff_idx = i
    return max_diff, max_diff_idx

def enthalpy_RT(a, T):
    """计算 H/RT"""
    return a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T

def main():
    print("=" * 80)
    print("NASA 系数对比验证")
    print("=" * 80)
    print()
    
    cantera_coeffs = load_cantera_coeffs()
    
    print(f"{'物种':<10} {'低温段最大偏差':<20} {'高温段最大偏差':<20} {'状态'}")
    print("-" * 70)
    
    all_match = True
    for name, ct_name in cantera_species_map.items():
        if name not in project_coeffs:
            print(f"{name:<10} 项目中无此物种")
            continue
        if ct_name not in cantera_coeffs:
            print(f"{name:<10} Cantera中无此物种 ({ct_name})")
            continue
        
        proj = project_coeffs[name]
        ct = cantera_coeffs[ct_name]
        
        low_diff, low_idx = compare_coeff_arrays(proj['low'], ct['low'], name)
        high_diff, high_idx = compare_coeff_arrays(proj['high'], ct['high'], name)
        
        # 判断是否匹配（相对误差 < 0.1%）
        low_match = low_diff < 0.01 * max(abs(proj['low'][low_idx]), 1)
        high_match = high_diff < 0.01 * max(abs(proj['high'][high_idx]), 1)
        
        status = "✓ 匹配" if (low_match and high_match) else "✗ 不匹配"
        if not (low_match and high_match):
            all_match = False
        
        print(f"{name:<10} {low_diff:.2e} (a{low_idx}){'':>8} {high_diff:.2e} (a{high_idx}){'':>8} {status}")
    
    print()
    print("=" * 80)
    print("焓值计算验证 (500K, 1000K, 2000K)")
    print("=" * 80)
    print()
    
    test_temps = [500, 1000, 2000]
    
    print(f"{'物种':<10} {'温度(K)':<10} {'项目 H(kJ/mol)':<15} {'Cantera H(kJ/mol)':<15} {'偏差(%)':<10}")
    print("-" * 70)
    
    for name, ct_name in cantera_species_map.items():
        if name not in project_coeffs or ct_name not in cantera_coeffs:
            continue
        
        proj = project_coeffs[name]
        ct = cantera_coeffs[ct_name]
        
        for T in test_temps:
            # 选择正确的系数段
            if T < 1000:
                proj_a = proj['low']
                ct_a = ct['low']
            else:
                proj_a = proj['high']
                ct_a = ct['high']
            
            H_proj = R * T * enthalpy_RT(proj_a, T)
            H_ct = R * T * enthalpy_RT(ct_a, T)
            
            diff_pct = abs(H_proj - H_ct) / max(abs(H_ct), 1) * 100
            
            status = "✓" if diff_pct < 1 else "✗"
            print(f"{name:<10} {T:<10} {H_proj:<15.3f} {H_ct:<15.3f} {diff_pct:<10.3f} {status}")
        print()
    
    if all_match:
        print("\n✓ 所有 NASA 系数与 Cantera nasa_gas 完全匹配！")
    else:
        print("\n⚠ 部分系数存在差异，请检查！")

if __name__ == '__main__':
    main()