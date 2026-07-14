"""
对比项目中的 NASA 系数与 Cantera nasa_gas 中的系数
"""
import yaml

# 读取 nasa_gas 物种
with open('/root/.pyenv/versions/3.14.4/lib/python3.14/site-packages/cantera/data/nasa_gas.yaml') as f:
    nasa_data = yaml.safe_load(f)

# 项目中的系数（从 FlameTemperaturePage.tsx 提取）
project_coeffs = {
    'CO₂': {
        'Tmid': 1000,
        'low': {'a': [2.35677352E+0, 8.98459677E-3, -7.12356269E-6, 2.45919022E-9, -1.43699548E-13, -4.83719697E+4, 9.90105222E+0]},
        'high': {'a': [3.85746029E+0, 4.41437026E-3, -2.21481404E-6, 5.23490188E-10, -4.72084164E-14, -4.87591660E+4, 2.27163806E+0]}
    },
    'H₂O': {
        'Tmid': 1000,
        'low': {'a': [4.19864056E+0, -2.03643410E-3, 6.52040211E-6, -5.48797062E-9, 1.77197817E-12, -3.02937267E+4, -8.49032208E-1]},
        'high': {'a': [3.03399249E+0, 2.17691804E-3, -1.64072518E-7, -9.70419870E-11, 1.68200992E-14, -3.00042971E+4, 4.96677010E+0]}
    },
    'N₂': {
        'Tmid': 1000,
        'low': {'a': [3.29867700E+0, 1.40824040E-3, -3.96322200E-6, 5.64151500E-9, -2.44485400E-12, -1.02089990E+3, 3.95037200E+0]},
        'high': {'a': [2.92664000E+0, 1.48797680E-3, -5.68476000E-7, 1.00970380E-10, -6.75335100E-15, -9.22797700E+2, 5.98052800E+0]}
    },
    'O₂': {
        'Tmid': 1000,
        'low': {'a': [3.78245636E+0, -2.99673416E-3, 9.84730201E-6, -9.68129509E-9, 3.24372837E-12, -1.06394356E+3, 3.65767573E+0]},
        'high': {'a': [3.28253784E+0, 1.48308754E-3, -7.57966669E-7, 2.09470555E-10, -2.16717794E-14, -1.08845772E+3, 5.45323129E+0]}
    },
    'C3H8': {
        'Tmid': 1000,
        'low': {'a': [9.33553810E-1, 2.64245790E-2, 6.10597270E-6, -2.19774990E-8, 9.51492530E-12, -1.39585200E+4, 1.92016910E+1]},
        'high': {'a': [7.53413680E+0, 1.88722390E-2, -6.27184910E-6, 9.14756490E-10, -4.78380690E-14, -1.64675160E+4, -1.78923490E+1]}
    },
    'C4H10,n-butane': {
        'Tmid': 1000,
        'low': {'a': [6.14746806E+0, 1.55947389E-4, 9.67913517E-5, -1.25483910E-7, 4.97816555E-11, -1.75994402E+4, -1.09409879E+0]},
        'high': {'a': [9.44535834E+0, 2.57858073E-2, -9.23619122E-6, 1.48632755E-9, -8.87897158E-14, -2.01382165E+4, -2.63470076E+1]}
    },
}

# 对比
print('='*100)
print('NASA 系数对比: 项目 vs Cantera nasa_gas')
print('='*100)

for name, project_data in project_coeffs.items():
    cantera_name = name.replace('₂', '2').replace('₃', '3').replace('₄', '4').replace('₁', '1').replace('₀', '0')
    # 查找 Cantera 中的物种
    ct_species = None
    for s in nasa_data['species']:
        if s['name'] == cantera_name or s['name'] == name:
            ct_species = s
            break
    if ct_species is None:
        print(f'\n{name}: 未找到 Cantera 对应物种')
        continue
    
    print(f'\n{name}:')
    ct_low = ct_species['thermo']['data'][0]
    ct_high = ct_species['thermo']['data'][1]
    
    print(f'  Tmid: 项目={project_data["Tmid"]}, Cantera=(列表格式)')
    
    print('  低温区系数:')
    for i in range(7):
        proj_val = project_data['low']['a'][i]
        ct_val = ct_low[i]
        diff = proj_val - ct_val
        print(f'    a[{i}]: 项目={proj_val:.10e}, Cantera={ct_val:.10e}, 差={diff:.10e}')
    
    print('  高温区系数:')
    for i in range(7):
        proj_val = project_data['high']['a'][i]
        ct_val = ct_high[i]
        diff = proj_val - ct_val
        print(f'    a[{i}]: 项目={proj_val:.10e}, Cantera={ct_val:.10e}, 差={diff:.10e}')
