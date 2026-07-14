"""
从 Cantera nasa_gas.yaml 提取正确的 NASA 系数
"""
import yaml

# 读取 nasa_gas
with open('/root/.pyenv/versions/3.14.4/lib/python3.14/site-packages/cantera/data/nasa_gas.yaml') as f:
    nasa_data = yaml.safe_load(f)

# 需要的物种
needed_species = [
    'CO2', 'H2O', 'N2', 'O2', 'CO', 'H2', 'OH', 'O', 'H', 'NO', 'NO2',
    'CH4', 'C2H6', 'C3H8', 'C4H10,n-butane', 'C5H12,n-pentane', 'C6H14,n-hexane',
    'C7H16,n-heptane', 'C6H6', 'C2H4', 'C3H6', 'C4H8', 'C2H2', 'NH3', 'H2S', 'Ar'
]

# 构建系数字典
new_coeffs = {}

for name in needed_species:
    # 查找物种
    species = None
    for s in nasa_data['species']:
        if s['name'] == name:
            species = s
            break
    if species is None:
        print(f'未找到: {name}')
        continue
    
    # 提取系数
    # nasa_gas 格式: data[0] = [a0, a1, a2, a3, a4, a5, a6], data[1] = [a0, a1, a2, a3, a4, a5, a6]
    low_coeffs = species['thermo']['data'][0]
    high_coeffs = species['thermo']['data'][1] if len(species['thermo']['data']) > 1 else species['thermo']['data'][0]
    
    # 转换为项目格式
    # 项目中物种名使用下标：CO₂, H₂O, N₂ 等
    # 先替换多位数的H下标，再替换单个数字
    display_name = name.replace('H8', 'H₈').replace('H10', 'H₁₀').replace('H12', 'H₁₂').replace('H16', 'H₁₆')
    display_name = display_name.replace('2', '₂').replace('3', '₃').replace('4', '₄').replace('5', '₅').replace('6', '₆').replace('7', '₇')
    display_name = display_name.replace(',n-butane', '').replace(',n-pentane', '').replace(',n-hexane', '').replace(',n-heptane', '')
    
    new_coeffs[display_name] = {
        'Tmid': 1000,  # nasa_gas 默认分割点
        'low': {'a': list(low_coeffs)},
        'high': {'a': list(high_coeffs)}
    }

# 生成 TypeScript 格式输出
ts_output = "const nasaCoeffs: Record<string, { Tmid: number; low: { a: number[] }; high: { a: number[] } }> = {\n"

for name in sorted(new_coeffs.keys()):
    data = new_coeffs[name]
    ts_output += f"  '{name}': {{\n"
    ts_output += f"    Tmid: {data['Tmid']},\n"
    # 手动格式化数组，去掉外层括号
    low_str = ', '.join(f'{v}' for v in data['low']['a'])
    high_str = ', '.join(f'{v}' for v in data['high']['a'])
    ts_output += f"    low: {{ a: [{low_str}] }},\n"
    ts_output += f"    high: {{ a: [{high_str}] }}\n"
    ts_output += "  },\n"

ts_output += "}\n"

# 写入文件
with open('/workspace/correct_nasa_coeffs.ts', 'w') as f:
    f.write(ts_output)

print('提取完成！已写入 /workspace/correct_nasa_coeffs.ts')
print('物种数量:', len(new_coeffs))
