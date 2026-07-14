"""
对比 Cantera 和 Web App 的焓值
"""
import cantera as ct
import yaml

# 读取 nasa_gas 物种
with open('/root/.pyenv/versions/3.14.4/lib/python3.14/site-packages/cantera/data/nasa_gas.yaml') as f:
    nasa_data = yaml.safe_load(f)

with open('/root/.pyenv/versions/3.14.4/lib/python3.14/site-packages/cantera/data/gri30.yaml') as f:
    gri30_data = yaml.safe_load(f)

# 选择物种
needed = ['C3H8', 'C4H10,n-butane', 'O2', 'N2', 'Ar', 'H2O', 'CO2', 'CO', 'H2', 'OH', 'H', 'O', 'NO']
selected = [s for s in nasa_data['species'] if s['name'] in needed]

phase = {
    'name': 'gas',
    'thermo': 'ideal-gas',
    'elements': gri30_data['phases'][0]['elements'],
    'species': [s['name'] for s in selected],
}

temp_yaml = {
    'description': 'Test',
    'phases': [phase],
    'species': selected
}

with open('/tmp/enthalpy_test.yaml', 'w') as f:
    yaml.dump(temp_yaml, f, sort_keys=False)

gas = ct.Solution('/tmp/enthalpy_test.yaml')

# 对比不同温度下的焓值
for T_K in [298.15, 1000, 1500, 2000, 2500]:
    print(f'\n=== T = {T_K} K ===')
    for sp in ['C3H8', 'C4H10,n-butane', 'O2', 'N2', 'H2O', 'CO2']:
        gas.TP = T_K, ct.one_atm
        gas.X = {sp: 1.0}
        h_cantera = gas.enthalpy_mole / 1000  # kJ/mol
        print(f'  {sp:15s}: H = {h_cantera:.3f} kJ/mol')
