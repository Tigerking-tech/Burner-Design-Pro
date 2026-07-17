#!/usr/bin/env python3
"""
3E Plus 对比验证用例 (Insulation Thickness Calculator)
=====================================================
对照 3E Plus (NAIMA) 输入字段约定:
  - Pipe Size        : NPS + Schedule (STD 默认)
  - Base Metal       : Pipe material (Carbon Steel / Stainless / Copper / ...)
  - Insulation       : Material + Conductivity
  - Operating Temp   : Fluid temperature [°C]
  - Ambient Temp     : [°C]
  - Wind Speed       : [m/s]  (3E Plus 直接给数值, 我们通过 environment 选项映射)
  - Surface Emittance: jacket emissivity
  - Calculation Mode : Max Surface Temp / Max Heat Loss / Anti-Condensation

每组用例给出: 输入参数 + 我们参考实现的输出 + 3E Plus 应输出对照项.
用户在 3E Plus 中输入完全相同参数, 比对:
  1. Required Insulation Thickness (mm)
  2. Surface Temperature (°C)
  3. Heat Loss (W/m 或 W/m²)
  4. Interface Temperature (°C)  —— 3E Plus 在 "Layer Temperatures" 里输出

判定合格阈值:
  - 厚度  : ±5% 或 ±2mm (取大)
  - 表面温度: ±2°C
  - 热损失  : ±5%
  - 界面温度: ±2°C (金属管壁 R_wall 很小, 界面温度应非常接近介质温度)
"""

from insulation_reference import calculate, PIPE_MATERIALS

# 测试用例覆盖:
#   Case 1: 2" 碳钢 + 矿棉, 表面温度 50°C, 室内         —— 基准
#   Case 2: 4" 不锈钢 316 + 硅酸钙, 表面温度 55°C, 中风 —— 不锈钢 (低 k) 工况
#   Case 3: 6" 碳钢 + 矿棉, 热损失限 50 W/m, 室外大风   —— heatloss 模式
#   Case 4: 2" 铜 + PU 保温, 防结露, 80% RH 室内        —— condensation 模式 + 铜管
#   Case 5: 8" 碳钢 + 陶瓷纤维, 高温 450°C→60°C, 室内   —— 高温 + 界面温度校核
#   Case 6: 4" PVC + 矿棉, 表面温度 40°C, 室内          —— 非金属管 (大 R_wall)

# kCoeff (W/m·K/°C) —— 与项目 InsulationCalculatorPage.tsx materialProperties 一致
KCOEFF = {
    'mineralwool':     9.4e-5,
    'glasswool':       8.5e-5,
    'calciumsilicate': 1.1e-4,
    'polyurethane':    5e-5,
    'ceramicfiber':    1.6e-4,
    'custom':          0.00018,
}

# 保温材质名 (与 3E Plus 提供的材料名对照)
INS_NAME = {
    'mineralwool':     'Mineral Wool (k0=0.0316)',
    'glasswool':       'Glass Wool (k0=0.028)',
    'calciumsilicate': 'Calcium Silicate (k0=0.038)',
    'polyurethane':    'Polyurethane (k0=0.023)',
    'ceramicfiber':    'Ceramic Fiber (k0=0.042)',
}

# 测试用例 (输入字段与项目页面对应)
TEST_CASES = [
    {
        'name': 'Case 1: 2" Carbon Steel + Mineral Wool, surface 50°C, indoor',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '2"', 'outerDiameter': 60.3, 'wallThickness': 3.91,
        'pipeMaterial': 'carbon_steel',
        'materialType': 'mineralwool', 'k': 0.0316, 'kCoeff': KCOEFF['mineralwool'],
        'insulationMaxTemp': 650,
        'mode': 'surface', 'targetSurfaceTemp': 50.0,
        'mediumTemp': 150.0, 'ambientTemp': 20.0,
        'windSpeed': 0.0, 'emittance': 0.9, 'operatingHours': 8760,
    },
    {
        'name': 'Case 2: 4" Stainless 316 + Calcium Silicate, surface 55°C, moderate wind',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '4"', 'outerDiameter': 114.3, 'wallThickness': 6.02,
        'pipeMaterial': 'stainless_316',
        'materialType': 'calciumsilicate', 'k': 0.038, 'kCoeff': KCOEFF['calciumsilicate'],
        'insulationMaxTemp': 650,
        'mode': 'surface', 'targetSurfaceTemp': 55.0,
        'mediumTemp': 250.0, 'ambientTemp': 25.0,
        'windSpeed': 5.0, 'emittance': 0.7, 'operatingHours': 8000,
    },
    {
        'name': 'Case 3: 6" Carbon Steel + Mineral Wool, heat loss ≤ 50 W/m, strong wind',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '6"', 'outerDiameter': 168.3, 'wallThickness': 7.11,
        'pipeMaterial': 'carbon_steel',
        'materialType': 'mineralwool', 'k': 0.0316, 'kCoeff': KCOEFF['mineralwool'],
        'insulationMaxTemp': 650,
        'mode': 'heatloss', 'targetHeatLoss': 50.0,   # W/m (界面 flux×面积换算)
        'mediumTemp': 200.0, 'ambientTemp': 15.0,
        'windSpeed': 10.0, 'emittance': 0.7, 'operatingHours': 8000,
    },
    {
        'name': 'Case 4: 2" Copper + PU, anti-condensation, RH 80%, indoor',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '2"', 'outerDiameter': 60.3, 'wallThickness': 3.91,
        'pipeMaterial': 'copper',
        'materialType': 'polyurethane', 'k': 0.023, 'kCoeff': KCOEFF['polyurethane'],
        'insulationMaxTemp': 120,
        'mode': 'condensation', 'relativeHumidity': 80.0,
        'mediumTemp': 10.0, 'ambientTemp': 30.0,
        'windSpeed': 0.0, 'emittance': 0.9, 'operatingHours': 4380,
    },
    {
        'name': 'Case 5: 8" Carbon Steel + Ceramic Fiber, surface 60°C, indoor, high temp',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '8"', 'outerDiameter': 219.1, 'wallThickness': 8.18,
        'pipeMaterial': 'carbon_steel',
        'materialType': 'ceramicfiber', 'k': 0.042, 'kCoeff': KCOEFF['ceramicfiber'],
        'insulationMaxTemp': 1260,
        'mode': 'surface', 'targetSurfaceTemp': 60.0,
        'mediumTemp': 450.0, 'ambientTemp': 30.0,
        'windSpeed': 0.0, 'emittance': 0.9, 'operatingHours': 8000,
    },
    {
        'name': 'Case 6: 4" PVC + Mineral Wool, surface 40°C, indoor (non-metallic pipe)',
        'equipmentType': 'pipe', 'insulationPosition': 'external',
        'pipeSize': '4"', 'outerDiameter': 114.3, 'wallThickness': 6.02,
        'pipeMaterial': 'pvc',
        'materialType': 'mineralwool', 'k': 0.0316, 'kCoeff': KCOEFF['mineralwool'],
        'insulationMaxTemp': 650,
        'mode': 'surface', 'targetSurfaceTemp': 40.0,
        'mediumTemp': 55.0, 'ambientTemp': 20.0,
        'windSpeed': 0.0, 'emittance': 0.9, 'operatingHours': 4380,
    },
]


def fmt(v, unit='', w=8, prec=2):
    if v is None:
        return f"{'N/A':>{w}} {unit}"
    return f"{v:>{w}.{prec}f} {unit}"


def run():
    print('=' * 120)
    print('3E Plus 对比验证 —— Insulation Thickness Calculator (Reference Implementation)')
    print('=' * 120)
    print()
    for i, case in enumerate(TEST_CASES, 1):
        r = calculate(case)
        pipe_mat = PIPE_MATERIALS[case['pipeMaterial']]['name']
        ins_name = INS_NAME[case['materialType']]

        # 3E Plus 模式映射: surface→"Max Surface Temperature", heatloss→"Max Heat Loss",
        #                   condensation→"Personnel Protection / Anti-Condensation"
        mode_3e = {
            'surface':     'Max Surface Temperature',
            'heatloss':    'Max Heat Loss (W/m)',
            'condensation':'Anti-Condensation / Personnel Protection'
        }[case['mode']]

        print(f"--- {case['name']} ---")
        print(f"  Input (3E Plus 对齐):")
        print(f"    Pipe Size            : NPS {case['pipeSize']} STD  (OD {case['outerDiameter']} mm, WT {case['wallThickness']} mm)")
        print(f"    Base Metal           : {pipe_mat}  (k = {r['pipeMaterialK']:.1f} W/m·K)")
        print(f"    Insulation           : {ins_name}")
        print(f"    Insulation k0/kCoeff : {case['k']} / {case['kCoeff']:.2e} W/m·K/°C")
        print(f"    Operating Temp (Tf)  : {case['mediumTemp']:.1f} °C")
        print(f"    Ambient Temp  (Ta)   : {case['ambientTemp']:.1f} °C")
        print(f"    Wind Speed           : {case['windSpeed']:.1f} m/s")
        print(f"    Surface Emittance ε  : {case['emittance']:.2f}")
        print(f"    Calculation Mode     : {mode_3e}")
        if case['mode'] == 'surface':
            print(f"    Target Surface Temp  : {case['targetSurfaceTemp']:.1f} °C")
        elif case['mode'] == 'heatloss':
            # 项目里 targetHeatLoss 是 W/m² (heat flux); 3E Plus 通常给 W/m (linear)
            # 此 Case 3 中我们将 50 W/m² 作为 heat flux 输入
            print(f"    Target Heat Flux     : {case['targetHeatLoss']:.1f} W/m²")
        else:
            print(f"    Relative Humidity    : {case['relativeHumidity']:.0f} %")

        print(f"  Our Reference Output:")
        print(f"    Required Thickness   : {fmt(r['thickness_mm'], 'mm', 8, 2)}   (standard: {r['standardThickness']} mm)")
        print(f"    Surface Temperature  : {fmt(r['surfaceTemp'], '°C', 8, 2)}")
        if r['linearHeatLoss'] is not None:
            print(f"    Linear Heat Loss     : {fmt(abs(r['linearHeatLoss']), 'W/m', 8, 2)}")
        print(f"    Heat Flux            : {fmt(abs(r['heatFlux']), 'W/m²', 8, 2)}")
        print(f"    Interface Temp       : {fmt(r['interfaceTemp'], '°C', 8, 2)}   (insulation max {case['insulationMaxTemp']} °C)")
        print(f"    Conv. coef hc        : {fmt(r['hc'], 'W/m²K', 8, 2)}")
        print(f"    Rad.  coef hr        : {fmt(r['hr'], 'W/m²K', 8, 2)}")
        print(f"    Total h              : {fmt(r['h'], 'W/m²K', 8, 2)}")
        if r.get('dewPoint') is not None:
            print(f"    Dew Point            : {fmt(r['dewPoint'], '°C', 8, 2)}")
        if r['warnings']:
            print(f"    ⚠ Warnings:")
            for w in r['warnings']:
                print(f"      - {w}")
        print()
        print(f"  >> 请在 3E Plus 中输入上述相同参数, 比对:")
        print(f"     1) Required Insulation Thickness  (期望 ≈ {r['thickness_mm']:.1f} mm, 允差 ±5% / ±2mm)")
        print(f"     2) Surface Temperature            (期望 ≈ {r['surfaceTemp']:.1f} °C, 允差 ±2°C)")
        if r['linearHeatLoss'] is not None:
            print(f"     3) Linear Heat Loss               (期望 ≈ {abs(r['linearHeatLoss']):.1f} W/m, 允差 ±5%)")
        print(f"     4) Interface Temperature          (期望 ≈ {r['interfaceTemp']:.1f} °C, 允差 ±2°C)")
        print()
        print('-' * 120)
        print()


if __name__ == '__main__':
    run()
