# 保温厚度计算模块校准方案

> 对标于火焰计算模块使用 **Cantera** 校准, 保温厚度计算模块 (`InsulationCalculatorPage.tsx`) 采用
> **ASTM C680 / ISO 12241** 标准作为权威参考, 以 **NAIMA 3E Plus®** 在线工具作为交叉验证。

---

## 1. 为什么选这几个权威来源?

| 角色 | 对应火焰模块 | 保温模块对应 | 说明 |
|---|---|---|---|
| **权威标准 (算法本身)** | NASA Polynomials / CHEMKIN | **ASTM C680** | "Standard Practice for Estimate of the Heat Gain or Loss and the Surface Temperatures of Insulated Flat, Cylindrical, and Spherical Systems by Use of Computer Programs" — 给出圆柱/平壁/球壁稳态传热的完整算法 |
| **权威标准 (国际版)** | — | **ISO 12241** | "Thermal insulation for building equipment and industrial installations — Calculation rules" — 与 ASTM C680 等价的国际标准 |
| **黄金参考实现 (开源)** | Cantera (Python) | **本仓库 `insulation_reference.py`** | 按 ASTM C680 关联式 (Churchill-Chu 自然对流 + Churchill-Bernstein 强制对流 + 混合对流) 实现的 Python 参考器, 角色完全等同 Cantera |
| **行业官方免费工具 (在线)** | — | **NAIMA 3E Plus®** <https://3eplus.org> | 北美保温制造商协会出品, **直接基于 ASTM C680**, 是保温厚度计算的行业事实标准, 可在线运行、导出 PDF/CSV 报告, 用于人工交叉核验 |
| **厂商专业工具 (在线)** | — | **Armacell ArmaWin™** <https://armawin.com> | 采用 VDI 2055-1 / ISO 12241 / JIS A9501, 支持防凝露、经济厚度等 7 类计算, 用于二次交叉核验 |
| **教学/简算参考** | — | **NIA Mechanical Insulation Design Guide** <https://insulation.org/training-tools/designguide/> | 提供公式、emittance 表、裸管热损表, 用于基础值核验 |

**结论**: 你的保温模块校准 → 以 `insulation_reference.py` (ASTM C680) 作自动回归基准 (等同 Cantera), 再用 **3E Plus** 与 **ArmaWin** 两个人工在线工具做交叉抽样核验。

---

## 2. 校准目标 (覆盖页面的全部变量)

### 2.1 输入变量 (16 项, 全覆盖)

| # | 变量 | 取值范围 / 选项 | 测试组 |
|---|---|---|---|
| 1 | `equipmentType` | pipe / flat | A |
| 2 | `mode` | surface / heatloss / condensation | B |
| 3 | `pipeSize` / `outerDiameter` | 1/2"~16" (21.3~406.4 mm) | C |
| 4 | `surfaceLength` × `surfaceWidth` | 1×1, 2×1, 5×3 m | D |
| 5 | `materialType` | 5 种内置 + custom | E |
| 6 | `customLambda` (k) | 0.023~0.120 W/m·K | E-06 |
| 7 | `mediumTemp` (Tf) | -30~600 °C | F |
| 8 | `ambientTemp` (Ta) | -5~35 °C | G |
| 9 | `targetSurfaceTemp` | 25~60 °C | H |
| 10 | `targetHeatLoss` | 50~300 W/m² | I |
| 11 | `relativeHumidity` | 40~85 % | J |
| 12 | `environment` / `windSpeed` | indoor/calm/moderate/strong (v=0/1/5/10) | K |
| 13 | `surfaceFinish` (ε) | 0.9 / 0.7 / 0.3 / 0.1 | L |
| 14 | `customEmittance` | 0.5 | L-05 |
| 15 | `operatingHours` | 2000 / 5000 / 8760 h | M |
| 16 | `unitSystem` | metric / imperial 换算 | N |

### 2.2 输出量 (9 项, 全校验)

`thickness_mm`、`standardThickness`、`surfaceTemp`、`heatFlux`、`linearHeatLoss` (仅 pipe)、
`annualHeatLoss`、`dewPoint` (仅 condensation)、`hc`、`hr`、`h`

### 2.3 容差判据 (按输出量分别设定)

| 输出量 | 相对容差 | 绝对容差 | 判据 | 物理依据 |
|---|---|---|---|---|
| `thickness_mm` | 10% | 5 mm | 任一满足 | 工程保温厚度公差 |
| `surfaceTemp` | 5% | 2 °C | 任一满足 | 表面温度收敛阈值 |
| `heatFlux` | 15% | 10 W/m² | 任一满足 | hc 模型差异会放大 |
| `linearHeatLoss` | 15% | 10 W/m | 任一满足 | 同上 |
| `annualHeatLoss` | 15% | 50 kWh | 任一满足 | 同上 |
| `dewPoint` | — | 0.5 °C | 绝对 | Magnus 公式应完全一致 |
| `hc` | 25% | 2 W/m²·K | 任一满足 | 简化式 vs 关联式 |
| `hr` | 5% | 0.5 W/m²·K | 任一满足 | 同一 Stefan-Boltzmann |
| `h` | 20% | 2 W/m²·K | 任一满足 | hc+hr 合成 |

---

## 3. 校准方法论

### 3.1 三层校准结构

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: 自动回归 (CI 可跑)                              │
│   insulation_test_cases.json (56 用例)                  │
│        │                                                │
│        ├──> webapp_calculate()  ← 1:1 移植自 .tsx       │
│        └──> ref.calculate()     ← ASTM C680 关联式      │
│              diff + 容差判据 → PASS/FAIL                 │
└─────────────────────────────────────────────────────────┘
        ↓ 抽样
┌─────────────────────────────────────────────────────────┐
│ Layer 2: 行业工具交叉核验 (人工, 季度)                   │
│   抽 8~10 个代表用例 → NAIMA 3E Plus 在线录入           │
│   比对 thickness / surfaceTemp / heatFlux              │
└─────────────────────────────────────────────────────────┘
        ↓ 争议仲裁
┌─────────────────────────────────────────────────────────┐
│ Layer 3: 第二来源仲裁 (人工, 年度 / 出现争议时)         │
│   Armacell ArmaWin (ISO 12241 实现) 复算                │
└─────────────────────────────────────────────────────────┘
```

### 3.2 用例设计原则 (单变量 + 组合应力)

- **BASE-00**: 基准工况 (2" 管, 矿棉, 150 °C→50 °C, 室内, ε=0.9, 8760 h)
- **A~N 组**: 每组只变化一个变量, 其余保持基准 → 用于定位"哪个变量引起偏差"
- **Z 组 (5 例)**: 多变量极端组合 (高温大管+强风、低温制冷防凝露、大平壁高热损…)
  用于覆盖工程实际最严苛工况
- 共 **56 个用例 × 9 输出量 = 504 个判据点**

### 3.3 与 3E Plus / ArmaWin 对齐的录入约定

为保证人工核验可复现, 录入在线工具时统一如下:

| 项目 | 取值 |
|---|---|
| 计算类型 | Surface Temperature / Heat Loss per Hour / Condensation Control (按 mode 选) |
| 几何 | Horizontal Pipe / Flat Surface (按 equipmentType) |
| 保温层 | 单层, 材料导热系数直接填 `k` (W/m·K) |
| 表面发射率 | 直接填 `emittance` (不用 3E Plus 内置材料库) |
| 风速 | 直接填 `windSpeed` (m/s); indoor = 0 |
| 环境温度 | `ambientTemp` |
| 介质温度 | `mediumTemp` |
| 目标值 | surface 模式填 `targetSurfaceTemp`; heatloss 填 `targetHeatLoss` |
| 运行时间 | `operatingHours` h/年 |

---

## 4. 执行

```bash
# 自动校准 (Layer 1)
python3 insulation_verify.py                                # 控制台输出
python3 insulation_verify.py --json insulation_results.json # 机器可读结果
python3 insulation_verify.py --report insulation_calibration_report.md  # Markdown 报告
```

---

## 5. 已知模型差异 (校准前预期, 校准后验证)

| 项 | Web App | ASTM C680 参考 | 预期偏差 |
|---|---|---|---|
| 圆柱导热 | `ln(r2/r1)/(2πk)` | 相同 | 0% |
| 平壁导热 | `δ/k` | 相同 | 0% |
| 辐射 hr | `ε·σ·(Ts⁴-Ta⁴)/(Ts-Ta)` | 相同 | ~0% |
| 露点 | Magnus (a=17.62, b=243.12) | 相同 | 0% |
| **对流 hc** | `4 + 7·√v` (简化 Jurges 类) | Churchill-Chu + Churchill-Bernstein 混合对流 | **室内 ≈ -10%; 强风 (v≥5) ≈ -40~-50%** |
| hc 估计时机 | 用 `targetSurfaceTemp` 估 hr (非自洽) | Ts-h 自洽迭代 | 小温差下可忽略 |
| σ 取值 | 5.67e-8 | 5.670374419e-8 | <0.01% |

> **核心结论**: 唯一系统性偏差源是 hc 的简化公式。室内/低风速场景完全可用;
> 强风场景下 web app 偏保守 (低估 hc → 高估所需厚度 / 低估热损)。
> 若需精化, 建议在 `handleCalculate()` 中将 `hc = 4 + 7*Math.sqrt(windSpeedMetric)`
> 替换为 ASTM C680 关联式 (可直接调用从 `insulation_reference.py` 移植的 TS 版本)。
