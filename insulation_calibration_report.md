# 保温模块对比校准报告

**参考基准**: ASTM C680 / ISO 12241 参考实现 (`insulation_reference.py`)

**被测对象**: `InsulationCalculatorPage.tsx` 计算逻辑 (1:1 Python 移植)

**测试用例数**: 56   **判据点**: 504   **通过**: 404   **失败**: 44   **通过率**: 80.2%


## 1. 指标偏差统计

| 指标 | 最大相对偏差% | 最小相对偏差% | 平均|相对偏差|% | 容差% |
|---|---|---|---|---|
| annualHeatLoss | 18.42 | -37.64 | 6.93 | 15.0 |
| dewPoint | 0.00 | 0.00 | 0.00 | 0.5 |
| h | 76.97 | -40.72 | 11.79 | 20.0 |
| hc | 700.00 | -47.64 | 31.56 | 25.0 |
| heatFlux | 22.93 | -40.42 | 8.91 | 15.0 |
| hr | 18.40 | -3.12 | 2.44 | 5.0 |
| linearHeatLoss | 18.42 | -37.64 | 6.63 | 15.0 |
| surfaceTemp | 11.57 | -9.00 | 1.21 | 5.0 |
| thickness_mm | 63.88 | -22.63 | 8.92 | 10.0 |

## 2. 逐用例详情

### [BASE-00] Baseline — —

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [A-01] A_EquipmentType — equipmentType=pipe

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [A-02] A_EquipmentType — equipmentType=flat (1×1m)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.378 | 11.690 | 14.44 | 1.688 | PASS |
| standardThickness | 20 | 13 | 53.85 | — | INFO |
| surfaceTemp | 49.954 | 49.908 | 0.09 | 0.045 | PASS |
| heatFlux | 299.143 | 342.481 | -12.65 | -43.338 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 2620.491 | 3000.135 | -12.65 | -379.644 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.467 | -26.83 | -1.467 | PASS |
| hr | 5.987 | 5.984 | 0.04 | 0.003 | PASS |
| h | 9.987 | 11.451 | -12.79 | -1.464 | PASS |

### [B-01] B_Mode — mode=surface

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [B-02] B_Mode — mode=heatloss (100 W/m²)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 33.048 | 33.255 | -0.62 | -0.206 | PASS |
| standardThickness | 40 | 40 | 0.00 | — | INFO |
| surfaceTemp | 30.254 | 31.610 | -4.29 | -1.356 | PASS |
| heatFlux | 102.406 | 100.474 | 1.92 | 1.932 | PASS |
| linearHeatLoss | 40.664 | 40.027 | 1.59 | 0.637 | PASS |
| annualHeatLoss | 356.219 | 350.640 | 1.59 | 5.579 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.198 | 25.09 | 0.802 | PASS |
| hr | 5.987 | 5.456 | 9.72 | 0.531 | FAIL |
| h | 9.987 | 8.654 | 15.40 | 1.333 | PASS |

### [B-03] B_Mode — mode=condensation (RH=60%)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 8192.000 | 8192.000 | 0.00 | 0.000 | PASS |
| standardThickness | 150 | 150 | 0.00 | — | INFO |
| surfaceTemp | 20.011 | 20.020 | -0.04 | -0.009 | PASS |
| heatFlux | 0.113 | 0.113 | 0.01 | 0.000 | PASS |
| linearHeatLoss | 5.825 | 5.825 | 0.01 | 0.000 | PASS |
| annualHeatLoss | 51.028 | 51.025 | 0.01 | 0.003 | PASS |
| dewPoint | 11.995 | 11.995 | 0.00 | 0.000 | PASS |
| hc | 4.000 | 0.500 | 700.00 | 3.500 | FAIL |
| hr | 5.987 | 5.143 | 16.40 | 0.844 | FAIL |
| h | 9.987 | 5.643 | 76.97 | 4.344 | FAIL |

### [C-01] C_PipeSize — 1/2" OD=21.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 9.913 | 8.723 | 13.64 | 1.190 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 49.694 | 49.954 | -0.52 | -0.260 | PASS |
| heatFlux | 296.553 | 345.233 | -14.10 | -48.680 | PASS |
| linearHeatLoss | 38.316 | 42.024 | -8.82 | -3.708 | PASS |
| annualHeatLoss | 335.644 | 368.128 | -8.82 | -32.485 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.540 | -27.79 | -1.540 | PASS |
| hr | 5.987 | 5.986 | 0.02 | 0.001 | PASS |
| h | 9.987 | 11.525 | -13.35 | -1.539 | PASS |

### [C-02] C_PipeSize — 2" OD=60.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [C-03] C_PipeSize — 4" OD=114.3mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.087 | 12.127 | -0.33 | -0.040 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.117 | 50.195 | -0.16 | -0.079 | PASS |
| heatFlux | 300.771 | 299.450 | 0.44 | 1.321 | PASS |
| linearHeatLoss | 130.844 | 130.345 | 0.38 | 0.499 | PASS |
| annualHeatLoss | 1146.194 | 1141.825 | 0.38 | 4.369 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.924 | 1.94 | 0.076 | PASS |
| hr | 5.987 | 5.993 | -0.10 | -0.006 | PASS |
| h | 9.987 | 9.917 | 0.70 | 0.070 | PASS |

### [C-04] C_PipeSize — 8" OD=219.1mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.708 | 13.470 | -5.66 | -0.762 | PASS |
| standardThickness | 13 | 20 | -35.00 | — | INFO |
| surfaceTemp | 49.884 | 49.970 | -0.17 | -0.086 | PASS |
| heatFlux | 298.446 | 280.463 | 6.41 | 17.983 | PASS |
| linearHeatLoss | 229.257 | 216.786 | 5.75 | 12.471 | PASS |
| annualHeatLoss | 2008.294 | 1899.049 | 5.75 | 109.246 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.372 | 18.62 | 0.628 | PASS |
| hr | 5.987 | 5.986 | 0.01 | 0.001 | PASS |
| h | 9.987 | 9.358 | 6.72 | 0.629 | PASS |

### [C-05] C_PipeSize — 16" OD=406.4mm

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.957 | 14.251 | -9.08 | -1.294 | PASS |
| standardThickness | 13 | 20 | -35.00 | — | INFO |
| surfaceTemp | 49.982 | 50.330 | -0.69 | -0.348 | PASS |
| heatFlux | 299.428 | 270.483 | 10.70 | 28.945 | PASS |
| linearHeatLoss | 406.668 | 369.557 | 10.04 | 37.111 | PASS |
| annualHeatLoss | 3562.414 | 3237.321 | 10.04 | 325.093 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 2.921 | 36.95 | 1.079 | PASS |
| hr | 5.987 | 5.997 | -0.17 | -0.010 | PASS |
| h | 9.987 | 8.918 | 11.99 | 1.069 | PASS |

### [D-01] D_FlatDimensions — 1m×1m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.378 | 11.690 | 14.44 | 1.688 | PASS |
| standardThickness | 20 | 13 | 53.85 | — | INFO |
| surfaceTemp | 49.954 | 49.908 | 0.09 | 0.045 | PASS |
| heatFlux | 299.143 | 342.481 | -12.65 | -43.338 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 2620.491 | 3000.135 | -12.65 | -379.644 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.467 | -26.83 | -1.467 | PASS |
| hr | 5.987 | 5.984 | 0.04 | 0.003 | PASS |
| h | 9.987 | 11.451 | -12.79 | -1.464 | PASS |

### [D-02] D_FlatDimensions — 2m×1m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.378 | 11.690 | 14.44 | 1.688 | PASS |
| standardThickness | 20 | 13 | 53.85 | — | INFO |
| surfaceTemp | 49.954 | 49.908 | 0.09 | 0.045 | PASS |
| heatFlux | 299.143 | 342.481 | -12.65 | -43.338 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 5240.981 | 6000.269 | -12.65 | -759.288 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.467 | -26.83 | -1.467 | PASS |
| hr | 5.987 | 5.984 | 0.04 | 0.003 | PASS |
| h | 9.987 | 11.451 | -12.79 | -1.464 | PASS |

### [D-03] D_FlatDimensions — 5m×3m

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.378 | 11.690 | 14.44 | 1.688 | PASS |
| standardThickness | 20 | 13 | 53.85 | — | INFO |
| surfaceTemp | 49.954 | 49.908 | 0.09 | 0.045 | PASS |
| heatFlux | 299.143 | 342.481 | -12.65 | -43.338 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 39307.358 | 45002.020 | -12.65 | -5694.662 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.467 | -26.83 | -1.467 | PASS |
| hr | 5.987 | 5.984 | 0.04 | 0.003 | PASS |
| h | 9.987 | 11.451 | -12.79 | -1.464 | PASS |

### [E-01] E_Material — mineralwool k=0.040

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [E-02] E_Material — glasswool k=0.035

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 10.100 | 9.660 | 4.55 | 0.439 | PASS |
| standardThickness | 13 | 10 | 30.00 | — | INFO |
| surfaceTemp | 50.106 | 50.030 | 0.15 | 0.076 | PASS |
| heatFlux | 300.661 | 316.225 | -4.92 | -15.564 | PASS |
| linearHeatLoss | 76.036 | 79.099 | -3.87 | -3.063 | PASS |
| annualHeatLoss | 666.074 | 692.907 | -3.87 | -26.833 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.542 | -11.94 | -0.542 | PASS |
| hr | 5.987 | 5.988 | -0.02 | -0.001 | PASS |
| h | 9.987 | 10.530 | -5.16 | -0.544 | PASS |

### [E-03] E_Material — calciumsilicate k=0.052

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.323 | 13.814 | 3.69 | 0.509 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.093 | 50.085 | 0.01 | 0.007 | PASS |
| heatFlux | 300.532 | 313.317 | -4.08 | -12.785 | PASS |
| linearHeatLoss | 83.978 | 86.549 | -2.97 | -2.570 | PASS |
| annualHeatLoss | 735.651 | 758.165 | -2.97 | -22.514 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.424 | -9.59 | -0.424 | PASS |
| hr | 5.987 | 5.990 | -0.05 | -0.003 | PASS |
| h | 9.987 | 10.414 | -4.10 | -0.427 | PASS |

### [E-04] E_Material — polyurethane k=0.023

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 6.920 | 6.549 | 5.67 | 0.371 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.052 | 49.998 | 0.11 | 0.055 | PASS |
| heatFlux | 300.127 | 318.861 | -5.88 | -18.734 | PASS |
| linearHeatLoss | 69.905 | 73.524 | -4.92 | -3.620 | PASS |
| annualHeatLoss | 612.366 | 644.074 | -4.92 | -31.708 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.642 | -13.84 | -0.642 | PASS |
| hr | 5.987 | 5.987 | -0.00 | -0.000 | PASS |
| h | 9.987 | 10.630 | -6.05 | -0.643 | PASS |

### [E-05] E_Material — ceramicfiber k=0.120

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 29.072 | 28.938 | 0.46 | 0.133 | PASS |
| standardThickness | 30 | 30 | 0.00 | — | INFO |
| surfaceTemp | 50.041 | 49.975 | 0.13 | 0.066 | PASS |
| heatFlux | 300.020 | 301.903 | -0.62 | -1.883 | PASS |
| linearHeatLoss | 111.638 | 112.086 | -0.40 | -0.448 | PASS |
| annualHeatLoss | 977.947 | 981.871 | -0.40 | -3.924 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.085 | -2.09 | -0.085 | PASS |
| hr | 5.987 | 5.986 | 0.01 | 0.000 | PASS |
| h | 9.987 | 10.072 | -0.84 | -0.085 | PASS |

### [E-06] E_Material — custom k=0.060

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 16.175 | 15.880 | 1.85 | 0.295 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.151 | 49.833 | 0.64 | 0.318 | PASS |
| heatFlux | 301.114 | 308.589 | -2.42 | -7.475 | PASS |
| linearHeatLoss | 87.644 | 89.249 | -1.80 | -1.605 | PASS |
| annualHeatLoss | 767.763 | 781.819 | -1.80 | -14.056 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.362 | -8.29 | -0.362 | PASS |
| hr | 5.987 | 5.982 | 0.08 | 0.005 | PASS |
| h | 9.987 | 10.344 | -3.45 | -0.357 | PASS |

### [F-01] F_MediumTemp — Tf=50°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 3.970 | 3.906 | 1.61 | 0.063 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 34.943 | 35.047 | -0.30 | -0.104 | PASS |
| heatFlux | 142.716 | 144.147 | -0.99 | -1.431 | PASS |
| linearHeatLoss | 30.595 | 30.845 | -0.81 | -0.250 | PASS |
| annualHeatLoss | 268.016 | 270.203 | -0.81 | -2.187 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.027 | -0.68 | -0.027 | PASS |
| hr | 5.551 | 5.552 | -0.03 | -0.002 | PASS |
| h | 9.551 | 9.580 | -0.30 | -0.029 | PASS |

### [F-02] F_MediumTemp — Tf=150°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [F-03] F_MediumTemp — Tf=300°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 21.346 | 20.660 | 3.32 | 0.686 | PASS |
| standardThickness | 25 | 25 | 0.00 | — | INFO |
| surfaceTemp | 55.056 | 55.023 | 0.06 | 0.033 | PASS |
| heatFlux | 355.421 | 369.528 | -3.82 | -14.107 | PASS |
| linearHeatLoss | 114.999 | 117.971 | -2.52 | -2.971 | PASS |
| annualHeatLoss | 1007.395 | 1033.425 | -2.52 | -26.030 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.411 | -9.32 | -0.411 | PASS |
| hr | 6.139 | 6.140 | -0.02 | -0.001 | PASS |
| h | 10.139 | 10.551 | -3.91 | -0.412 | PASS |

### [F-04] F_MediumTemp — Tf=500°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 30.629 | 29.813 | 2.74 | 0.816 | PASS |
| standardThickness | 40 | 30 | 33.33 | — | INFO |
| surfaceTemp | 60.115 | 60.067 | 0.08 | 0.048 | PASS |
| heatFlux | 412.938 | 426.835 | -3.26 | -13.897 | PASS |
| linearHeatLoss | 157.696 | 160.814 | -1.94 | -3.118 | PASS |
| annualHeatLoss | 1381.417 | 1408.733 | -1.94 | -27.316 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.357 | -8.19 | -0.357 | PASS |
| hr | 6.294 | 6.296 | -0.04 | -0.002 | PASS |
| h | 10.294 | 10.653 | -3.37 | -0.359 | PASS |

### [F-05] F_MediumTemp — Tf=-10°C (制冷, 逆向热流)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 22.280 | 25.252 | -11.77 | -2.972 | PASS |
| standardThickness | 25 | 30 | -16.67 | — | INFO |
| surfaceTemp | 24.952 | 24.970 | -0.07 | -0.018 | PASS |
| heatFlux | -48.193 | -41.497 | -16.14 | -6.696 | PASS |
| linearHeatLoss | -15.876 | -14.445 | -9.91 | -1.431 | PASS |
| annualHeatLoss | -139.077 | -126.540 | -9.91 | -12.537 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 2.703 | 47.98 | 1.297 | PASS |
| hr | 5.548 | 5.547 | 0.01 | 0.000 | PASS |
| h | 9.548 | 8.250 | 15.73 | 1.297 | PASS |

### [G-01] G_AmbientTemp — Ta=-5°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 9.447 | 8.520 | 10.88 | 0.927 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 40.060 | 40.018 | 0.11 | 0.042 | PASS |
| heatFlux | 407.430 | 457.091 | -10.86 | -49.661 | PASS |
| linearHeatLoss | 101.368 | 111.061 | -8.73 | -9.693 | PASS |
| annualHeatLoss | 887.982 | 972.890 | -8.73 | -84.908 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.111 | -21.74 | -1.111 | PASS |
| hr | 5.042 | 5.043 | -0.01 | -0.001 | PASS |
| h | 9.042 | 10.154 | -10.95 | -1.112 | PASS |

### [G-02] G_AmbientTemp — Ta=20°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [G-03] G_AmbientTemp — Ta=35°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.882 | 14.813 | 0.46 | 0.069 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 54.902 | 55.045 | -0.26 | -0.144 | PASS |
| heatFlux | 210.554 | 211.362 | -0.38 | -0.809 | PASS |
| linearHeatLoss | 59.575 | 59.712 | -0.23 | -0.137 | PASS |
| annualHeatLoss | 521.877 | 523.081 | -0.23 | -1.204 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.963 | 0.94 | 0.037 | PASS |
| hr | 6.580 | 6.582 | -0.03 | -0.002 | PASS |
| h | 10.580 | 10.544 | 0.34 | 0.036 | PASS |

### [H-01] H_TargetSurfaceTemp — Ts_target=40°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 19.041 | 18.129 | 5.03 | 0.911 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 39.020 | 40.105 | -2.71 | -1.085 | PASS |
| heatFlux | 184.355 | 193.385 | -4.67 | -9.030 | PASS |
| linearHeatLoss | 56.979 | 58.663 | -2.87 | -1.684 | PASS |
| annualHeatLoss | 499.139 | 513.887 | -2.87 | -14.749 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.922 | 1.98 | 0.078 | PASS |
| hr | 5.693 | 5.696 | -0.06 | -0.003 | PASS |
| h | 9.693 | 9.619 | 0.77 | 0.074 | PASS |

### [H-02] H_TargetSurfaceTemp — Ts_target=50°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [H-03] H_TargetSurfaceTemp — Ts_target=60°C

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 7.784 | 7.216 | 7.86 | 0.568 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 60.099 | 59.977 | 0.20 | 0.122 | PASS |
| heatFlux | 412.769 | 449.085 | -8.09 | -36.316 | PASS |
| linearHeatLoss | 98.382 | 105.436 | -6.69 | -7.054 | PASS |
| annualHeatLoss | 861.825 | 923.621 | -6.69 | -61.796 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.940 | -19.03 | -0.940 | PASS |
| hr | 6.294 | 6.293 | 0.01 | 0.000 | PASS |
| h | 10.294 | 11.234 | -8.37 | -0.940 | PASS |

### [I-01] I_TargetHeatLoss — q_target=50 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 62.003 | 62.000 | 0.00 | 0.003 | PASS |
| standardThickness | 75 | 75 | 0.00 | — | INFO |
| surfaceTemp | 24.868 | 26.174 | -4.99 | -1.306 | PASS |
| heatFlux | 48.614 | 48.109 | 1.05 | 0.505 | PASS |
| linearHeatLoss | 28.148 | 27.855 | 1.05 | 0.293 | PASS |
| annualHeatLoss | 246.579 | 244.012 | 1.05 | 2.567 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 2.485 | 60.96 | 1.515 | PASS |
| hr | 5.987 | 5.307 | 12.80 | 0.679 | FAIL |
| h | 9.987 | 7.793 | 28.16 | 2.194 | FAIL |

### [I-02] I_TargetHeatLoss — q_target=100 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 33.048 | 33.255 | -0.62 | -0.206 | PASS |
| standardThickness | 40 | 40 | 0.00 | — | INFO |
| surfaceTemp | 30.254 | 31.610 | -4.29 | -1.356 | PASS |
| heatFlux | 102.406 | 100.474 | 1.92 | 1.932 | PASS |
| linearHeatLoss | 40.664 | 40.027 | 1.59 | 0.637 | PASS |
| annualHeatLoss | 356.219 | 350.640 | 1.59 | 5.579 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.198 | 25.09 | 0.802 | PASS |
| hr | 5.987 | 5.456 | 9.72 | 0.531 | FAIL |
| h | 9.987 | 8.654 | 15.40 | 1.333 | PASS |

### [I-03] I_TargetHeatLoss — q_target=200 W/m²

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 17.795 | 17.754 | 0.23 | 0.040 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 39.839 | 40.462 | -1.54 | -0.623 | PASS |
| heatFlux | 198.134 | 197.536 | 0.30 | 0.599 | PASS |
| linearHeatLoss | 59.687 | 59.457 | 0.39 | 0.230 | PASS |
| annualHeatLoss | 522.857 | 520.841 | 0.39 | 2.016 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 3.947 | 1.34 | 0.053 | PASS |
| hr | 5.987 | 5.707 | 4.91 | 0.280 | PASS |
| h | 9.987 | 9.654 | 3.45 | 0.333 | PASS |

### [J-01] J_Humidity — RH=40%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 6.272 | 7.126 | -11.99 | -0.854 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 15.549 | 15.795 | -1.56 | -0.246 | PASS |
| heatFlux | -148.474 | -130.465 | -13.80 | -18.009 | PASS |
| linearHeatLoss | -33.978 | -30.557 | -11.20 | -3.421 | PASS |
| annualHeatLoss | -297.644 | -267.676 | -11.20 | -29.968 | PASS |
| dewPoint | 14.925 | 14.925 | 0.00 | 0.000 | PASS |
| hc | 4.000 | 3.885 | 2.96 | 0.115 | PASS |
| hr | 6.275 | 5.300 | 18.40 | 0.975 | FAIL |
| h | 10.275 | 9.185 | 11.87 | 1.090 | PASS |

### [J-02] J_Humidity — RH=60%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 13.888 | 15.984 | -13.11 | -2.096 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 22.433 | 22.353 | 0.36 | 0.080 | PASS |
| heatFlux | -77.753 | -65.944 | -17.91 | -11.808 | FAIL |
| linearHeatLoss | -21.514 | -19.115 | -12.55 | -2.399 | PASS |
| annualHeatLoss | -188.465 | -167.450 | -12.55 | -21.014 | PASS |
| dewPoint | 21.385 | 21.385 | 0.00 | 0.000 | PASS |
| hc | 4.000 | 3.148 | 27.07 | 0.852 | PASS |
| hr | 6.275 | 5.475 | 14.59 | 0.799 | FAIL |
| h | 10.275 | 8.623 | 19.15 | 1.651 | PASS |

### [J-03] J_Humidity — RH=85%

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 54.016 | 64.000 | -15.60 | -9.984 | FAIL |
| standardThickness | 60 | 75 | -20.00 | — | INFO |
| surfaceTemp | 28.275 | 28.100 | 0.63 | 0.176 | PASS |
| heatFlux | -17.719 | -14.215 | -24.65 | -3.504 | PASS |
| linearHeatLoss | -9.370 | -8.409 | -11.43 | -0.961 | PASS |
| annualHeatLoss | -82.085 | -73.663 | -11.43 | -8.421 | PASS |
| dewPoint | 27.199 | 27.199 | 0.00 | 0.000 | PASS |
| hc | 4.000 | 1.846 | 116.70 | 2.154 | FAIL |
| hr | 6.275 | 5.634 | 11.37 | 0.641 | FAIL |
| h | 10.275 | 7.480 | 37.37 | 2.795 | FAIL |

### [K-01] K_Environment — indoor v=0

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [K-02] K_Environment — outdoor_calm v=1

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 7.105 | 6.178 | 15.01 | 0.927 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 49.900 | 49.988 | -0.18 | -0.088 | PASS |
| heatFlux | 507.909 | 590.766 | -14.03 | -82.857 | PASS |
| linearHeatLoss | 118.892 | 134.846 | -11.83 | -15.954 | PASS |
| annualHeatLoss | 1041.490 | 1181.249 | -11.83 | -139.758 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 11.000 | 13.713 | -19.79 | -2.713 | PASS |
| hr | 5.987 | 5.987 | 0.00 | 0.000 | PASS |
| h | 16.987 | 19.700 | -13.77 | -2.713 | PASS |

### [K-03] K_Environment — outdoor_moderate v=5

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 4.837 | 3.250 | 48.82 | 1.587 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 49.976 | 49.985 | -0.02 | -0.009 | PASS |
| heatFlux | 768.574 | 1169.980 | -34.31 | -401.406 | FAIL |
| linearHeatLoss | 168.955 | 245.531 | -31.19 | -76.576 | FAIL |
| annualHeatLoss | 1480.046 | 2150.854 | -31.19 | -670.808 | FAIL |
| dewPoint | None | None | — | — | N/A |
| hc | 19.652 | 33.032 | -40.50 | -13.379 | FAIL |
| hr | 5.987 | 5.987 | 0.00 | 0.000 | PASS |
| h | 25.639 | 39.019 | -34.29 | -13.379 | FAIL |

### [K-04] K_Environment — outdoor_strong v=10

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 3.893 | 2.376 | 63.88 | 1.518 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 50.090 | 49.941 | 0.30 | 0.149 | PASS |
| heatFlux | 966.581 | 1622.400 | -40.42 | -655.820 | FAIL |
| linearHeatLoss | 206.752 | 331.562 | -37.64 | -124.810 | FAIL |
| annualHeatLoss | 1811.150 | 2904.482 | -37.64 | -1093.332 | FAIL |
| dewPoint | None | None | — | — | N/A |
| hc | 26.136 | 48.201 | -45.78 | -22.065 | FAIL |
| hr | 5.987 | 5.985 | 0.02 | 0.001 | PASS |
| h | 32.123 | 54.187 | -40.72 | -22.064 | FAIL |

### [L-01] L_Emittance — ε=0.9 painted

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [L-02] L_Emittance — ε=0.7 Al jacket

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 12.926 | 12.315 | 4.96 | 0.611 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 50.052 | 50.106 | -0.11 | -0.054 | PASS |
| heatFlux | 260.143 | 274.740 | -5.31 | -14.597 | PASS |
| linearHeatLoss | 70.408 | 73.305 | -3.95 | -2.896 | PASS |
| annualHeatLoss | 616.777 | 642.149 | -3.95 | -25.372 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.467 | -10.45 | -0.467 | PASS |
| hr | 4.656 | 4.659 | -0.06 | -0.003 | PASS |
| h | 8.656 | 9.126 | -5.14 | -0.469 | PASS |

### [L-03] L_Emittance — ε=0.3 polished Al

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 17.670 | 16.000 | 10.44 | 1.670 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.189 | 51.311 | -2.19 | -1.122 | PASS |
| heatFlux | 181.003 | 200.929 | -9.92 | -19.926 | PASS |
| linearHeatLoss | 54.384 | 58.263 | -6.66 | -3.879 | PASS |
| annualHeatLoss | 476.407 | 510.385 | -6.66 | -33.978 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.408 | -9.26 | -0.408 | PASS |
| hr | 1.996 | 2.009 | -0.66 | -0.013 | PASS |
| h | 5.996 | 6.417 | -6.57 | -0.422 | PASS |

### [L-04] L_Emittance — ε=0.1 polished steel

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 21.034 | 16.000 | 31.46 | 5.034 | FAIL |
| standardThickness | 25 | 20 | 25.00 | — | INFO |
| surfaceTemp | 51.254 | 56.321 | -9.00 | -5.067 | FAIL |
| heatFlux | 145.808 | 190.728 | -23.55 | -44.920 | FAIL |
| linearHeatLoss | 46.892 | 55.305 | -15.21 | -8.413 | PASS |
| annualHeatLoss | 410.773 | 484.473 | -15.21 | -73.700 | FAIL |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.565 | -12.37 | -0.565 | PASS |
| hr | 0.665 | 0.687 | -3.12 | -0.021 | PASS |
| h | 4.665 | 5.251 | -11.16 | -0.586 | PASS |

### [L-05] L_Emittance — custom ε=0.5

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 14.509 | 14.282 | 1.59 | 0.227 | PASS |
| standardThickness | 20 | 20 | 0.00 | — | INFO |
| surfaceTemp | 50.853 | 50.008 | 1.69 | 0.845 | PASS |
| heatFlux | 226.031 | 232.133 | -2.63 | -6.102 | PASS |
| linearHeatLoss | 63.425 | 64.806 | -2.13 | -1.381 | PASS |
| annualHeatLoss | 555.602 | 567.700 | -2.13 | -12.098 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.409 | -9.28 | -0.409 | PASS |
| hr | 3.326 | 3.326 | -0.01 | -0.000 | PASS |
| h | 7.326 | 7.736 | -5.29 | -0.410 | PASS |

### [M-01] M_OperatingHours — hours=2000

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 156.125 | 162.683 | -4.03 | -6.558 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [M-02] M_OperatingHours — hours=5000

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 390.313 | 406.708 | -4.03 | -16.395 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [M-03] M_OperatingHours — hours=8760

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [N-01] N_UnitSystem — metric (基准)

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.893 | 50.046 | -0.31 | -0.153 | PASS |
| heatFlux | 298.540 | 315.297 | -5.31 | -16.757 | PASS |
| linearHeatLoss | 78.063 | 81.342 | -4.03 | -3.279 | PASS |
| annualHeatLoss | 683.828 | 712.552 | -4.03 | -28.724 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.21 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.03 | -0.002 | PASS |
| h | 9.987 | 10.494 | -4.83 | -0.507 | PASS |

### [N-02] N_UnitSystem — imperial→metric 等价换算

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 11.466 | 10.909 | 5.10 | 0.557 | PASS |
| standardThickness | 13 | 13 | 0.00 | — | INFO |
| surfaceTemp | 49.912 | 50.063 | -0.30 | -0.151 | PASS |
| heatFlux | 298.725 | 315.497 | -5.32 | -16.772 | PASS |
| linearHeatLoss | 78.134 | 81.418 | -4.03 | -3.284 | PASS |
| annualHeatLoss | 684.457 | 713.220 | -4.03 | -28.764 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 4.505 | -11.22 | -0.505 | PASS |
| hr | 5.987 | 5.989 | -0.04 | -0.002 | PASS |
| h | 9.987 | 10.495 | -4.84 | -0.508 | PASS |

### [Z-01] Z_StressCombined — 高温大管+强风+低发射率

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 22.966 | 28.006 | -18.00 | -5.040 | FAIL |
| standardThickness | 25 | 30 | -16.67 | — | INFO |
| surfaceTemp | 59.933 | 56.019 | 6.99 | 3.914 | FAIL |
| heatFlux | 804.244 | 654.241 | 22.93 | 150.003 | FAIL |
| linearHeatLoss | 669.631 | 565.452 | 18.42 | 104.179 | FAIL |
| annualHeatLoss | 5865.967 | 4953.362 | 18.42 | 912.605 | FAIL |
| dewPoint | None | None | — | — | N/A |
| hc | 26.136 | 24.427 | 7.00 | 1.709 | PASS |
| hr | 0.732 | 0.718 | 1.95 | 0.014 | PASS |
| h | 26.868 | 25.145 | 6.85 | 1.723 | PASS |

### [Z-02] Z_StressCombined — 低温制冷管+高湿防凝露

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 34.047 | 44.003 | -22.63 | -9.956 | FAIL |
| standardThickness | 40 | 50 | -20.00 | — | INFO |
| surfaceTemp | 30.128 | 30.301 | -0.57 | -0.173 | PASS |
| heatFlux | -32.448 | -24.014 | -35.12 | -8.434 | PASS |
| linearHeatLoss | -18.593 | -15.263 | -21.82 | -3.330 | PASS |
| annualHeatLoss | -162.875 | -133.701 | -21.82 | -29.174 | PASS |
| dewPoint | 29.158 | 29.158 | 0.00 | 0.000 | PASS |
| hc | 11.000 | 8.385 | 31.19 | 2.615 | FAIL |
| hr | 6.334 | 5.752 | 10.11 | 0.582 | FAIL |
| h | 17.334 | 14.137 | 22.62 | 3.197 | FAIL |

### [Z-03] Z_StressCombined — 大平壁+高热损目标+陶瓷纤维

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 224.409 | 226.501 | -0.92 | -2.092 | PASS |
| standardThickness | 150 | 150 | 0.00 | — | INFO |
| surfaceTemp | 37.321 | 33.450 | 11.57 | 3.871 | FAIL |
| heatFlux | 300.885 | 300.157 | 0.24 | 0.728 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | 22566.398 | 22511.793 | 0.24 | 54.605 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 19.652 | 31.130 | -36.87 | -11.477 | FAIL |
| hr | 4.767 | 4.390 | 8.58 | 0.377 | PASS |
| h | 24.420 | 35.520 | -31.25 | -11.101 | FAIL |

### [Z-04] Z_StressCombined — 小管+高表面温度目标+PUR

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 9.168 | 8.000 | 14.60 | 1.168 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 45.205 | 45.138 | 0.15 | 0.067 | PASS |
| heatFlux | 121.088 | 142.768 | -15.19 | -21.680 | FAIL |
| linearHeatLoss | 15.078 | 16.730 | -9.87 | -1.652 | PASS |
| annualHeatLoss | 60.311 | 66.919 | -9.87 | -6.608 | PASS |
| dewPoint | None | None | — | — | N/A |
| hc | 4.000 | 5.095 | -21.49 | -1.095 | PASS |
| hr | 1.993 | 1.994 | -0.07 | -0.001 | PASS |
| h | 5.993 | 7.090 | -15.47 | -1.097 | PASS |

### [Z-05] Z_StressCombined — 平壁防凝露+玻璃棉+室外

| 指标 | WebApp | Reference | 相对偏差% | 绝对偏差 | 状态 |
|---|---|---|---|---|---|
| thickness_mm | 5.878 | 6.008 | -2.17 | -0.130 | PASS |
| standardThickness | 10 | 10 | 0.00 | — | INFO |
| surfaceTemp | 23.696 | 25.258 | -6.18 | -1.561 | PASS |
| heatFlux | -111.327 | -118.009 | 5.66 | 6.682 | PASS |
| linearHeatLoss | None | None | — | — | N/A |
| annualHeatLoss | -3900.912 | -4135.042 | 5.66 | 234.131 | PASS |
| dewPoint | 23.152 | 23.152 | 0.00 | 0.000 | PASS |
| hc | 19.652 | 37.531 | -47.64 | -17.879 | FAIL |
| hr | 6.216 | 5.499 | 13.03 | 0.717 | FAIL |
| h | 25.869 | 43.030 | -39.88 | -17.162 | FAIL |
