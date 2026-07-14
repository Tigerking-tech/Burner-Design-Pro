#!/usr/bin/env python3
"""
验证 Thermodynamic Properties（Total Moles、ΔG、Cp、γ）与 Cantera 的一致性
使用更简单的方法：基于平衡组成计算
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
    'CO2': {'Tmid': 1000,
        'low': { 'a': [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222] },
        'high': { 'a': [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855] } },
    'H2O': {'Tmid': 1000,
        'low': { 'a': [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208] },
        'high': { 'a': [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571] } },
    'N2': {'Tmid': 1000,
        'low': { 'a': [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468] },
        'high': { 'a': [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252] } },
    'O2': {'Tmid': 1000,
        'low': { 'a': [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573] },
        'high': { 'a': [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184] } },
    'CO': {'Tmid': 1000,
        'low': { 'a': [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928] },
        'high': { 'a': [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979] } },
    'H2': {'Tmid': 1000,
        'low': { 'a': [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238] },
        'high': { 'a': [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887] } },
    'OH': {'Tmid': 1000,
        'low': { 'a': [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458] },
        'high': { 'a': [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662] } },
    'O': {'Tmid': 1000,
        'low': { 'a': [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346] },
        'high': { 'a': [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457] } },
    'H': {'Tmid': 1000,
        'low': { 'a': [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853] },
        'high': { 'a': [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494] } },
    'NO': {'Tmid': 1000,
        'low': { 'a': [4.21847630, -0.004638976, 1.10410220e-05, -9.33613540e-09, 2.80357700e-12, 9844.623, 2.28084640] },
        'high': { 'a': [3.26060560, 0.0011911043, -4.29170480e-07, 6.94576690e-11, -4.03360990e-15, 9920.9746, 6.3693027] } },
    'Ar': {'Tmid': 1000,
        'low': { 'a': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] },
        'high': { 'a': [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] } },
}

atomicComp = {
    'H2': {'c': 0, 'h': 2, 'o': 0, 'n': 0}, 'CO': {'c': 1, 'h': 0, 'o': 1, 'n': 0},
    'CH4': {'c': 1, 'h': 4, 'o': 0, 'n': 0}, 'C2H6': {'c': 2, 'h': 6, 'o': 0, 'n': 0},
    'C3H8': {'c': 3, 'h': 8, 'o': 0, 'n': 0}, 'C4H10': {'c': 4, 'h': 10, 'o': 0, 'n': 0},
    'C2H4': {'c': 2, 'h': 4, 'o': 0, 'n': 0},
    'CO2': {'c': 1, 'h': 0, 'o': 2, 'n': 0}, 'H2O': {'c': 0, 'h': 2, 'o': 1, 'n': 0},
    'O2': {'c': 0, 'h': 0, 'o': 2, 'n': 0}, 'N2': {'c': 0, 'h': 0, 'o': 0, 'n': 2},
    'OH': {'c': 0, 'h': 1, 'o': 1, 'n': 0}, 'O': {'c': 0, 'h': 0, 'o': 1, 'n': 0},
    'H': {'c': 0, 'h': 1, 'o': 0, 'n': 0}, 'NO': {'c': 0, 'h': 0, 'o': 1, 'n': 1},
}

equilibriumSpecies = ['CO2', 'H2O', 'CO', 'H2', 'O2', 'N2', 'OH', 'O', 'H', 'NO']

def getCoeffs(species, T):
    if species not in nasaCoeffs:
        return None
    data = nasaCoeffs[species]
    return data['low']['a'] if T < data['Tmid'] else data['high']['a']

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

def cp(species, T):
    a = getCoeffs(species, T)
    if a is None:
        return 0
    return R * (a[0] + a[1] * T + a[2] * T * T + a[3] * T * T * T + a[4] * T * T * T * T)

def solveLinear(A, b):
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
    activeElements = [el for el in ['c', 'h', 'o', 'n'] if b[el] > 1e-12]
    ne = len(activeElements)
    if ne == 0:
        return {}
    
    elementIndex = {el: i for i, el in enumerate(activeElements)}
    
    activeSpecies = [sp for sp in equilibriumSpecies if all(
        (b[el] < 1e-12 and atomicComp[sp][el] == 0) or b[el] >= 1e-12
        for el in ['c', 'h', 'o', 'n']
    )]
    
    RT = R * T
    ns = len(activeSpecies)
    
    def computePi(lam):
        return [math.exp(max(-700, min(700, -chemPotential(sp, T, P)/RT + sum(atomicComp[sp][el]*lam[elementIndex[el]]/RT for el in activeElements))))
                for sp in activeSpecies]
    
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
        
        sumEl = [sum(atomicComp[activeSpecies[i]][el] * pi[i] for i in range(ns)) for el in activeElements]
        
        Rvec = [0] * ne
        for j in range(ne - 1):
            Rvec[j] = b[activeElements[j]] * sumEl[ne - 1] - bRef * sumEl[j]
        Rvec[ne - 1] = sumPi - 1.0
        
        err = math.sqrt(sum(v * v for v in Rvec))
        if err < 1e-10:
            nTotal = bRef / sumEl[ne - 1]
            return {activeSpecies[i]: nTotal * pi[i] for i in range(ns)}
        
        J = [[0] * ne for _ in range(ne)]
        for k in range(ne):
            sumAkPi = sum(atomicComp[activeSpecies[i]][activeElements[k]] * pi[i] for i in range(ns)) / RT
            
            for j in range(ne - 1):
                crossJ = sum(atomicComp[activeSpecies[i]][activeElements[j]] * atomicComp[activeSpecies[i]][activeElements[k]] * pi[i] for i in range(ns)) / RT
                crossRef = sum(atomicComp[activeSpecies[i]][activeElements[ne - 1]] * atomicComp[activeSpecies[i]][activeElements[k]] * pi[i] for i in range(ns)) / RT
                J[j][k] = b[activeElements[j]] * crossRef - bRef * crossJ
            
            J[ne - 1][k] = sumAkPi
        
        delta = solveLinear(J, [-v for v in Rvec])
        if delta is None:
            break
        
        stepScale = 1.0
        for attempt in range(15):
            newLambda = [lam[j] + stepScale * delta[j] for j in range(ne)]
            newPi = computePi(newLambda)
            newSumEl = [sum(atomicComp[activeSpecies[i]][el] * newPi[i] for i in range(ns)) for el in activeElements]
            newRvec = [0] * ne
            for j in range(ne - 1):
                newRvec[j] = b[activeElements[j]] * newSumEl[ne - 1] - bRef * newSumEl[j]
            newRvec[ne - 1] = sum(newPi) - 1.0
            newErr = math.sqrt(sum(v * v for v in newRvec))
            if newErr < err or stepScale < 1e-6:
                lam = newLambda
                break
            stepScale *= 0.5
    
    pi = computePi(lam)
    sumEl = [sum(atomicComp[activeSpecies[i]][el] * pi[i] for i in range(ns)) for el in activeElements]
    nTotal = bRef / sumEl[ne - 1]
    return {activeSpecies[i]: max(0, nTotal * pi[i]) for i in range(ns)}

def calculate_web(fuel, lambda_val=1.0):
    comp = atomicComp[fuel]
    totalC, totalH, totalO = comp['c'], comp['h'], comp['o']
    
    stoichO2 = totalC + totalH / 4 - totalO / 2
    if stoichO2 <= 0:
        return None
    
    actualO2 = stoichO2 * lambda_val
    o2InOxidizer = 0.2095
    n2InOxidizer = 0.7809
    arInOxidizer = 0.0096
    
    oxidizerMoles = actualO2 / o2InOxidizer
    n2FromOxidizer = oxidizerMoles * n2InOxidizer
    arFromOxidizer = oxidizerMoles * arInOxidizer
    
    b = {'c': totalC, 'h': totalH, 'o': totalO + actualO2 * 2, 'n': n2FromOxidizer * 2}
    arMoles = arFromOxidizer
    
    T0 = 298.15
    Hreact = enthalpy(fuel, T0) + actualO2 * enthalpy('O2', T0) + n2FromOxidizer * enthalpy('N2', T0) + arMoles * enthalpy('Ar', T0)
    
    def productEnthalpy(T):
        eq = equilibriumComposition(b, T, 1)
        return sum((eq.get(sp, 0) * enthalpy(sp, T)) for sp in equilibriumSpecies) + arMoles * enthalpy('Ar', T)
    
    Tlow, Thigh = 300, 4000
    for i in range(200):
        Tmid = (Tlow + Thigh) / 2
        Hmid = productEnthalpy(Tmid)
        if Hmid > Hreact:
            Thigh = Tmid
        else:
            Tlow = Tmid
        if Thigh - Tlow < 0.1:
            break
    T_eq_K = (Tlow + Thigh) / 2
    
    composition = equilibriumComposition(b, T_eq_K, 1)
    totalMoles = sum(composition.values()) + arMoles
    
    deltaG = sum((composition.get(sp, 0) * chemPotential(sp, T_eq_K, 1)) for sp in equilibriumSpecies)
    
    cpMix = sum((composition.get(sp, 0) * cp(sp, T_eq_K)) for sp in equilibriumSpecies) / totalMoles
    
    gamma = cpMix / (cpMix - R)
    
    return {
        'T_eq': T_eq_K - 273.15,
        'totalMoles': totalMoles,
        'deltaG': deltaG,
        'cpMix': cpMix,
        'gamma': gamma,
    }

def calculate_cantera(fuel, lambda_val=1.0):
    cantera_map = {'H2': 'H2', 'CO': 'CO', 'CH4': 'CH4', 'C2H6': 'C2H6', 'C3H8': 'C3H8', 'C2H4': 'C2H4'}
    if fuel not in cantera_map:
        return None
    
    gas = ct.Solution('gri30.yaml')
    phi = 1.0 / lambda_val
    gas.TP = 298.15, ct.one_atm
    gas.set_equivalence_ratio(phi, f'{cantera_map[fuel]}:1', 'O2:1, N2:3.76')
    gas.equilibrate('HP')
    
    T_eq = gas.T - 273.15
    T_eq_K = gas.T
    
    # 计算实际摩尔数（与 Web App 一致，基于1mol燃料）
    # 1mol燃料需要的氧化剂
    comp = atomicComp[fuel]
    totalC, totalH, totalO = comp['c'], comp['h'], comp['o']
    stoichO2 = totalC + totalH / 4 - totalO / 2
    actualO2 = stoichO2 * lambda_val
    
    o2InOxidizer = 0.2095
    n2InOxidizer = 0.7809
    arInOxidizer = 0.0096
    
    oxidizerMoles = actualO2 / o2InOxidizer
    n2FromOxidizer = oxidizerMoles * n2InOxidizer
    arFromOxidizer = oxidizerMoles * arInOxidizer
    
    # 初始总摩尔数（1mol燃料 + 氧化剂）
    initialTotalMoles = 1 + oxidizerMoles
    
    # 提取平衡组成（摩尔分数）并计算实际摩尔数
    ct_composition = {}
    web_species_map = {'CO2': 'CO2', 'H2O': 'H2O', 'CO': 'CO', 'H2': 'H2', 'O2': 'O2', 'N2': 'N2', 'OH': 'OH', 'O': 'O', 'H': 'H', 'NO': 'NO'}
    
    totalMoles_ct = 0
    for ct_sp, web_sp in web_species_map.items():
        idx = gas.species_index(ct_sp)
        if idx >= 0:
            ct_composition[web_sp] = gas.X[idx] * initialTotalMoles
            totalMoles_ct += gas.X[idx] * initialTotalMoles
    
    ar_idx = gas.species_index('AR')
    ar_moles = gas.X[ar_idx] * initialTotalMoles if ar_idx >= 0 else arFromOxidizer
    totalMoles_ct += ar_moles
    ct_composition['Ar'] = ar_moles
    
    # 使用 NASA 系数计算热力学性质
    deltaG = sum((ct_composition.get(sp, 0) * chemPotential(sp, T_eq_K, 1)) for sp in equilibriumSpecies)
    
    cpMix = sum((ct_composition.get(sp, 0) * cp(sp, T_eq_K)) for sp in equilibriumSpecies) / totalMoles_ct
    
    gamma = cpMix / (cpMix - R)
    
    return {
        'T_eq': T_eq,
        'totalMoles': totalMoles_ct,
        'deltaG': deltaG,
        'cpMix': cpMix,
        'gamma': gamma,
    }

def main():
    print("=" * 120)
    print("验证 Thermodynamic Properties 与 Cantera 一致性")
    print("=" * 120)
    
    fuels = [
        ('H2', '氢气'),
        ('CO', '一氧化碳'),
        ('CH4', '甲烷'),
        ('C2H4', '乙烯'),
        ('C2H6', '乙烷'),
        ('C3H8', '丙烷'),
    ]
    
    lambda_val = 1.0
    
    print(f"\n过量空气系数 λ = {lambda_val}")
    print(f"\n{'燃料':<10} {'参数':<12} {'Web App':<15} {'Cantera':<15} {'偏差':<12} {'结论'}")
    print("-" * 90)
    
    for fuel, name in fuels:
        web = calculate_web(fuel, lambda_val)
        ct_result = calculate_cantera(fuel, lambda_val)
        
        if web and ct_result:
            params = [
                ('Total Moles', web['totalMoles'], ct_result['totalMoles'], 'mol'),
                ('ΔG', web['deltaG'], ct_result['deltaG'], 'kJ'),
                ('Cp', web['cpMix'], ct_result['cpMix'], 'kJ/mol/K'),
                ('γ', web['gamma'], ct_result['gamma'], ''),
            ]
            
            for param_name, web_val, ct_val, unit in params:
                diff = web_val - ct_val
                if param_name == 'Total Moles':
                    ok = abs(diff) < 0.05
                elif param_name == 'ΔG':
                    ok = abs(diff) < 50
                elif param_name == 'Cp':
                    ok = abs(diff) < 0.005
                elif param_name == 'γ':
                    ok = abs(diff) < 0.01
                else:
                    ok = False
                
                mark = '✓' if ok else '⚠' if abs(diff) < abs(ct_val)*0.05 else '✗'
                
                print(f"{name:<10} {param_name:<12} {web_val:<15.4f} {ct_val:<15.4f} {diff:<12.4f} {mark}")
    
    print(f"\n{'=' * 120}")
    print("说明：")
    print("  - Total Moles: 平衡产物总摩尔数（基于1mol燃料计算）")
    print("  - ΔG: 吉布斯自由能变化 = Σ(n_i × μ_i)")
    print("  - Cp: 混合物定压热容 = Σ(n_i × Cp_i) / totalMoles")
    print("  - γ: 等熵指数 = Cp / Cv = Cp / (Cp - R)")
    print("  - Cantera 值使用 Cantera 的平衡组成 + NASA 系数计算")
    print()

if __name__ == '__main__':
    main()