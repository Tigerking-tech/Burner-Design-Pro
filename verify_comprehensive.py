#!/usr/bin/env python3
"""
全面验证：所有燃料组分的燃烧温度和产物组成 vs Cantera
使用与 FlameTemperaturePage.tsx 完全相同的计算逻辑
"""

import math
import sys
try:
    import cantera as ct
except ImportError:
    print("错误：需要安装 cantera")
    sys.exit(1)

R = 0.008314  # kJ/mol/K

# ============ 与项目同步的数据 ============

# NASA 系数（从 FlameTemperaturePage.tsx 提取）
nasaCoeffs = {
    'Ar': {
        'Tmid': 1000,
        'low': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491],
        'high': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491]
    },
    'CH4': {
        'Tmid': 1000,
        'low': [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376],
        'high': [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326]
    },
    'CO': {
        'Tmid': 1000,
        'low': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928],
        'high': [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979]
    },
    'CO2': {
        'Tmid': 1000,
        'low': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222],
        'high': [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855]
    },
    'C2H4': {
        'Tmid': 1000,
        'low': [3.95920148, -0.00757052247, 5.70990292e-05, -6.91588753e-08, 2.69884373e-11, 5089.77593, 4.09733096],
        'high': [3.99182761, 0.010483391, -3.71721385e-06, 5.94628514e-10, -3.53630526e-14, 4268.65819, -0.269052151]
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
    'H': {
        'Tmid': 1000,
        'low': [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853],
        'high': [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494]
    },
    'H2': {
        'Tmid': 1000,
        'low': [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238],
        'high': [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887]
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
    'O': {
        'Tmid': 1000,
        'low': [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346],
        'high': [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457]
    },
    'OH': {
        'Tmid': 1000,
        'low': [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458],
        'high': [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662]
    },
    'O2': {
        'Tmid': 1000,
        'low': [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573],
        'high': [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184]
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
    'NH3': {
        'Tmid': 1000,
        'low': [4.30177808, -0.0047712733, 2.19341619e-05, -2.29856489e-08, 8.28992268e-12, -6748.06394, -0.690644393],
        'high': [2.71709692, 0.00556856338, -1.76886396e-06, 2.6741726e-10, -1.52731419e-14, -6584.51989, 6.09289837]
    },
}

# 原子组成（与项目完全一致）
atomicComp = {
    'H2': {'c': 0, 'h': 2, 'o': 0, 'n': 0},
    'CO': {'c': 1, 'h': 0, 'o': 1, 'n': 0},
    'NH3': {'c': 0, 'h': 3, 'o': 0, 'n': 1},
    'H2S': {'c': 0, 'h': 2, 'o': 0, 'n': 0},
    'CH4': {'c': 1, 'h': 4, 'o': 0, 'n': 0},
    'C2H6': {'c': 2, 'h': 6, 'o': 0, 'n': 0},
    'C3H8': {'c': 3, 'h': 8, 'o': 0, 'n': 0},
    'C4H10': {'c': 4, 'h': 10, 'o': 0, 'n': 0},
    'C2H4': {'c': 2, 'h': 4, 'o': 0, 'n': 0},
    # 产物物种
    'CO2': {'c': 1, 'h': 0, 'o': 2, 'n': 0},
    'H2O': {'c': 0, 'h': 2, 'o': 1, 'n': 0},
    'O2': {'c': 0, 'h': 0, 'o': 2, 'n': 0},
    'N2': {'c': 0, 'h': 0, 'o': 0, 'n': 2},
    'OH': {'c': 0, 'h': 1, 'o': 1, 'n': 0},
    'O': {'c': 0, 'h': 0, 'o': 1, 'n': 0},
    'H': {'c': 0, 'h': 1, 'o': 0, 'n': 0},
    'NO': {'c': 0, 'h': 0, 'o': 1, 'n': 1},
}

equilibriumSpecies = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO']

# ============ 热力学函数（与项目完全一致） ============

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

def entropy(species, T):
    a = getCoeffs(species, T)
    if a is None:
        return 0
    S_R = a[0] * math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
    return R * S_R

def chemPotential(species, T, P_bar=1):
    return enthalpy(species, T) - T * entropy(species, T) + R * T * math.log(max(P_bar, 1e-30))

def solveLinear(A, b):
    """高斯消元法求解线性方程组"""
    n = len(b)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for col in range(n):
        max_row = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[max_row] = M[max_row], M[col]
        if abs(M[col][col]) < 1e-30:
            return None
        for row in range(col + 1, n):
            factor = M[row][col] / M[col][col]
            for j in range(col, n + 1):
                M[row][j] -= factor * M[col][j]
    x = [0] * n
    for i in range(n - 1, -1, -1):
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return x

def equilibriumComposition(b, T, P=1):
    """与项目中完全相同的化学平衡计算"""
    activeElements = [el for el in ['c', 'h', 'o', 'n'] if b[el] > 1e-12]
    ne = len(activeElements)
    if ne == 0:
        return {}
    
    elementIndex = {el: i for i, el in enumerate(activeElements)}
    
    activeSpecies = [sp for sp in equilibriumSpecies if all(
        (b[el] < 1e-12 and atomicComp[sp][el] == 0) or b[el] >= 1e-12
        for el in ['c', 'h', 'o', 'n']
    )]
    
    # 过滤：只有当元素存在时，含有该元素的物种才能参与
    activeSpecies = [sp for sp in activeSpecies if all(
        b[el] >= 1e-12 or atomicComp[sp][el] == 0
        for el in ['c', 'h', 'o', 'n']
    )]
    
    RT = R * T
    ns = len(activeSpecies)
    
    def computePi(lam):
        result = []
        for sp in activeSpecies:
            comp = atomicComp[sp]
            mu = chemPotential(sp, T, P)
            arg = -mu / RT
            for el in activeElements:
                arg += comp[el] * lam[elementIndex[el]] / RT
            result.append(math.exp(max(-700, min(700, arg))))
        return result
    
    # 初始化 lambda
    lam = [0] * ne
    if 'o' in elementIndex:
        lam[elementIndex['o']] = chemPotential('O2', T, P) / 2
    if 'n' in elementIndex:
        lam[elementIndex['n']] = chemPotential('N2', T, P) / 2
    if 'c' in elementIndex and 'o' in elementIndex:
        lam[elementIndex['c']] = chemPotential('CO2', T, P) - 2 * lam[elementIndex['o']]
    if 'h' in elementIndex and 'o' in elementIndex:
        lam[elementIndex['h']] = (chemPotential('H2O', T, P) - lam[elementIndex['o']]) / 2
    
    refEl = activeElements[ne - 1]
    bRef = b[refEl]
    
    for iteration in range(300):
        pi = computePi(lam)
        sumPi = sum(pi)
        
        sumEl = []
        for el in activeElements:
            s = sum(atomicComp[activeSpecies[i]][el] * pi[i] for i in range(ns))
            sumEl.append(s)
        
        Rvec = [0] * ne
        for j in range(ne - 1):
            Rvec[j] = b[activeElements[j]] * sumEl[ne - 1] - bRef * sumEl[j]
        Rvec[ne - 1] = sumPi - 1.0
        
        err = math.sqrt(sum(v * v for v in Rvec))
        if err < 1e-10:
            nTotal = bRef / sumEl[ne - 1]
            result = {}
            for i in range(ns):
                result[activeSpecies[i]] = nTotal * pi[i]
            return result
        
        # Jacobian
        J = [[0] * ne for _ in range(ne)]
        for k in range(ne):
            sumAkPi = sum(atomicComp[activeSpecies[i]][activeElements[k]] * pi[i] for i in range(ns)) / RT
            
            for j in range(ne - 1):
                crossJ = 0
                crossRef = 0
                for i in range(ns):
                    comp = atomicComp[activeSpecies[i]]
                    val = comp[activeElements[j]] * comp[activeElements[k]] * pi[i] / RT
                    crossJ += val
                    crossRef += comp[activeElements[ne - 1]] * comp[activeElements[k]] * pi[i] / RT
                
                J[j][k] = (b[activeElements[j]] * crossRef - bRef * crossJ
                           if k != ne - 1
                           else b[activeElements[j]] * crossRef - bRef * crossJ)
                if k == ne - 1:
                    J[j][k] = b[activeElements[j]] * sumAkPi - bRef * sumAkPi if j != ne - 1 else -(sumAkPi + sumAkPi)
            
            if True:  # last row
                J[ne - 1][k] = sumAkPi if k != ne - 1 else sumAkPi
        
        # Fix last row
        for k in range(ne):
            J[ne - 1][k] = sum(atomicComp[activeSpecies[i]][activeElements[k]] * pi[i] for i in range(ns)) / RT
        
        delta = solveLinear(J, [-v for v in Rvec])
        if delta is None:
            break
        
        # 限幅
        for i in range(len(delta)):
            delta[i] = max(-RT * 10, min(RT * 10, delta[i]))
        
        for i in range(ne):
            lam[i] += delta[i]
    
    # 如果迭代未收敛，返回近似结果
    pi = computePi(lam)
    sumEl_last = [sum(atomicComp[activeSpecies[i]][el] * pi[i] for i in range(ns)) for el in activeElements]
    nTotal = bRef / sumEl_last[ne - 1] if abs(sumEl_last[ne - 1]) > 1e-30 else 1
    result = {}
    for i in range(ns):
        result[activeSpecies[i]] = max(0, nTotal * pi[i])
    return result

def productEnthalpy(b, T, arMoles=0, P=1):
    eq = equilibriumComposition(b, T, P)
    total = sum(eq.get(sp, 0) * enthalpy(sp, T) for sp in equilibriumSpecies)
    total += arMoles * enthalpy('Ar', T)
    return total

def calculate_web(fuel, lambda_val=1.0, T0=298.15):
    """Web App 计算：与 FlameTemperaturePage.tsx 逻辑完全一致"""
    if fuel not in atomicComp:
        return None
    
    comp = atomicComp[fuel]
    totalC, totalH, totalO, totalN = comp['c'], comp['h'], comp['o'], comp['n']
    
    stoichO2 = totalC + totalH / 4 - totalO / 2
    if stoichO2 <= 0:
        return None
    
    actualO2 = stoichO2 * lambda_val
    
    # 空气氧化剂
    o2InOxidizer = 0.2095
    n2InOxidizer = 0.7809
    arInOxidizer = 0.0096
    
    oxidizerMoles = actualO2 / o2InOxidizer
    n2FromOxidizer = oxidizerMoles * n2InOxidizer
    arFromOxidizer = oxidizerMoles * arInOxidizer
    
    b = {
        'c': totalC,
        'h': totalH,
        'o': totalO + actualO2 * 2,
        'n': totalN + n2FromOxidizer * 2
    }
    
    arMoles = arFromOxidizer
    
    # 反应物焓
    Hreact = enthalpy(fuel, T0) + actualO2 * enthalpy('O2', T0) + n2FromOxidizer * enthalpy('N2', T0) + arMoles * enthalpy('Ar', T0)
    
    # 平衡温度求解
    Tlow, Thigh = 300, 4000
    for i in range(200):
        Tmid = (Tlow + Thigh) / 2
        Hmid = productEnthalpy(b, Tmid, arMoles, 1)
        if Hmid > Hreact:
            Thigh = Tmid
        else:
            Tlow = Tmid
        if Thigh - Tlow < 0.1:
            break
    T_eq_K = (Tlow + Thigh) / 2
    
    # 冻结温度求解
    def frozenEnthalpy(T):
        nCO2 = totalC
        nH2O = totalH / 2
        nO2_excess = actualO2 - stoichO2
        nN2 = n2FromOxidizer + totalN / 2
        return (nCO2 * enthalpy('CO2', T) + nH2O * enthalpy('H2O', T)
                + nO2_excess * enthalpy('O2', T) + nN2 * enthalpy('N2', T)
                + arMoles * enthalpy('Ar', T))
    
    Tlow, Thigh = 300, 4000
    for i in range(200):
        Tmid = (Tlow + Thigh) / 2
        Hmid = frozenEnthalpy(Tmid)
        if Hmid > Hreact:
            Thigh = Tmid
        else:
            Tlow = Tmid
        if Thigh - Tlow < 0.1:
            break
    T_frozen_K = (Tlow + Thigh) / 2
    
    # 平衡产物组成
    composition = equilibriumComposition(b, T_eq_K, 1)
    totalMoles = sum(composition.values()) + arMoles
    
    products_mol_pct = {}
    for sp, moles in composition.items():
        products_mol_pct[sp] = (moles / totalMoles) * 100
    if arMoles > 0:
        products_mol_pct['Ar'] = (arMoles / totalMoles) * 100
    
    return {
        'T_frozen': T_frozen_K - 273.15,
        'T_equilibrium': T_eq_K - 273.15,
        'products': products_mol_pct,
    }

def calculate_cantera(fuel, lambda_val=1.0, T0=298.15):
    """使用 Cantera 计算"""
    cantera_species_map = {
        'H2': 'H2', 'CO': 'CO', 'CH4': 'CH4', 'C2H6': 'C2H6',
        'C3H8': 'C3H8', 'C2H4': 'C2H4',
    }
    
    if fuel not in cantera_species_map:
        return None
    
    ct_fuel = cantera_species_map[fuel]
    
    gas = ct.Solution('gri30.yaml')
    phi = 1.0 / lambda_val
    gas.TP = T0, ct.one_atm
    gas.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
    
    # 冻结温度：直接设置产物为完全燃烧产物，然后求温度
    gas_eq = ct.Solution('gri30.yaml')
    gas_eq.TPX = gas.T, gas.P, gas.TPY[2]  # 保存初始状态
    gas_eq.set_equivalence_ratio(phi, f'{ct_fuel}:1', 'O2:1, N2:3.76')
    gas_eq.equilibrate('HP')
    T_eq = gas_eq.T - 273.15
    
    # 产物组成
    products_mol_pct = {}
    for i, sp in enumerate(gas_eq.species_names):
        if gas_eq.X[i] > 0.001:  # 只显示 > 0.1% 的产物
            products_mol_pct[sp] = gas_eq.X[i] * 100
    
    return {
        'T_equilibrium': T_eq,
        'products': products_mol_pct,
    }

def main():
    print("=" * 100)
    print("全面验证：所有燃料组分的燃烧温度和产物组成 vs Cantera")
    print("=" * 100)
    print()
    
    # 所有可用燃料（Cantera gri30 支持的）
    fuels = [
        ('H2', '氢气'),
        ('CO', '一氧化碳'),
        ('CH4', '甲烷'),
        ('C2H4', '乙烯'),
        ('C2H6', '乙烷'),
        ('C3H8', '丙烷'),
    ]
    
    lambda_vals = [1.0, 1.2]
    
    for lam in lambda_vals:
        print(f"\n{'='*100}")
        print(f"  过量空气系数 λ = {lam}")
        print(f"{'='*100}")
        
        # 温度对比
        print(f"\n{'─'*100}")
        print(f"  1. 火焰温度对比")
        print(f"{'─'*100}")
        print(f"{'燃料':<12} {'Web冻结(°C)':<15} {'Web平衡(°C)':<15} {'Cantera(°C)':<15} {'Web-Ct冻结差':<15} {'Web-Ct平衡差':<15}")
        print(f"{'─'*100}")
        
        for fuel, name in fuels:
            web = calculate_web(fuel, lam)
            ct_result = calculate_cantera(fuel, lam)
            
            if web and ct_result:
                delta_frozen = web['T_frozen'] - ct_result['T_equilibrium']  # 冻结 vs 平衡（参考）
                delta_eq = web['T_equilibrium'] - ct_result['T_equilibrium']  # 平衡 vs 平衡
                
                print(f"{name:<12} {web['T_frozen']:<15.1f} {web['T_equilibrium']:<15.1f} {ct_result['T_equilibrium']:<15.1f} {delta_frozen:<15.1f} {delta_eq:<15.1f}")
            else:
                print(f"{name:<12} 计算失败")
        
        # 产物组成对比
        print(f"\n{'─'*100}")
        print(f"  2. 产物组成对比 (mol%)")
        print(f"{'─'*100}")
        
        for fuel, name in fuels:
            web = calculate_web(fuel, lam)
            ct_result = calculate_cantera(fuel, lam)
            
            if web and ct_result:
                print(f"\n  {name}:")
                
                # 收集所有产物
                all_species = set()
                for sp in web['products']:
                    if web['products'][sp] > 0.01:
                        all_species.add(sp)
                for sp in ct_result['products']:
                    if ct_result['products'][sp] > 0.01:
                        all_species.add(sp)
                
                # Cantera 物种名映射
                ct_name_map = {
                    'CO2': 'CO2', 'H2O': 'H2O', 'N2': 'N2', 'O2': 'O2',
                    'CO': 'CO', 'H2': 'H2', 'OH': 'OH', 'O': 'O', 'H': 'H',
                    'NO': 'NO', 'Ar': 'AR',
                }
                web_name_map = {v: k for k, v in ct_name_map.items()}
                
                print(f"    {'物种':<10} {'Web (mol%)':<15} {'Cantera (mol%)':<15} {'偏差':<10}")
                print(f"    {'─'*50}")
                
                for sp in sorted(all_species):
                    web_pct = web['products'].get(sp, 0)
                    # 在 Cantera 产物中查找对应物种
                    ct_sp = ct_name_map.get(sp, sp)
                    ct_pct = ct_result['products'].get(ct_sp, 0)
                    
                    if web_pct > 0.01 or ct_pct > 0.01:
                        diff = web_pct - ct_pct
                        mark = "✓" if abs(diff) < 2 else "⚠" if abs(diff) < 5 else "✗"
                        print(f"    {sp:<10} {web_pct:<15.2f} {ct_pct:<15.2f} {diff:+.2f} {mark}")
    
    # 总体结论
    print(f"\n{'='*100}")
    print(f"  总体结论")
    print(f"{'='*100}")
    
    # 检查温度排序
    print("\n  温度排序 (λ=1.0):")
    web_temps = []
    ct_temps = []
    for fuel, name in fuels:
        web = calculate_web(fuel, 1.0)
        ct_result = calculate_cantera(fuel, 1.0)
        if web and ct_result:
            web_temps.append((name, web['T_equilibrium']))
            ct_temps.append((name, ct_result['T_equilibrium']))
    
    web_sorted = sorted(web_temps, key=lambda x: x[1])
    ct_sorted = sorted(ct_temps, key=lambda x: x[1])
    
    print(f"    Web App:  {' < '.join([t[0] for t in web_sorted])}")
    print(f"    Cantera:  {' < '.join([t[0] for t in ct_sorted])}")
    
    if [t[0] for t in web_sorted] == [t[0] for t in ct_sorted]:
        print("    ✓ 排序完全一致！")
    else:
        print("    ⚠ 排序存在差异！")

if __name__ == '__main__':
    main()