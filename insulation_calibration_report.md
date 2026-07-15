# 保温模块对比校准报告

**参考基准**: ASTM C680 / ISO 12241 参考实现 (`insulation_reference.py`)

**被测对象**: `InsulationCalculatorPage.tsx` 计算逻辑 (1:1 Python 移植)

**测试用例数**: 56   **判据点**: 504   **通过**: 448   **失败**: 0   **通过率**: 88.9%


## 1. 指标偏差统计

| 指标 | 最大相对偏差% | 最小相对偏差% | 平均|相对偏差|% | 容差% |
|---|---|---|---|---|
| annualHeatLoss | 0.30 | -3.28 | 0.24 | 15.0 |
| dewPoint | 0.00 | 0.00 | 0.00 | 0.5 |
| h | 0.63 | -0.09 | 0.05 | 20.0 |
| hc | 2.78 | -0.15 | 0.11 | 25.0 |
| heatFlux | 0.36 | -7.61 | 0.39 | 15.0 |
| hr | 0.05 | -0.06 | 0.02 | 5.0 |
| linearHeatLoss | 0.30 | -3.28 | 0.22 | 15.0 |
| surfaceTemp | 0.19 | -0.44 | 0.11 | 5.0 |
| thickness_mm | 0.46 | -5.82 | 0.37 | 10.0 |

## 2. 逐用例详情

### [BASE-00] Baseline — —

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [A-01] A_EquipmentType — equipmentType=pipe

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [A-02] A_EquipmentType — equipmentType=flat (1×1m)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.609 | 11.628 | -0.16 | -0.018 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.043 | 50.012 | 0.06 | 0.031 | PASS |
| heatFlux | 344.398 | 343.964 | 0.13 | 0.434 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 3016.929 | 3013.128 | 0.13 | 3.800 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.475 | 5.473 | 0.03 | 0.002 | PASS |
| hr | 5.989 | 5.988 | 0.02 | 0.001 | PASS |
| h | 11.464 | 11.461 | 0.02 | 0.003 | PASS |

### [B-01] B_Mode — mode=surface

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [B-02] B_Mode — mode=heatloss (100 W/m²)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 33.548 | 33.505 | 0.13 | 0.043 | PASS |
| standardThickness | 40 | 40 | 0.00 | — | INFO |
| surfaceTemp | 31.512 | 31.526 | -0.05 | -0.014 | PASS |
| heatFlux | 99.479 | 99.624 | -0.15 | -0.145 | PASS |
| linearHeatLoss | 39.814 | 39.845 | -0.08 | -0.031 | PASS |
| annualHeatLoss | 348.770 | 349.043 | -0.08 | -0.273 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.188 | 3.189 | -0.05 | -0.002 | PASS |
| hr | 5.454 | 5.454 | -0.01 | -0.000 | PASS |
| h | 8.642 | 8.644 | -0.02 | -0.002 | PASS |

### [B-03] B_Mode — mode=condensation (RH=60%)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 8192.000 | 8192.000 | 0.00 | 0.000 | PASS |
| standardThickness | 150 | 150 | 0.00 | — | INFO |
| surfaceTemp | 20.020 | 20.020 | 0.00 | 0.000 | PASS |
| heatFlux | 0.113 | 0.113 | 0.00 | 0.000 | PASS |
| linearHeatLoss | 5.825 | 5.825 | 0.00 | 0.000 | PASS |
| annualHeatLoss | 51.025 | 51.025 | 0.00 | 0.000 | PASS |
| dewPoint | 11.995 | 11.995 | 0.00 | 0.000 | PASS |
| hc | 0.500 | 0.500 | 0.00 | 0.000 | PASS |
| hr | 5.143 | 5.143 | 0.00 | 0.000 | PASS |
| h | 5.643 | 5.643 | 0.00 | 0.000 | PASS |

### [C-01] C_PipeSize — 1/2" OD=21.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 8.671 | 8.692 | -0.24 | -0.021 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.091 | 50.035 | 0.11 | 0.056 | PASS |
| heatFlux | 347.259 | 346.444 | 0.24 | 0.815 | PASS |
| linearHeatLoss | 42.157 | 42.103 | 0.13 | 0.053 | PASS |
| annualHeatLoss | 369.291 | 368.825 | 0.13 | 0.466 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.550 | 5.546 | 0.07 | 0.004 | PASS |
| hr | 5.990 | 5.989 | 0.03 | 0.002 | PASS |
| h | 11.540 | 11.535 | 0.05 | 0.006 | PASS |

### [C-02] C_PipeSize — 2" OD=60.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [C-03] C_PipeSize — 4" OD=114.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.273 | 12.252 | 0.17 | 0.021 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.936 | 49.973 | -0.07 | -0.037 | PASS |
| heatFlux | 296.355 | 296.799 | -0.15 | -0.444 | PASS |
| linearHeatLoss | 129.270 | 129.425 | -0.12 | -0.154 | PASS |
| annualHeatLoss | 1132.407 | 1133.759 | -0.12 | -1.352 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.914 | 3.916 | -0.04 | -0.001 | PASS |
| hr | 5.986 | 5.987 | -0.02 | -0.001 | PASS |
| h | 9.900 | 9.902 | -0.03 | -0.003 | PASS |

### [C-04] C_PipeSize — 8" OD=219.1mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.391 | 13.439 | -0.35 | -0.048 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.092 | 50.017 | 0.15 | 0.075 | PASS |
| heatFlux | 281.858 | 281.016 | 0.30 | 0.842 | PASS |
| linearHeatLoss | 217.725 | 217.158 | 0.26 | 0.567 | PASS |
| annualHeatLoss | 1907.271 | 1902.308 | 0.26 | 4.963 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.376 | 3.374 | 0.07 | 0.002 | PASS |
| hr | 5.990 | 5.988 | 0.04 | 0.002 | PASS |
| h | 9.366 | 9.362 | 0.05 | 0.005 | PASS |

### [C-05] C_PipeSize — 16" OD=406.4mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.509 | 14.501 | 0.06 | 0.008 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 49.953 | 49.966 | -0.02 | -0.012 | PASS |
| heatFlux | 266.516 | 266.644 | -0.05 | -0.128 | PASS |
| linearHeatLoss | 364.569 | 364.730 | -0.04 | -0.161 | PASS |
| annualHeatLoss | 3193.626 | 3195.035 | -0.04 | -1.409 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 2.912 | 2.912 | -0.01 | -0.000 | PASS |
| hr | 5.986 | 5.987 | -0.01 | -0.000 | PASS |
| h | 8.898 | 8.898 | -0.01 | -0.001 | PASS |

### [D-01] D_FlatDimensions — 1m×1m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.609 | 11.628 | -0.16 | -0.018 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.043 | 50.012 | 0.06 | 0.031 | PASS |
| heatFlux | 344.398 | 343.964 | 0.13 | 0.434 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 3016.929 | 3013.128 | 0.13 | 3.800 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.475 | 5.473 | 0.03 | 0.002 | PASS |
| hr | 5.989 | 5.988 | 0.02 | 0.001 | PASS |
| h | 11.464 | 11.461 | 0.02 | 0.003 | PASS |

### [D-02] D_FlatDimensions — 2m×1m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.609 | 11.628 | -0.16 | -0.018 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.043 | 50.012 | 0.06 | 0.031 | PASS |
| heatFlux | 344.398 | 343.964 | 0.13 | 0.434 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 6033.857 | 6026.256 | 0.13 | 7.601 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.475 | 5.473 | 0.03 | 0.002 | PASS |
| hr | 5.989 | 5.988 | 0.02 | 0.001 | PASS |
| h | 11.464 | 11.461 | 0.02 | 0.003 | PASS |

### [D-03] D_FlatDimensions — 5m×3m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.609 | 11.628 | -0.16 | -0.018 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.043 | 50.012 | 0.06 | 0.031 | PASS |
| heatFlux | 344.398 | 343.964 | 0.13 | 0.434 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 45253.928 | 45196.922 | 0.13 | 57.007 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.475 | 5.473 | 0.03 | 0.002 | PASS |
| hr | 5.989 | 5.988 | 0.02 | 0.001 | PASS |
| h | 11.464 | 11.461 | 0.02 | 0.003 | PASS |

### [E-01] E_Material — mineralwool k=0.040

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [E-02] E_Material — glasswool k=0.035

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 9.665 | 9.691 | -0.27 | -0.027 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.018 | 49.957 | 0.12 | 0.060 | PASS |
| heatFlux | 316.094 | 315.316 | 0.25 | 0.778 | PASS |
| linearHeatLoss | 79.075 | 78.933 | 0.18 | 0.142 | PASS |
| annualHeatLoss | 692.699 | 691.456 | 0.18 | 1.243 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.542 | 4.539 | 0.07 | 0.003 | PASS |
| hr | 5.988 | 5.986 | 0.03 | 0.002 | PASS |
| h | 10.530 | 10.525 | 0.05 | 0.005 | PASS |

### [E-03] E_Material — calciumsilicate k=0.052

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.888 | 13.876 | 0.09 | 0.012 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 49.963 | 49.983 | -0.04 | -0.019 | PASS |
| heatFlux | 311.772 | 312.020 | -0.08 | -0.248 | PASS |
| linearHeatLoss | 86.267 | 86.313 | -0.05 | -0.045 | PASS |
| annualHeatLoss | 755.702 | 756.098 | -0.05 | -0.396 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.419 | 4.420 | -0.02 | -0.001 | PASS |
| hr | 5.986 | 5.987 | -0.01 | -0.001 | PASS |
| h | 10.405 | 10.407 | -0.02 | -0.002 | PASS |

### [E-04] E_Material — polyurethane k=0.023

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 6.519 | 6.533 | -0.22 | -0.014 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.095 | 50.048 | 0.09 | 0.047 | PASS |
| heatFlux | 320.140 | 319.528 | 0.19 | 0.612 | PASS |
| linearHeatLoss | 73.759 | 73.647 | 0.15 | 0.112 | PASS |
| annualHeatLoss | 646.131 | 645.148 | 0.15 | 0.983 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.647 | 4.645 | 0.05 | 0.002 | PASS |
| hr | 5.990 | 5.989 | 0.02 | 0.001 | PASS |
| h | 10.638 | 10.634 | 0.03 | 0.004 | PASS |

### [E-05] E_Material — ceramicfiber k=0.120

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 29.009 | 28.876 | 0.46 | 0.133 | PASS |
| standardThickness | 30 | 30 | 0.00 | — | INFO |
| surfaceTemp | 49.916 | 50.025 | -0.22 | -0.108 | PASS |
| heatFlux | 301.182 | 302.549 | -0.45 | -1.367 | PASS |
| linearHeatLoss | 111.952 | 112.207 | -0.23 | -0.255 | PASS |
| annualHeatLoss | 980.701 | 982.931 | -0.23 | -2.230 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.082 | 4.088 | -0.15 | -0.006 | PASS |
| hr | 5.985 | 5.988 | -0.05 | -0.003 | PASS |
| h | 10.068 | 10.077 | -0.09 | -0.009 | PASS |

### [E-06] E_Material — custom k=0.060

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 15.752 | 15.750 | 0.01 | 0.001 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.015 | 50.017 | -0.00 | -0.002 | PASS |
| heatFlux | 310.945 | 310.971 | -0.01 | -0.026 | PASS |
| linearHeatLoss | 89.679 | 89.684 | -0.01 | -0.005 | PASS |
| annualHeatLoss | 785.587 | 785.629 | -0.01 | -0.041 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.372 | 4.372 | -0.00 | -0.000 | PASS |
| hr | 5.988 | 5.988 | -0.00 | -0.000 | PASS |
| h | 10.360 | 10.360 | -0.00 | -0.000 | PASS |

### [F-01] F_MediumTemp — Tf=50°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 3.939 | 3.938 | 0.04 | 0.001 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 34.986 | 34.989 | -0.01 | -0.003 | PASS |
| heatFlux | 143.469 | 143.497 | -0.02 | -0.028 | PASS |
| linearHeatLoss | 30.729 | 30.734 | -0.02 | -0.005 | PASS |
| annualHeatLoss | 269.189 | 269.231 | -0.02 | -0.042 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.022 | 4.023 | -0.00 | -0.000 | PASS |
| hr | 5.551 | 5.551 | -0.00 | -0.000 | PASS |
| h | 9.573 | 9.573 | -0.00 | -0.000 | PASS |

### [F-02] F_MediumTemp — Tf=150°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [F-03] F_MediumTemp — Tf=300°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 20.661 | 20.691 | -0.15 | -0.030 | PASS |
| standardThickness | 25 | 25 | 0.00 | — | INFO |
| surfaceTemp | 55.021 | 54.977 | 0.08 | 0.044 | PASS |
| heatFlux | 369.515 | 368.936 | 0.16 | 0.580 | PASS |
| linearHeatLoss | 117.969 | 117.854 | 0.10 | 0.114 | PASS |
| annualHeatLoss | 1033.404 | 1032.403 | 0.10 | 1.002 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.411 | 4.409 | 0.05 | 0.002 | PASS |
| hr | 6.140 | 6.139 | 0.02 | 0.001 | PASS |
| h | 10.551 | 10.548 | 0.03 | 0.003 | PASS |

### [F-04] F_MediumTemp — Tf=500°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 29.882 | 29.876 | 0.02 | 0.006 | PASS |
| standardThickness | 30 | 30 | 0.00 | — | INFO |
| surfaceTemp | 59.984 | 59.991 | -0.01 | -0.007 | PASS |
| heatFlux | 425.722 | 425.820 | -0.02 | -0.097 | PASS |
| linearHeatLoss | 160.578 | 160.599 | -0.01 | -0.021 | PASS |
| annualHeatLoss | 1406.665 | 1406.846 | -0.01 | -0.181 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.354 | 4.354 | -0.01 | -0.000 | PASS |
| hr | 6.294 | 6.294 | -0.00 | -0.000 | PASS |
| h | 10.647 | 10.648 | -0.00 | -0.001 | PASS |

### [F-05] F_MediumTemp — Tf=-10°C (制冷, 逆向热流)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 25.022 | 25.502 | -1.88 | -0.480 | PASS |
| standardThickness | 30 | 30 | 0.00 | — | INFO |
| surfaceTemp | 24.926 | 25.018 | -0.37 | -0.092 | PASS |
| heatFlux | -41.905 | -41.064 | -2.05 | -0.841 | PASS |
| linearHeatLoss | -14.526 | -14.359 | -1.17 | -0.168 | PASS |
| annualHeatLoss | -127.252 | -125.784 | -1.17 | -1.468 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 2.713 | 2.695 | 0.69 | 0.018 | PASS |
| hr | 5.546 | 5.548 | -0.05 | -0.003 | PASS |
| h | 8.259 | 8.243 | 0.19 | 0.016 | PASS |

### [G-01] G_AmbientTemp — Ta=-5°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 8.547 | 8.536 | 0.13 | 0.011 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 39.925 | 39.962 | -0.09 | -0.038 | PASS |
| heatFlux | 455.905 | 456.396 | -0.11 | -0.491 | PASS |
| linearHeatLoss | 110.849 | 110.937 | -0.08 | -0.088 | PASS |
| annualHeatLoss | 971.034 | 971.804 | -0.08 | -0.770 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.108 | 5.109 | -0.03 | -0.001 | PASS |
| hr | 5.040 | 5.041 | -0.02 | -0.001 | PASS |
| h | 10.148 | 10.151 | -0.02 | -0.002 | PASS |

### [G-02] G_AmbientTemp — Ta=20°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [G-03] G_AmbientTemp — Ta=35°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.882 | 14.876 | 0.04 | 0.006 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 54.968 | 54.975 | -0.01 | -0.007 | PASS |
| heatFlux | 210.406 | 210.494 | -0.04 | -0.088 | PASS |
| linearHeatLoss | 59.533 | 59.550 | -0.03 | -0.016 | PASS |
| annualHeatLoss | 521.511 | 521.655 | -0.03 | -0.144 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.958 | 3.958 | -0.01 | -0.000 | PASS |
| hr | 6.579 | 6.580 | -0.00 | -0.000 | PASS |
| h | 10.537 | 10.538 | -0.01 | -0.001 | PASS |

### [H-01] H_TargetSurfaceTemp — Ts_target=40°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 18.293 | 18.254 | 0.21 | 0.039 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 39.952 | 39.988 | -0.09 | -0.036 | PASS |
| heatFlux | 191.623 | 192.037 | -0.22 | -0.414 | PASS |
| linearHeatLoss | 58.325 | 58.405 | -0.14 | -0.079 | PASS |
| annualHeatLoss | 510.931 | 511.627 | -0.14 | -0.696 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.912 | 3.915 | -0.06 | -0.003 | PASS |
| hr | 5.692 | 5.693 | -0.02 | -0.001 | PASS |
| h | 9.604 | 9.608 | -0.04 | -0.004 | PASS |

### [H-02] H_TargetSurfaceTemp — Ts_target=50°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [H-03] H_TargetSurfaceTemp — Ts_target=60°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 7.198 | 7.220 | -0.31 | -0.022 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 60.043 | 59.964 | 0.13 | 0.079 | PASS |
| heatFlux | 450.034 | 448.924 | 0.25 | 1.109 | PASS |
| linearHeatLoss | 105.606 | 105.408 | 0.19 | 0.198 | PASS |
| annualHeatLoss | 925.108 | 923.373 | 0.19 | 1.735 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.943 | 4.940 | 0.06 | 0.003 | PASS |
| hr | 6.296 | 6.293 | 0.04 | 0.002 | PASS |
| h | 11.239 | 11.233 | 0.05 | 0.006 | PASS |

### [I-01] I_TargetHeatLoss — q_target=50 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 60.006 | 60.001 | 0.01 | 0.006 | PASS |
| standardThickness | 75 | 75 | 0.00 | — | INFO |
| surfaceTemp | 26.391 | 26.391 | -0.00 | -0.001 | PASS |
| heatFlux | 50.068 | 50.074 | -0.01 | -0.006 | PASS |
| linearHeatLoss | 28.362 | 28.363 | -0.01 | -0.001 | PASS |
| annualHeatLoss | 248.450 | 248.462 | -0.01 | -0.013 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 2.521 | 2.521 | -0.00 | -0.000 | PASS |
| hr | 5.313 | 5.313 | -0.00 | -0.000 | PASS |
| h | 7.834 | 7.835 | -0.00 | -0.000 | PASS |

### [I-02] I_TargetHeatLoss — q_target=100 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 33.548 | 33.505 | 0.13 | 0.043 | PASS |
| standardThickness | 40 | 40 | 0.00 | — | INFO |
| surfaceTemp | 31.512 | 31.526 | -0.05 | -0.014 | PASS |
| heatFlux | 99.479 | 99.624 | -0.15 | -0.145 | PASS |
| linearHeatLoss | 39.814 | 39.845 | -0.08 | -0.031 | PASS |
| annualHeatLoss | 348.770 | 349.043 | -0.08 | -0.273 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.188 | 3.189 | -0.05 | -0.002 | PASS |
| hr | 5.454 | 5.454 | -0.01 | -0.000 | PASS |
| h | 8.642 | 8.644 | -0.02 | -0.002 | PASS |

### [I-03] I_TargetHeatLoss — q_target=200 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 17.545 | 17.505 | 0.23 | 0.041 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 40.666 | 40.706 | -0.10 | -0.040 | PASS |
| heatFlux | 199.922 | 200.393 | -0.24 | -0.471 | PASS |
| linearHeatLoss | 59.912 | 60.002 | -0.15 | -0.090 | PASS |
| annualHeatLoss | 524.832 | 525.619 | -0.15 | -0.787 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 3.961 | 3.964 | -0.07 | -0.003 | PASS |
| hr | 5.713 | 5.714 | -0.02 | -0.001 | PASS |
| h | 9.674 | 9.678 | -0.04 | -0.004 | PASS |

### [J-01] J_Humidity — RH=40%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 7.259 | 7.251 | 0.12 | 0.008 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 15.970 | 15.959 | 0.07 | 0.011 | PASS |
| heatFlux | -128.714 | -128.824 | 0.09 | 0.110 | PASS |
| linearHeatLoss | -30.254 | -30.273 | 0.06 | 0.019 | PASS |
| annualHeatLoss | -265.027 | -265.193 | 0.06 | 0.166 | PASS |
| dewPoint | 14.925 | 14.925 | 0.00 | 0.000 | PASS |
| hc | 3.870 | 3.871 | -0.03 | -0.001 | PASS |
| hr | 5.304 | 5.304 | 0.01 | 0.000 | PASS |
| h | 9.174 | 9.175 | -0.01 | -0.001 | PASS |

### [J-02] J_Humidity — RH=60%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 16.050 | 16.005 | 0.28 | 0.045 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 22.380 | 22.362 | 0.08 | 0.019 | PASS |
| heatFlux | -65.687 | -65.864 | 0.27 | 0.177 | PASS |
| linearHeatLoss | -19.068 | -19.101 | 0.17 | 0.033 | PASS |
| annualHeatLoss | -167.035 | -167.321 | 0.17 | 0.286 | PASS |
| dewPoint | 21.385 | 21.385 | 0.00 | 0.000 | PASS |
| hc | 3.145 | 3.148 | -0.09 | -0.003 | PASS |
| hr | 5.476 | 5.475 | 0.01 | 0.001 | PASS |
| h | 8.621 | 8.623 | -0.03 | -0.002 | PASS |

### [J-03] J_Humidity — RH=85%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 64.050 | 68.005 | -5.82 | -3.955 | PASS |
| standardThickness | 75 | 75 | 0.00 | — | INFO |
| surfaceTemp | 28.101 | 28.225 | -0.44 | -0.123 | PASS |
| heatFlux | -14.202 | -13.197 | -7.61 | -1.004 | PASS |
| linearHeatLoss | -8.406 | -8.139 | -3.28 | -0.267 | PASS |
| annualHeatLoss | -73.633 | -71.297 | -3.28 | -2.336 | PASS |
| dewPoint | 27.199 | 27.199 | 0.00 | 0.000 | PASS |
| hc | 1.847 | 1.797 | 2.78 | 0.050 | PASS |
| hr | 5.634 | 5.637 | -0.06 | -0.003 | PASS |
| h | 7.480 | 7.434 | 0.63 | 0.047 | PASS |

### [K-01] K_Environment — indoor v=0

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [K-02] K_Environment — outdoor_calm v=1

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 6.148 | 6.174 | -0.42 | -0.026 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.097 | 50.002 | 0.19 | 0.095 | PASS |
| heatFlux | 593.193 | 591.083 | 0.36 | 2.110 | PASS |
| linearHeatLoss | 135.290 | 134.904 | 0.29 | 0.386 | PASS |
| annualHeatLoss | 1185.136 | 1181.757 | 0.29 | 3.379 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 13.719 | 13.714 | 0.04 | 0.005 | PASS |
| hr | 5.990 | 5.987 | 0.05 | 0.003 | PASS |
| h | 19.709 | 19.702 | 0.04 | 0.008 | PASS |

### [K-03] K_Environment — outdoor_moderate v=5

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 3.238 | 3.252 | -0.42 | -0.014 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.069 | 49.973 | 0.19 | 0.096 | PASS |
| heatFlux | 1173.495 | 1169.476 | 0.34 | 4.018 | PASS |
| linearHeatLoss | 246.181 | 245.438 | 0.30 | 0.743 | PASS |
| annualHeatLoss | 2156.548 | 2150.038 | 0.30 | 6.510 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 33.037 | 33.031 | 0.02 | 0.006 | PASS |
| hr | 5.990 | 5.987 | 0.05 | 0.003 | PASS |
| h | 39.027 | 39.018 | 0.02 | 0.009 | PASS |

### [K-04] K_Environment — outdoor_strong v=10

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 2.370 | 2.371 | -0.06 | -0.001 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 49.997 | 49.984 | 0.03 | 0.013 | PASS |
| heatFlux | 1625.598 | 1624.853 | 0.05 | 0.746 | PASS |
| linearHeatLoss | 332.156 | 332.018 | 0.04 | 0.139 | PASS |
| annualHeatLoss | 2909.690 | 2908.476 | 0.04 | 1.214 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 48.205 | 48.204 | 0.00 | 0.001 | PASS |
| hr | 5.987 | 5.987 | 0.01 | 0.000 | PASS |
| h | 54.193 | 54.191 | 0.00 | 0.001 | PASS |

### [L-01] L_Emittance — ε=0.9 painted

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [L-02] L_Emittance — ε=0.7 Al jacket

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.398 | 12.377 | 0.16 | 0.020 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.956 | 49.992 | -0.07 | -0.036 | PASS |
| heatFlux | 273.062 | 273.474 | -0.15 | -0.412 | PASS |
| linearHeatLoss | 72.999 | 73.074 | -0.10 | -0.075 | PASS |
| annualHeatLoss | 639.471 | 640.130 | -0.10 | -0.658 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.459 | 4.461 | -0.04 | -0.002 | PASS |
| hr | 4.656 | 4.657 | -0.02 | -0.001 | PASS |
| h | 9.115 | 9.118 | -0.03 | -0.003 | PASS |

### [L-03] L_Emittance — ε=0.3 polished Al

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 17.047 | 17.005 | 0.25 | 0.042 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 49.904 | 49.959 | -0.11 | -0.054 | PASS |
| heatFlux | 189.298 | 189.743 | -0.23 | -0.445 | PASS |
| linearHeatLoss | 56.136 | 56.217 | -0.15 | -0.082 | PASS |
| annualHeatLoss | 491.748 | 492.465 | -0.15 | -0.717 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.335 | 4.338 | -0.07 | -0.003 | PASS |
| hr | 1.995 | 1.995 | -0.03 | -0.001 | PASS |
| h | 6.330 | 6.334 | -0.05 | -0.003 | PASS |

### [L-04] L_Emittance — ε=0.1 polished steel

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 21.034 | 21.066 | -0.15 | -0.032 | PASS |
| standardThickness | 25 | 25 | 0.00 | — | INFO |
| surfaceTemp | 50.045 | 50.013 | 0.06 | 0.032 | PASS |
| heatFlux | 147.593 | 147.378 | 0.15 | 0.215 | PASS |
| linearHeatLoss | 47.466 | 47.426 | 0.08 | 0.040 | PASS |
| annualHeatLoss | 415.803 | 415.453 | 0.08 | 0.349 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.247 | 4.245 | 0.04 | 0.002 | PASS |
| hr | 0.665 | 0.665 | 0.02 | 0.000 | PASS |
| h | 4.912 | 4.910 | 0.04 | 0.002 | PASS |

### [L-05] L_Emittance — custom ε=0.5

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.261 | 14.314 | -0.37 | -0.053 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.040 | 49.959 | 0.16 | 0.081 | PASS |
| heatFlux | 232.460 | 231.665 | 0.34 | 0.795 | PASS |
| linearHeatLoss | 64.866 | 64.721 | 0.22 | 0.145 | PASS |
| annualHeatLoss | 568.226 | 566.955 | 0.22 | 1.272 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.411 | 4.407 | 0.10 | 0.004 | PASS |
| hr | 3.327 | 3.326 | 0.04 | 0.001 | PASS |
| h | 7.738 | 7.733 | 0.07 | 0.006 | PASS |

### [M-01] M_OperatingHours — hours=2000

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 162.708 | 162.389 | 0.20 | 0.320 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [M-02] M_OperatingHours — hours=5000

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 406.771 | 405.971 | 0.20 | 0.800 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [M-03] M_OperatingHours — hours=8760

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [N-01] N_UnitSystem — metric (基准)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.049 | 49.981 | 0.14 | 0.068 | PASS |
| heatFlux | 315.364 | 314.487 | 0.28 | 0.877 | PASS |
| linearHeatLoss | 81.354 | 81.194 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 712.662 | 711.262 | 0.20 | 1.401 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.502 | 0.08 | 0.003 | PASS |
| hr | 5.989 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.495 | 10.489 | 0.05 | 0.005 | PASS |

### [N-02] N_UnitSystem — imperial→metric 等价换算

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.907 | 10.941 | -0.31 | -0.034 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.066 | 49.998 | 0.14 | 0.068 | PASS |
| heatFlux | 315.564 | 314.686 | 0.28 | 0.878 | PASS |
| linearHeatLoss | 81.430 | 81.270 | 0.20 | 0.160 | PASS |
| annualHeatLoss | 713.331 | 711.929 | 0.20 | 1.402 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.506 | 4.503 | 0.08 | 0.003 | PASS |
| hr | 5.990 | 5.987 | 0.03 | 0.002 | PASS |
| h | 10.496 | 10.490 | 0.05 | 0.005 | PASS |

### [Z-01] Z_StressCombined — 高温大管+强风+低发射率

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 24.025 | 24.065 | -0.17 | -0.040 | PASS |
| standardThickness | 25 | 25 | 0.00 | — | INFO |
| surfaceTemp | 60.024 | 59.978 | 0.08 | 0.046 | PASS |
| heatFlux | 765.653 | 764.361 | 0.17 | 1.292 | PASS |
| linearHeatLoss | 642.595 | 641.703 | 0.14 | 0.892 | PASS |
| annualHeatLoss | 5629.130 | 5621.315 | 0.14 | 7.815 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 24.769 | 24.765 | 0.01 | 0.004 | PASS |
| hr | 0.732 | 0.732 | 0.02 | 0.000 | PASS |
| h | 25.501 | 25.497 | 0.01 | 0.004 | PASS |

### [Z-02] Z_StressCombined — 低温制冷管+高湿防凝露

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 40.038 | 40.004 | 0.08 | 0.034 | PASS |
| standardThickness | 50 | 50 | 0.00 | — | INFO |
| surfaceTemp | 30.125 | 30.123 | 0.01 | 0.002 | PASS |
| heatFlux | -26.798 | -26.825 | 0.10 | 0.026 | PASS |
| linearHeatLoss | -16.364 | -16.375 | 0.06 | 0.010 | PASS |
| annualHeatLoss | -143.352 | -143.442 | 0.06 | 0.090 | PASS |
| dewPoint | 29.158 | 29.158 | 0.00 | 0.000 | PASS |
| hc | 8.546 | 8.547 | -0.02 | -0.001 | PASS |
| hr | 5.747 | 5.747 | 0.00 | 0.000 | PASS |
| h | 14.293 | 14.294 | -0.01 | -0.001 | PASS |

### [Z-03] Z_StressCombined — 大平壁+高热损目标+陶瓷纤维

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 227.336 | 227.001 | 0.15 | 0.335 | PASS |
| standardThickness | 150 | 150 | 0.00 | — | INFO |
| surfaceTemp | 33.420 | 33.432 | -0.04 | -0.012 | PASS |
| heatFlux | 299.071 | 299.506 | -0.15 | -0.435 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 22430.338 | 22462.937 | -0.15 | -32.598 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 31.130 | 31.130 | 0.00 | 0.000 | PASS |
| hr | 4.390 | 4.390 | -0.01 | -0.000 | PASS |
| h | 35.520 | 35.520 | -0.00 | -0.000 | PASS |

### [Z-04] Z_StressCombined — 小管+高表面温度目标+PUR

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 8.050 | 8.067 | -0.22 | -0.017 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 45.045 | 45.013 | 0.07 | 0.032 | PASS |
| heatFlux | 141.912 | 141.615 | 0.21 | 0.297 | PASS |
| linearHeatLoss | 16.674 | 16.655 | 0.12 | 0.019 | PASS |
| annualHeatLoss | 66.696 | 66.619 | 0.12 | 0.078 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 5.086 | 5.083 | 0.06 | 0.003 | PASS |
| hr | 1.994 | 1.993 | 0.02 | 0.000 | PASS |
| h | 7.080 | 7.076 | 0.05 | 0.004 | PASS |

### [Z-05] Z_StressCombined — 平壁防凝露+玻璃棉+室外

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 3.927 | 4.005 | -1.95 | -0.078 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 24.053 | 24.117 | -0.27 | -0.064 | PASS |
| heatFlux | -169.821 | -167.064 | -1.65 | -2.757 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | -5950.519 | -5853.906 | -1.65 | -96.613 | PASS |
| dewPoint | 23.152 | 23.152 | 0.00 | 0.000 | PASS |
| hc | 37.556 | 37.554 | 0.00 | 0.001 | PASS |
| hr | 5.466 | 5.468 | -0.03 | -0.002 | PASS |
| h | 43.022 | 43.023 | -0.00 | -0.000 | PASS |
