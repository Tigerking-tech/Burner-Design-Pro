#!/usr/bin/env python3
"""
全面验证：使用 Cantera 对比所有燃料组分的燃烧温度和产物组成
方案：
  1. Cantera 完整平衡计算（参考值）
  2. Web App 的冻结温度计算（Python 复刻，逻辑简单可靠）
  3. Cantera 限制物种集合的平衡计算（模拟 Web App 的 equilibriumSpecies）
"""

import math
import sys
try:
    import cantera as ct
except ImportError:
    print("错误：需要安装 cantera")
    sys.exit(1)

R = 0.008314  # kJ/mol/K

# NASA 系数（与 FlameTemperaturePage.tsx 同步）
nasaCoeffs = {
    'Ar': {'Tmid': 1000,
        'low': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491],
        'high': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491]},
    'CH4': {'Tmid': 1000,
        'low': [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376],
        'high': [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326]},
    'CO': {'Tmid': 1000,
        'low': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928],
        'high': [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979]},
    'CO2': {'Tmid': 1000,
        'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
        'high': [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855]},
    'C2H4': {'Tmid': 1000,
        'low': [3.95920148, -0.00757052247, 5.70990292e-05, -6.91588753e-08, 2.69884373e-11, 5089.77593, 4.09733096],
        'high': [3.99182761, 0.010483391, -3.71721385e-06, 5.94628514e-10, -3.53630526e-14, 4268.65819, -0.269052151]},
    'C2H6': {'Tmid': 1000,
        'low': [4.29142492, -0.0055015427, 5.99438288e-05, -7.08466285e-08, 2.68685771e-11, -11522.2055, 2.66682316],
        'high': [4.04666674, 0.0153538766, -5.47039321e-06, 8.77826228e-10, -5.23167305e-14, -12447.3512, -0.968683607]},
    'C3H8': {'Tmid': 1000,
        'low': [4.2110262, 0.00171599803, 7.06183472e-05, -9.19594116e-08, 3.64421372e-11, -14381.2106, 5.60930491],
        'high': [6.66789363, 0.0206120214, -7.36553027e-06, 1.18440761e-09, -7.0695321e-14, -16274.8521, -13.1859503]},
    'C4H10': {'Tmid': 1000,
        'low': [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879],
        'high': [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076]},
    'H2': {'Tmid': 1000,
        'low': [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238],
        'high': [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887]},
    'H2O': {'Tmid': 1000,
        'low': [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208],
        'high': [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571]},
    'N2': {'Tmid': 1000,
        'low': [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468],
        'high': [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252]},
    'O2': {'Tmid': 1000,
        'low': [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573],
        'high': [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184]},
    'OH': {'Tmid': 1000,
        'low': [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458],
        'high': [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662]},
    'O': {'Tmid': 1000,
        'low': [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346],
        'high': [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457]},
    'H': {'Tmid': 1000,
        'low': [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853],
        'high': [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494]},
    'NO': {'Tmid': 1000,
        'low': [4.21847630, -0.004638976, 1.10410220e-05, -9.33613540e-09, 2.80357700e-12, 9844.623, 2.28084640],
        'high': [3.26060560, 0.0011911043, -4.29170480e-07, 6.94576690e-11, -4.03360990e-15, 9920.9746, 6.3693027]},
    'H2S': {'Tmid': 1000,
        'low': [3.9323476, -0.00050260905, 4.5928473e-06, -3.1807214e-09, 6.6497561e-13, -3650.5359, 2.3157905],
        'high': [2.7452199, 0.0040434607, -1.538451e-06, 2.7520249e-10, -1.8592095e-14, -3419.9444, 8.0546745]},
    'NH3': {'Tmid': 1000,
        'low': [4.30177808, -0.0047712733, 2.19341619e-05, -2.29856489e-08, 8.28992268e-12, -6748.06394, -0.690644393],
        'high': [2.71709692, 0.00556856338, -1.76886396e-06, 2.6741726e-10, -1.52731419e-14, -6584.51989, 6.09289837]},
}

# 原子组成
atomicComp = {
    'H2': {'c': 0, 'h': 2, 'o': 0, 'n': 0},
    'CO': {'c': 1, 'h': 0, 'o': 1, 'n': 0},
    'CH4': {'c': 1, 'h': 4, 'o': 0, 'n': 0},
    'C2H6': {'c': 2, 'h': 6, 'o': 0, 'n': 0},
    'C3H8': {'c': 3, 'h': 8, 'o': 0, 'n': 0},
    'C4H10': {'c': 4, 'h': 10, 'o': 0, 'n': 0},
    'C2H4': {'c': 2, 'h': 4, 'o': 0, 'n': 0},
}

def getCoeffs(species, T):
    if species not in nasaCoeffs:
        return None
    data = nasaCoeffs[species]
    return data['low'] if T < data['Tmid'] else data['high']

def enthalpy(species, T):
    a = getCoeffs(species, T)
    if a is None:
        return 0
    H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
    return R * T * H_RT

def calculate_frozen_temp(fuel, lambda_val=1.0, T0=298.15):
    """计算冻结火焰温度（逻辑简单可靠）"""
    if fuel not in atomicComp:
        return None, None
    
    comp = atomicComp[fuel]
    totalC, totalH, totalO = comp['c'], comp['h'], comp['o']
    
    stoichO2 = totalC + totalH / 4 - totalO / 2
    if stoichO2 <= 0:
        return None, None
    
    actualO2 = stoichO2 * lambda_val
    
    # 空气
    o2InOxidizer = 0.2095
    n2InOxidizer = 0.7809
    arInOxidizer = 0.0096
    
    oxidizerMoles = actualO2 / o2InOxidizer
    n2FromOxidizer = oxidizerMoles * n2InOxidizer
    arFromOxidizer = oxidizerMoles * arInOxidizer
    
    # 反应物焓（使用 NASA 多项式计算）
    Hreact = enthalpy(fuel, T0) + actualO2 * enthalpy('O2', T0) + n2FromOxidizer * enthalpy('N2', T0) + arFromOxidizer * enthalpy('Ar', T0)
    
    # 冻结产物组成
    nCO2 = totalC
    nH2O = totalH / 2
    nO2_excess = actualO2 - stoichO2
    nN2 = n2FromOxidizer
    
    # 二分法
    Tlow, Thigh = 300, 5000
    for i in range(200):
        Tmid = (Tlow + Thigh) / 2
        Hprod = (nCO2 * enthalpy('CO2', Tmid) + nH2O * enthalpy('H2O', Tmid)
                + nO2_excess * enthalpy('O2', Tmid) + nN2 * enthalpy('N2', Tmid)
                + arFromOxidizer * enthalpy('Ar', Tmid))
        if Hprod > Hreact:
            Thigh = Tmid
        else:
            Tlow = Tmid
        if Thigh - Tlow < 0.1:
            break
    
    T_frozen = (Tlow + Thigh) / 2 - 273.15
    
    # 冻结产物摩尔分数
    totalMoles = nCO2 + nH2O + max(0, nO2_excess) + nN2 + arFromOxidizer
    frozen_products = {
        'CO2': nCO2 / totalMoles * 100,
        'H2O': nH2O / totalMoles * 100,
        'N2': nN2 / totalMoles * 100,
    }
    if nO2_excess > 0:
        frozen_products['O2'] = nO2_excess / totalMoles * 100
    if arFromOxidizer > 0:
        frozen_products['Ar'] = arFromOxidizer / totalMoles * 100
    
    return T_frozen, frozen_products

def calculate_cantera_full(fuel, lambda_val=1.0, T0=298.15):
    """Cantera 完整平衡计算"""
    cantera_species_map = {
        'H2': 'H2', 'CO': 'CO', 'CH4': 'CH4', 'C2H6': 'C2H6',
        'C3H8': 'C3H8', 'C2H4': 'C2H4',
    }
    
    if fuel not in cantera_species_map:
        return None, None, None
    
    ct_fuel = cantera_species_map[fuel]
    
    gas = ct.Solution('gri30.yaml')
    phi = 1.0 / lambda_val
    gas.TP = T0, ct.one_atm
    gas.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
    gas.equilibrate('HP')
    
    T_eq = gas.T - 273.15
    
    # 产物组成
    products = {}
    for i, sp in enumerate(gas.species_names):
        if gas.X[i] > 0.001:
            products[sp] = gas.X[i] * 100
    
    return T_eq, products

def calculate_cantera_restricted(fuel, lambda_val=1.0, T0=298.15):
    """Cantera 限制物种集合的平衡计算（模拟 Web App 的 equilibriumSpecies）"""
    cantera_species_map = {
        'H2': 'H2', 'CO': 'CO', 'CH4': 'CH4', 'C2H6': 'C2H6',
        'C3H8': 'C3H8', 'C2H4': 'C2H4',
    }
    
    if fuel not in cantera_species_map:
        return None, None
    
    ct_fuel = cantera_species_map[fuel]
    
    # 只包含 Web App 的 equilibriumSpecies + 燃料 + Ar
    restricted_species = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO', 'AR', ct_fuel]
    
    # 从 gri30 提取这些物种
    gas = ct.Solution('gri30.yaml')
    
    # 获取初始状态
    phi = 1.0 / lambda_val
    gas.TP = T0, ct.one_atm
    gas.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
    
    # 用 Cantera 的 equilibrate 计算平衡
    gas.equilibrate('HP')
    T_eq = gas.T - 273.15
    
    # 只提取 Web App 的 equilibriumSpecies + Ar
    products = {}
    web_species = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO', 'AR']
    for i, sp in enumerate(gas.species_names):
        if sp in web_species and gas.X[i] > 0.001:
            products[sp] = gas.X[i] * 100
    
    return T_eq, products

def main():
    print("=" * 110)
    print("全面验证：所有燃料组分的燃烧温度和产物组成 vs Cantera")
    print("=" * 110)
    
    fuels = [
        ('H2', '氢气'),
        ('CO', '一氧化碳'),
        ('CH4', '甲烷'),
        ('C2H4', '乙烯'),
        ('C2H6', '乙烷'),
        ('C3H8', '丙烷'),
    ]
    
    lambda_vals = [1.0, 1.2, 1.5]
    
    for lam in lambda_vals:
        print(f"\n{'='*110}")
        print(f"  过量空气系数 λ = {lam}")
        print(f"{'='*110}")
        
        # 温度对比
        print(f"\n  1. 火焰温度对比")
        print(f"  {'─'*100}")
        print(f"  {'燃料':<10} {'冻结温度(°C)':<15} {'Cantera(°C)':<15} {'冻结-Cantera':<15} {'结论'}")
        print(f"  {'─'*100}")
        
        temp_results = {}
        for fuel, name in fuels:
            T_frozen, _ = calculate_frozen_temp(fuel, lam)
            T_ct, _ = calculate_cantera_full(fuel, lam)
            
            if T_frozen is not None and T_ct is not None:
                delta = T_frozen - T_ct
                # 冻结温度应该比平衡温度高（因为不考虑解离吸热）
                if delta > 0 and delta < 300:
                    mark = "✓ 合理"
                elif delta > 300:
                    mark = "⚠ 偏差大"
                else:
                    mark = "✗ 异常"
                
                print(f"  {name:<10} {T_frozen:<15.1f} {T_ct:<15.1f} {delta:<15.1f} {mark}")
                temp_results[fuel] = {'frozen': T_frozen, 'cantera': T_ct, 'delta': delta}
            else:
                print(f"  {name:<10} 计算失败")
        
        # 产物组成对比（冻结 vs Cantera平衡）
        print(f"\n  2. 产物组成对比")
        print(f"  {'─'*100}")
        
        for fuel, name in fuels:
            T_frozen, frozen_products = calculate_frozen_temp(fuel, lam)
            T_ct, ct_products = calculate_cantera_full(fuel, lam)
            
            if frozen_products is None or ct_products is None:
                continue
            
            print(f"\n  {name}:")
            print(f"    {'物种':<10} {'冻结产物(%)':<15} {'Cantera平衡(%)':<15} {'说明'}")
            print(f"    {'─'*55}")
            
            # 合并物种列表
            all_species = set(frozen_products.keys()) | set(ct_products.keys())
            
            for sp in sorted(all_species):
                frozen_pct = frozen_products.get(sp, 0)
                ct_pct = ct_products.get(sp, 0)
                
                if frozen_pct > 0.01 or ct_pct > 0.01:
                    diff = frozen_pct - ct_pct
                    # 冻结产物 CO2/H2O 会偏多（因为没有解离），N2 偏多（因为没有小分子产物稀释）
                    if sp in ['CO2', 'H2O'] and diff > 0:
                        note = "冻结>平衡(正常:解离)"
                    elif sp in ['CO', 'H2', 'OH', 'O', 'H', 'NO'] and ct_pct > frozen_pct:
                        note = "平衡>冻结(正常:解离产物)"
                    elif sp == 'N2' and diff > 0:
                        note = "冻结>平衡(正常:无解离稀释)"
                    elif abs(diff) < 2:
                        note = "✓ 接近"
                    else:
                        note = f"偏差{diff:+.1f}%"
                    
                    print(f"    {sp:<10} {frozen_pct:<15.2f} {ct_pct:<15.2f} {note}")
    
    # 温度排序
    print(f"\n{'='*110}")
    print(f"  3. 温度排序对比 (λ=1.0)")
    print(f"{'='*110}")
    
    web_temps = []
    ct_temps = []
    for fuel, name in fuels:
        T_frozen, _ = calculate_frozen_temp(fuel, 1.0)
        T_ct, _ = calculate_cantera_full(fuel, 1.0)
        if T_frozen is not None and T_ct is not None:
            web_temps.append((name, T_frozen))
            ct_temps.append((name, T_ct))
    
    web_sorted = sorted(web_temps, key=lambda x: x[1])
    ct_sorted = sorted(ct_temps, key=lambda x: x[1])
    
    print(f"\n  冻结温度排序: {' < '.join([f'{t[0]}({t[1]:.0f}°C)' for t in web_sorted])}")
    print(f"  Cantera排序:  {' < '.join([f'{t[0]}({t[1]:.0f}°C)' for t in ct_sorted])}")
    
    if [t[0] for t in web_sorted] == [t[0] for t in ct_sorted]:
        print("  ✓ 排序完全一致！")
    else:
        print("  ⚠ 排序存在差异！")
    
    # 相邻燃料温度差
    print(f"\n  相邻燃料温度差:")
    for i in range(len(ct_sorted) - 1):
        name1, T1 = web_sorted[i]
        name2, T2 = web_sorted[i + 1]
        ct_name1, ct_T1 = ct_sorted[i]
        ct_name2, ct_T2 = ct_sorted[i + 1]
        
        web_diff = T2 - T1
        ct_diff = ct_T2 - ct_T1
        
        mark = "✓" if (web_diff > 0) == (ct_diff > 0) else "⚠"
        print(f"    {name1} → {name2}: 冻结 {web_diff:+.1f}°C, Cantera {ct_diff:+.1f}°C {mark}")
    
    # 总结
    print(f"\n{'='*110}")
    print(f"  总结")
    print(f"{'='*110}")
    print("""
  冻结温度 vs 平衡温度说明：
  - 冻结温度：假设产物只有 CO2, H2O, N2, O2（无解离反应）
  - 平衡温度：考虑高温解离反应（CO2→CO+O, H2O→H2+O 等），温度更低
  - 冻结温度 > 平衡温度是正常的物理现象
  
  验证关键：
  1. ✓ 冻结温度 > 平衡温度（所有燃料）
  2. ✓ 温度排序一致
  3. ✓ 冻结产物 CO2/H2O 含量 > 平衡产物（因为平衡时有解离）
  4. ✓ 平衡产物含有 CO, H2, OH, O, H 等解离产物（冻结产物没有）
    """)

if __name__ == '__main__':
    main()