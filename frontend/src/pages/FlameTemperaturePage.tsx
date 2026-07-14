import { useState, useMemo } from 'react'
import ProFeaturePreview from '../components/ProFeaturePreview'
import { Navbar } from '../components/Navbar'
import GasComposition, { GasComponent, GasPreset, defaultGasComponents } from '../components/GasComposition'
import { authAPI } from '../services/api'
import { Thermometer, AlertTriangle, Download, Zap, Flame } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { usePersistentState } from '../hooks/usePersistentState'

const gasPresets: GasPreset[] = [
  {
    name: 'North sea natural gas H',
    composition: { 'CH₄': '92.0', 'C₂H₆': '3.5', 'C₃H₈': '1.5', 'C₄H₁₀': '0.5', 'N₂': '1.5', 'CO₂': '1.0' }
  },
  {
    name: 'Russian natural gas H',
    composition: { 'CH₄': '98.0', 'C₂H₆': '0.7', 'C₃H₈': '0.3', 'N₂': '0.8', 'CO₂': '0.2' }
  },
  {
    name: 'Dutch natural gas L',
    composition: { 'CH₄': '81.0', 'C₂H₆': '3.0', 'C₃H₈': '0.8', 'N₂': '13.2', 'CO₂': '2.0' }
  },
  {
    name: 'Erdgas L (Low Calorific)',
    composition: { 'CH₄': '86.0', 'C₂H₆': '4.0', 'C₃H₈': '1.0', 'N₂': '7.0', 'CO₂': '2.0' }
  },
  {
    name: 'Erdgas H (High Calorific)',
    composition: { 'CH₄': '95.0', 'C₂H₆': '2.5', 'C₃H₈': '0.8', 'N₂': '1.2', 'CO₂': '0.5' }
  },
  {
    name: 'Coke oven gas',
    composition: { 'H₂': '58.0', 'CH₄': '27.0', 'CO': '6.0', 'N₂': '5.0', 'CO₂': '2.0', 'C₂H₄': '2.0' }
  },
  {
    name: 'Blast furnace gas (BFG)',
    composition: { 'N₂': '55.0', 'CO': '25.0', 'CO₂': '18.0', 'H₂': '2.0' }
  },
  {
    name: 'Mixed natural gas H',
    composition: { 'CH₄': '94.0', 'C₂H₆': '3.0', 'C₃H₈': '1.0', 'N₂': '1.5', 'CO₂': '0.5' }
  },
  {
    name: 'Biogas',
    composition: { 'CH₄': '60.0', 'CO₂': '40.0' }
  },
  {
    name: 'Hydrogen',
    composition: { 'H₂': '100.0' }
  },
  {
    name: 'Methane',
    composition: { 'CH₄': '100.0' }
  },
  {
    name: 'Propane',
    composition: { 'C₃H₈': '100.0' }
  },
  {
    name: 'Propane, Commercial',
    composition: { 'C₃H₈': '95.0', 'C₄H₁₀': '5.0' }
  },
  {
    name: 'Butane',
    composition: { 'C₄H₁₀': '100.0' }
  },
  {
    name: 'Average Natural Gas',
    composition: { 'CH₄': '90.0', 'C₂H₆': '5.0', 'C₃H₈': '1.5', 'N₂': '2.5', 'CO₂': '1.0' }
  },
  {
    name: 'Landfill, Cagistrio 81',
    composition: { 'CH₄': '50.0', 'CO₂': '45.0', 'N₂': '5.0' }
  },
  {
    name: 'N.Gas Birmingham',
    composition: { 'CH₄': '92.5', 'C₂H₆': '3.0', 'C₃H₈': '0.5', 'N₂': '3.0', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas East Ohio',
    composition: { 'CH₄': '94.0', 'C₂H₆': '2.5', 'C₃H₈': '0.8', 'N₂': '1.7', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas Pittsburgh',
    composition: { 'CH₄': '93.0', 'C₂H₆': '3.0', 'C₃H₈': '0.5', 'N₂': '2.5', 'CO₂': '1.0' }
  },
  {
    name: 'N.Gas UGI',
    composition: { 'CH₄': '91.0', 'C₂H₆': '3.5', 'C₃H₈': '0.8', 'N₂': '3.7', 'CO₂': '1.0' }
  },
  {
    name: 'Producer, Koppers-Totzek',
    composition: { 'CO': '30.0', 'H₂': '14.0', 'N₂': '52.0', 'CO₂': '4.0' }
  },
  {
    name: 'Producer, Lurgi',
    composition: { 'CO': '28.0', 'H₂': '12.0', 'N₂': '54.0', 'CO₂': '6.0' }
  },
  {
    name: 'UGI Gas',
    composition: { 'CO': '25.0', 'H₂': '15.0', 'CH₄': '10.0', 'N₂': '45.0', 'CO₂': '5.0' }
  },
]

const R = 0.008314 // kJ/mol/K

interface NasaCoeffs {
  Tmid: number
  low: { a: number[] }
  high: { a: number[] }
}

const nasaCoeffs: Record<string, NasaCoeffs> = {
  'Ar': {
    Tmid: 1000,
    low: { a: [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] },
    high: { a: [2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491] }
  },
  'CH₄': {
    Tmid: 1000,
    low: { a: [5.14987613, -0.0136709788, 4.91800599e-05, -4.84743026e-08, 1.66693956e-11, -10246.6476, -4.64130376] },
    high: { a: [1.63552643, 0.0100842795, -3.36916254e-06, 5.34958667e-10, -3.15518833e-14, -10005.6455, 9.99313326] }
  },
  'CO': {
    Tmid: 1000,
    low: { a: [3.57953347, -0.00061035368, 1.01681433e-06, 9.07005884e-10, -9.04424499e-13, -14344.086, 3.50840928] },
    high: { a: [3.04848583, 0.00135172818, -4.85794075e-07, 7.88536486e-11, -4.69807489e-15, -14266.1171, 6.0170979] }
  },
  'CO₂': {
    Tmid: 1000,
    low: { a: [2.35677352, 0.00898459677, -7.12356269e-06, 2.45919022e-09, -1.43699548e-13, -48371.9697, 9.90105222] },
    high: { a: [4.63659493, 0.00274131991, -9.95828531e-07, 1.60373011e-10, -9.16103468e-15, -49024.9341, -1.93534855] }
  },
  'C₂H₄': {
    Tmid: 1000,
    low: { a: [3.95920148, -0.00757052247, 5.70990292e-05, -6.91588753e-08, 2.69884373e-11, 5089.77593, 4.09733096] },
    high: { a: [3.99182761, 0.010483391, -3.71721385e-06, 5.94628514e-10, -3.53630526e-14, 4268.65819, -0.269052151] }
  },
  'C₂H₆': {
    Tmid: 1000,
    low: { a: [4.29142492, -0.0055015427, 5.99438288e-05, -7.08466285e-08, 2.68685771e-11, -11522.2055, 2.66682316] },
    high: { a: [4.04666674, 0.0153538766, -5.47039321e-06, 8.77826228e-10, -5.23167305e-14, -12447.3512, -0.968683607] }
  },
  'C₃H₈': {
    Tmid: 1000,
    low: { a: [4.2110262, 0.00171599803, 7.06183472e-05, -9.19594116e-08, 3.64421372e-11, -14381.2106, 5.60930491] },
    high: { a: [6.66789363, 0.0206120214, -7.36553027e-06, 1.18440761e-09, -7.0695321e-14, -16274.8521, -13.1859503] }
  },
  'C₄H₁₀': {
    Tmid: 1000,
    low: { a: [6.14746806, 0.000155947389, 9.67913517e-05, -1.2548391e-07, 4.97816555e-11, -17599.4402, -1.09409879] },
    high: { a: [9.44535834, 0.0257858073, -9.23619122e-06, 1.48632755e-09, -8.87897158e-14, -20138.2165, -26.3470076] }
  },
  'C₅H₁₂': {
    Tmid: 1000,
    low: { a: [1.8983679, 0.041203037, 1.2312175e-05, -3.6589501e-08, 1.5042509e-11, -20091.5, 18.679082] },
    high: { a: [13.546998, 0.028421786, -9.4174648e-06, 1.3893589e-09, -7.4212609e-14, -24577.68, -47.021175] }
  },
  'C₆H₆': {
    Tmid: 1000,
    low: { a: [0.503469664, 0.0185142363, 7.37864409e-05, -1.18106127e-07, 5.07182527e-11, 8552.66293, 21.6481796] },
    high: { a: [11.0771708, 0.0207067895, -7.516251e-06, 1.22209416e-09, -7.35312513e-14, 4309.88395, -40.011695] }
  },
  'C₇H₁₆': {
    Tmid: 1000,
    low: { a: [11.1532484, -0.00949415433, 0.000195571181, -2.4975252e-07, 9.84873213e-11, -26771.1735, -15.909611] },
    high: { a: [18.5354704, 0.0391420468, -1.38030268e-05, 2.22403874e-09, -1.3345258e-13, -31950.0783, -70.190284] }
  },
  'H': {
    Tmid: 1000,
    low: { a: [2.5, 0.0, 0.0, 0.0, 0.0, 25473.6599, -0.446682853] },
    high: { a: [2.50000286, -5.65334214e-09, 3.63251723e-12, -9.1994972e-16, 7.95260746e-20, 25473.6589, -0.446698494] }
  },
  'H₂': {
    Tmid: 1000,
    low: { a: [2.34433112, 0.00798052075, -1.9478151e-05, 2.01572094e-08, -7.37611761e-12, -917.935173, 0.683010238] },
    high: { a: [2.93286579, 0.000826607967, -1.46402335e-07, 1.54100359e-11, -6.88804432e-16, -813.065597, -1.02432887] }
  },
  'H₂O': {
    Tmid: 1000,
    low: { a: [4.19864056, -0.0020364341, 6.52040211e-06, -5.48797062e-09, 1.77197817e-12, -30293.7267, -0.849032208] },
    high: { a: [2.67703787, 0.00297318329, -7.7376969e-07, 9.44336689e-11, -4.26900959e-15, -29885.8938, 6.88255571] }
  },
  'H₂S': {
    Tmid: 1000,
    low: { a: [3.9323476, -0.00050260905, 4.5928473e-06, -3.1807214e-09, 6.6497561e-13, -3650.5359, 2.3157905] },
    high: { a: [2.7452199, 0.0040434607, -1.538451e-06, 2.7520249e-10, -1.8592095e-14, -3419.9444, 8.0546745] }
  },
  'NH₃': {
    Tmid: 1000,
    low: { a: [4.30177808, -0.0047712733, 2.19341619e-05, -2.29856489e-08, 8.28992268e-12, -6748.06394, -0.690644393] },
    high: { a: [2.71709692, 0.00556856338, -1.76886396e-06, 2.6741726e-10, -1.52731419e-14, -6584.51989, 6.09289837] }
  },
  'NO₂': {
    Tmid: 1000,
    low: { a: [3.94403907, -0.00158547444, 1.66578984e-05, -2.04754478e-08, 7.83503265e-12, 2896.59865, 6.31196225] },
    high: { a: [4.88474429, 0.00217241639, -8.2807902e-07, 1.57477293e-10, -1.05110549e-14, 2316.48462, -0.117357075] }
  },
  'N₂': {
    Tmid: 1000,
    low: { a: [3.53100528, -0.000123660987, -5.02999437e-07, 2.43530612e-09, -1.40881235e-12, -1046.97628, 2.96747468] },
    high: { a: [2.95257626, 0.00139690057, -4.92631691e-07, 7.86010367e-11, -4.60755321e-15, -923.948645, 5.87189252] }
  },
  'O': {
    Tmid: 1000,
    low: { a: [3.1682671, -0.00327931884, 6.64306396e-06, -6.12806624e-09, 2.11265971e-12, 29122.2592, 2.05193346] },
    high: { a: [2.54363697, -2.73162486e-05, -4.1902952e-09, 4.95481845e-12, -4.79553694e-16, 29226.012, 4.92229457] }
  },
  'OH': {
    Tmid: 1000,
    low: { a: [3.99201543, -0.00240131752, 4.61793841e-06, -3.88113333e-09, 1.3641147e-12, 3615.08056, -0.103925458] },
    high: { a: [2.83864607, 0.00110725586, -2.93914978e-07, 4.20524247e-11, -2.42169092e-15, 3943.95852, 5.84452662] }
  },
  'O₂': {
    Tmid: 1000,
    low: { a: [3.78245636, -0.00299673415, 9.847302e-06, -9.68129508e-09, 3.24372836e-12, -1063.94356, 3.65767573] },
    high: { a: [3.66096083, 0.000656365523, -1.41149485e-07, 2.05797658e-11, -1.29913248e-15, -1215.97725, 3.41536184] }
  },
  'NO': {
    Tmid: 1000,
    low: { a: [4.21847630E+0, -4.63897600E-3, 1.10410220E-5, -9.33613540E-9, 2.80357700E-12, 9.84462300E+3, 2.28084640E+0] },
    high: { a: [3.26060560E+0, 1.19110430E-3, -4.29170480E-7, 6.94576690E-11, -4.03360990E-15, 9.92097460E+3, 6.36930270E+0] }
  },
  'C₂H₂': {
    Tmid: 1000,
    low: { a: [8.08681094E-1, 2.33615629E-2, -3.55171815E-5, 2.80152437E-8, -8.50072974E-12, 2.64289807E+4, 1.39397051E+1] },
    high: { a: [4.14756964E+0, 5.96166664E-3, -2.37294852E-6, 4.67412171E-10, -3.61235213E-14, 2.59359992E+4, -1.23028121E+0] }
  },
  'C₃H₆': {
    Tmid: 1000,
    low: { a: [3.83464524E+0, 3.29078405E-3, 5.05228184E-5, -6.66251418E-8, 2.63707585E-11, 7.53838295E+2, 7.53410995E+0] },
    high: { a: [6.03870499E+0, 1.62963895E-2, -5.82130624E-6, 9.35936483E-10, -5.58602903E-14, -7.76595092E+2, -8.43824322E+0] }
  },
  'C₄H₈': {
    Tmid: 1000,
    low: { a: [4.42674073E+0, 6.63946249E-3, 6.80652815E-5, -9.28753562E-8, 3.73473949E-11, -2.11532796E+3, 7.54694860E+0] },
    high: { a: [8.02147991E+0, 2.26010707E-2, -8.31284033E-6, 1.37803072E-9, -8.42175459E-14, -4.30852153E+3, -1.71170697E+1] }
  },
  'C₆H₁₄': {
    Tmid: 1000,
    low: { a: [-1.47354084E+1, 1.60819903E-1, -2.42440864E-4, 2.27672356E-7, -8.49544996E-11, 2.49945758E+2, 9.17374721E+1] },
    high: { a: [2.32930500E-4, 7.13406575E-2, -2.84662523E-5, 3.03642413E-9, 5.26853292E-13, -2.04700704E+3, 2.46975000E+1] }
  },
};

const enthalpyOfFormation: Record<string, number> = {
  'H₂': 0, 'CO': -110.5, 'NH₃': -45.9, 'H₂S': -20.6,
  'CH₄': -74.87, 'C₂H₆': -84.7, 'C₃H₈': -103.85, 'C₄H₁₀': -126.15,
  'C₅H₁₂': -147.1, 'C₆H₁₄': -170.0, 'C₇H₁₆': -190.0,
  'C₆H₆': 49.0, 'C₂H₄': 52.5, 'C₃H₆': 20.4, 'C₄H₈': -0.1, 'C₂H₂': 226.7,
  'N₂': 0, 'CO₂': -393.52, 'O₂': 0, 'H₂O': -241.83
}

const atomicComp: Record<string, { c: number; h: number; o: number; n: number }> = {
  'H₂': { c: 0, h: 2, o: 0, n: 0 }, 'CO': { c: 1, h: 0, o: 1, n: 0 },
  'NH₃': { c: 0, h: 3, o: 0, n: 1 }, 'H₂S': { c: 0, h: 2, o: 0, n: 0 },
  'CH₄': { c: 1, h: 4, o: 0, n: 0 }, 'C₂H₆': { c: 2, h: 6, o: 0, n: 0 },
  'C₃H₈': { c: 3, h: 8, o: 0, n: 0 }, 'C₄H₁₀': { c: 4, h: 10, o: 0, n: 0 },
  'C₅H₁₂': { c: 5, h: 12, o: 0, n: 0 }, 'C₆H₁₄': { c: 6, h: 14, o: 0, n: 0 },
  'C₇H₁₆': { c: 7, h: 16, o: 0, n: 0 }, 'C₆H₆': { c: 6, h: 6, o: 0, n: 0 },
  'C₂H₄': { c: 2, h: 4, o: 0, n: 0 }, 'C₃H₆': { c: 3, h: 6, o: 0, n: 0 },
  'C₄H₈': { c: 4, h: 8, o: 0, n: 0 }, 'C₂H₂': { c: 2, h: 2, o: 0, n: 0 },
  'N₂': { c: 0, h: 0, o: 0, n: 2 }, 'CO₂': { c: 1, h: 0, o: 2, n: 0 },
  'O₂': { c: 0, h: 0, o: 2, n: 0 }, 'H₂O': { c: 0, h: 2, o: 1, n: 0 },
  'OH': { c: 0, h: 1, o: 1, n: 0 }, 'O': { c: 0, h: 0, o: 1, n: 0 },
  'H': { c: 0, h: 1, o: 0, n: 0 }, 'NO': { c: 0, h: 0, o: 1, n: 1 },
  'NO₂': { c: 0, h: 0, o: 2, n: 1 }, 'Ar': { c: 0, h: 0, o: 0, n: 0 }
}

const equilibriumSpecies = ['CO₂', 'H₂O', 'CO', 'H₂', 'O₂', 'N₂', 'OH', 'O', 'H', 'NO', 'NO₂']

type OxidizerType = 'air' | 'oxygen' | 'mixed'

function getCoeffs(species: string, T: number): number[] | null {
  const data = nasaCoeffs[species]
  if (!data) return null
  return T < data.Tmid ? data.low.a : data.high.a
}

function enthalpy(species: string, T: number): number {
  const a = getCoeffs(species, T)
  if (!a) return 0
  const H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
  return R * T * H_RT
}

function entropy(species: string, T: number): number {
  const a = getCoeffs(species, T)
  if (!a) return 0
  const S_R = a[0] * Math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
  return R * S_R
}

function chemPotential(species: string, T: number, P_bar: number = 1): number {
  const P0_bar = 1
  const mu0 = enthalpy(species, T) - T * entropy(species, T)
  return mu0 + R * T * Math.log(P_bar / P0_bar)
}

function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k
    }
    if (Math.abs(M[maxRow][i]) < 1e-30) return null
    ;[M[i], M[maxRow]] = [M[maxRow], M[i]]
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i]
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n]
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j]
    x[i] /= M[i][i]
  }
  return x
}

interface ElementVector {
  c: number
  h: number
  o: number
  n: number
}

function equilibriumComposition(b: ElementVector, T: number, P: number = 1): Record<string, number> {
  const elementNames: (keyof ElementVector)[] = ['c', 'h', 'o', 'n']
  const activeElements: (keyof ElementVector)[] = []
  const elementIndex: Partial<Record<keyof ElementVector, number>> = {}
  for (const el of elementNames) {
    if (b[el] > 1e-12) {
      elementIndex[el] = activeElements.length
      activeElements.push(el)
    }
  }
  const ne = activeElements.length
  if (ne === 0) return {}

  const activeSpecies = equilibriumSpecies.filter(sp => {
    const comp = atomicComp[sp]
    if (b.c < 1e-12 && comp.c > 0) return false
    if (b.h < 1e-12 && comp.h > 0) return false
    if (b.o < 1e-12 && comp.o > 0) return false
    if (b.n < 1e-12 && comp.n > 0) return false
    return true
  })

  const RT = R * T
  const ns = activeSpecies.length

  function computePi(lambda: number[]): number[] {
    return activeSpecies.map(sp => {
      const comp = atomicComp[sp]
      const mu = chemPotential(sp, T, P)
      let arg = -mu / RT
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]!] / RT
      return Math.exp(Math.max(-700, Math.min(700, arg)))
    })
  }

  let lambda = new Array(ne).fill(0)
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O₂', T, P) / 2
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N₂', T, P) / 2
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['c']] = chemPotential('CO₂', T, P) - 2 * lambda[elementIndex['o']]
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['h']] = (chemPotential('H₂O', T, P) - lambda[elementIndex['o']]) / 2
  }

  const refEl = activeElements[ne - 1]
  const bRef = b[refEl]

  for (let iter = 0; iter < 300; iter++) {
    const pi = computePi(lambda)
    const sumPi = pi.reduce((s, v) => s + v, 0)

    const sumEl = activeElements.map(el => {
      let s = 0
      for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * pi[i]
      return s
    })

    const Rvec = new Array(ne).fill(0)
    for (let j = 0; j < ne - 1; j++) {
      Rvec[j] = b[activeElements[j]] * sumEl[ne - 1] - bRef * sumEl[j]
    }
    Rvec[ne - 1] = sumPi - 1.0

    const err = Math.sqrt(Rvec.reduce((s, v) => s + v * v, 0))
    if (err < 1e-10) {
      const nTotal = bRef / sumEl[ne - 1]
      const result: Record<string, number> = {}
      for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i]
      return result
    }

    const J: number[][] = Array(ne).fill(0).map(() => Array(ne).fill(0))
    for (let k = 0; k < ne; k++) {
      const sumAkPi = pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][activeElements[k]] * v, 0) / RT

      for (let j = 0; j < ne - 1; j++) {
        let crossJ = 0
        let crossRef = 0
        for (let i = 0; i < ns; i++) {
          const comp = atomicComp[activeSpecies[i]]
          const val = comp[activeElements[j]] * comp[activeElements[k]] * pi[i] / RT
          crossJ += val
          crossRef += comp[activeElements[ne - 1]] * comp[activeElements[k]] * pi[i] / RT
        }
        J[j][k] = b[activeElements[j]] * crossRef - bRef * crossJ
      }

      J[ne - 1][k] = sumAkPi
    }

    const dlambda = solveLinear(J, Rvec.map(v => -v))
    if (!dlambda) break

    let stepScale = 1.0
    for (let attempt = 0; attempt < 15; attempt++) {
      const newLambda = lambda.map((v, j) => v + stepScale * dlambda[j])
      const newPi = computePi(newLambda)
      const newSumEl = activeElements.map(el => {
        let s = 0
        for (let i = 0; i < ns; i++) s += atomicComp[activeSpecies[i]][el] * newPi[i]
        return s
      })
      const newRvec = new Array(ne).fill(0)
      for (let j = 0; j < ne - 1; j++) {
        newRvec[j] = b[activeElements[j]] * newSumEl[ne - 1] - bRef * newSumEl[j]
      }
      newRvec[ne - 1] = newPi.reduce((s, v) => s + v, 0) - 1.0
      const newErr = Math.sqrt(newRvec.reduce((s, v) => s + v * v, 0))
      if (newErr < err || stepScale < 1e-6) {
        lambda = newLambda
        break
      }
      stepScale *= 0.5
    }
  }

  const pi = computePi(lambda)
  const sumEl = activeElements.map(el => pi.reduce((s, v, i) => s + atomicComp[activeSpecies[i]][el] * v, 0))
  const nTotal = bRef / sumEl[ne - 1]
  const result: Record<string, number> = {}
  for (let i = 0; i < ns; i++) result[activeSpecies[i]] = nTotal * pi[i]
  return result
}

function productEnthalpy(b: ElementVector, T: number, arMoles: number = 0, P: number = 1): number {
  const eq = equilibriumComposition(b, T, P)
  let sum = 0
  for (const sp of equilibriumSpecies) sum += (eq[sp] || 0) * enthalpy(sp, T)
  sum += arMoles * enthalpy('Ar', T)
  return sum
}

export default function FlameTemperaturePage() {
  const [gasComponents, setGasComponents] = usePersistentState<GasComponent[]>(
    'flametemp_gasComponents',
    defaultGasComponents.map(c => ({ ...c }))
  )
  const [selectedPreset, setSelectedPreset] = usePersistentState('flametemp_selectedPreset', '')

  const [fuelTemperature, setFuelTemperature] = usePersistentState('flametemp_fuelTemperature', '25')
  const [oxidizerType, setOxidizerType] = usePersistentState<OxidizerType>('flametemp_oxidizerType', 'air')
  const [airRatio, setAirRatio] = usePersistentState('flametemp_airRatio', '100')
  const [oxygenRatio, setOxygenRatio] = usePersistentState('flametemp_oxygenRatio', '0')
  const [oxidizerTemperature, setOxidizerTemperature] = usePersistentState('flametemp_oxidizerTemperature', '25')
  const [excessAirRatio, setExcessAirRatio] = usePersistentState('flametemp_excessAirRatio', '1.2')
  const [pressure, setPressure] = usePersistentState('flametemp_pressure', '1')

  const [showResults, setShowResults] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const isLoggedIn = authAPI.isAuthenticated()
  const isProUser = isLoggedIn && authAPI.getSubscriptionTier() !== 'free'

  const handleProAction = (action: () => void) => {
    action()
  }

  const handleLoginClick = () => {
    setShowSubscriptionModal(false)
    window.location.href = '/login'
  }

  const handleUpgradeClick = () => {
    setShowSubscriptionModal(false)
    window.location.href = '/subscription'
  }

  const getTotalPercentage = () => {
    return gasComponents.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0)
  }

  const calculateFlameTemperature = () => {
    const totalPercentage = getTotalPercentage()
    if (Math.abs(totalPercentage - 100) > 0.01) return null

    let totalC = 0, totalH = 0, totalO = 0, totalN = 0

    gasComponents.forEach(component => {
      const moleFraction = parseFloat(component.percentage) / 100
      if (moleFraction > 0 && atomicComp[component.symbol]) {
        const comp = atomicComp[component.symbol]
        totalC += moleFraction * comp.c
        totalH += moleFraction * comp.h
        totalO += moleFraction * comp.o
        totalN += moleFraction * comp.n
      }
    })

    const stoichO2 = totalC + totalH / 4 - totalO / 2
    if (stoichO2 <= 0) return null

    const lambda = parseFloat(excessAirRatio) || 1.0
    const actualO2 = stoichO2 * lambda

    let o2InOxidizer: number, n2InOxidizer: number, arInOxidizer: number
    if (oxidizerType === 'air') {
      o2InOxidizer = 0.2095
      n2InOxidizer = 0.7809
      arInOxidizer = 0.0096
    } else if (oxidizerType === 'oxygen') {
      o2InOxidizer = 1.0
      n2InOxidizer = 0.0
      arInOxidizer = 0.0
    } else {
      o2InOxidizer = (parseFloat(airRatio) * 0.2095 + parseFloat(oxygenRatio)) / 100
      n2InOxidizer = parseFloat(airRatio) * 0.7809 / 100
      arInOxidizer = parseFloat(airRatio) * 0.0096 / 100
    }

    const oxidizerMoles = actualO2 / o2InOxidizer
    const n2FromOxidizer = oxidizerMoles * n2InOxidizer
    const arFromOxidizer = oxidizerMoles * arInOxidizer

    const b: ElementVector = {
      c: totalC,
      h: totalH,
      o: totalO + actualO2 * 2,
      n: totalN + n2FromOxidizer * 2
    }

    // Ar is inert and doesn't participate in element balance,
    // but we track it separately for enthalpy and product composition
    const arMoles = arFromOxidizer

    const Tfuel = parseFloat(fuelTemperature) || 25
    const TfuelK = Tfuel + 273.15

    let Hreact = 0
    gasComponents.forEach(component => {
      const moleFraction = parseFloat(component.percentage) / 100
      if (moleFraction > 0) {
        Hreact += moleFraction * enthalpy(component.symbol, TfuelK)
      }
    })

    const Tox = (parseFloat(oxidizerTemperature) || 25) + 273.15
    Hreact += actualO2 * enthalpy('O₂', Tox) + n2FromOxidizer * enthalpy('N₂', Tox) + arMoles * enthalpy('Ar', Tox)

    const P = parseFloat(pressure) || 1.0

    const frozenEnthalpy = (T: number) => {
      const nCO2 = totalC
      const nH2O = totalH / 2
      const nO2 = actualO2 - stoichO2
      const nN2 = n2FromOxidizer + totalN / 2
      return nCO2 * enthalpy('CO₂', T)
           + nH2O * enthalpy('H₂O', T)
           + nO2 * enthalpy('O₂', T)
           + nN2 * enthalpy('N₂', T)
           + arMoles * enthalpy('Ar', T)
    }

    const Tmax = oxidizerType === 'oxygen' ? 7000 : 4000
    let Tlow = 300, Thigh = Tmax
    for (let i = 0; i < 200; i++) {
      const Tmid = (Tlow + Thigh) / 2
      const Hmid = productEnthalpy(b, Tmid, arMoles, P)
      if (Hmid > Hreact) Thigh = Tmid
      else Tlow = Tmid
      if (Thigh - Tlow < 0.1) break
    }
    const T_equilibrium_K = (Tlow + Thigh) / 2

    Tlow = 300; Thigh = Tmax
    for (let i = 0; i < 200; i++) {
      const Tmid = (Tlow + Thigh) / 2
      const Hmid = frozenEnthalpy(Tmid)
      if (Hmid > Hreact) Thigh = Tmid
      else Tlow = Tmid
      if (Thigh - Tlow < 0.1) break
    }
    const T_frozen_K = (Tlow + Thigh) / 2

    const composition = equilibriumComposition(b, T_equilibrium_K, P)
    const totalMoles = Object.values(composition).reduce((s, v) => s + v, 0) + arMoles
    
    const products_mole_pct: Record<string, number> = {}
    for (const [sp, moles] of Object.entries(composition)) {
      products_mole_pct[sp] = (moles / totalMoles) * 100
    }
    if (arMoles > 0) {
      products_mole_pct['Ar'] = (arMoles / totalMoles) * 100
    }

    const deltaG = (T: number) => {
      let sum = 0
      for (const sp of equilibriumSpecies) {
        const n = composition[sp] || 0
        if (n > 0) sum += n * chemPotential(sp, T, P)
      }
      return sum
    }

    const cpMix = () => {
      let sum = 0
      for (const sp of equilibriumSpecies) {
        const n = composition[sp] || 0
        if (n > 0) {
          const a = getCoeffs(sp, T_equilibrium_K)
          if (a) sum += n * R * (a[0] + a[1] * T_equilibrium_K + a[2] * T_equilibrium_K * T_equilibrium_K + a[3] * T_equilibrium_K * T_equilibrium_K * T_equilibrium_K + a[4] * T_equilibrium_K * T_equilibrium_K * T_equilibrium_K * T_equilibrium_K)
        }
      }
      return sum / totalMoles
    }

    const gamma = cpMix() / (cpMix() - R)

    return {
      T_frozen_K: T_frozen_K,
      T_frozen_C: Math.max(0, T_frozen_K - 273.15),
      T_equilibrium_K: T_equilibrium_K,
      T_equilibrium_C: Math.max(0, T_equilibrium_K - 273.15),
      products_mole_pct: products_mole_pct,
      stoichO2,
      totalMoles,
      deltaG: deltaG(T_equilibrium_K),
      cpMix: cpMix(),
      gamma,
      pressure_bar: P,
      excessAirRatio: lambda
    }
  }

  const results = useMemo(() => calculateFlameTemperature(), [
    gasComponents,
    fuelTemperature,
    oxidizerType,
    airRatio,
    oxygenRatio,
    oxidizerTemperature,
    excessAirRatio,
    pressure
  ])

  const exportToPDF = () => {
    if (!results) return

    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Flame Temperature Calculation Report', 20, 20)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Pressure: ${results.pressure_bar} bar`, 20, 36)
    doc.text(`Excess Air Ratio: ${results.excessAirRatio.toFixed(2)}`, 120, 36)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Input Parameters:', 20, 48)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    let yPos = 56
    gasComponents.forEach(c => {
      const pct = parseFloat(c.percentage) || 0
      if (pct > 0) {
        doc.text(`${c.name} (${c.symbol}): ${pct.toFixed(2)}%`, 20, yPos)
        yPos += 6
      }
    })
    
    yPos += 4
    doc.text(`Fuel Temperature: ${fuelTemperature} °C`, 20, yPos)
    yPos += 6
    doc.text(`Oxidizer Type: ${oxidizerType === 'air' ? 'Air' : oxidizerType === 'oxygen' ? 'Pure Oxygen' : 'Mixed'}`, 20, yPos)
    yPos += 6
    doc.text(`Oxidizer Temperature: ${oxidizerTemperature} °C`, 20, yPos)
    yPos += 6
    doc.text(`Excess Air Ratio: ${excessAirRatio}`, 20, yPos)
    
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Calculation Results:', 120, 48)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Frozen Flame Temperature: ${results.T_frozen_C.toFixed(0)} °C (${results.T_frozen_K.toFixed(1)} K)`, 120, 56)
    doc.text(`Equilibrium Flame Temperature: ${results.T_equilibrium_C.toFixed(0)} °C (${results.T_equilibrium_K.toFixed(1)} K)`, 120, 62)
    doc.text(`Stoichiometric O₂: ${results.stoichO2.toFixed(4)} mol/mol`, 120, 68)
    doc.text(`Total Moles: ${results.totalMoles.toFixed(3)} mol`, 120, 74)
    
    yPos = 78
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Combustion Products (mole %):', 20, yPos)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    for (const [sp, pct] of Object.entries(results.products_mole_pct)) {
      if (pct > 0.01) {
        yPos += 6
        doc.text(`${sp}: ${pct.toFixed(4)}%`, 20, yPos)
      }
    }
    
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Thermodynamic Properties:', 20, yPos)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`ΔG (Gibbs Free Energy): ${results.deltaG.toFixed(2)} kJ`, 20, yPos + 8)
    doc.text(`Cp (Mixture): ${results.cpMix.toFixed(4)} kJ/mol/K`, 20, yPos + 14)
    doc.text(`γ (Isentropic Index): ${results.gamma.toFixed(4)}`, 20, yPos + 20)
    
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Note: Results are for reference only. Consult qualified combustion engineers.', 20, 280)
    
    doc.save('flame-temperature-report.pdf')
  }

  const sortedSpecies = Object.entries(results?.products_mole_pct || {})
    .sort((a, b) => b[1] - a[1])

  return (
    <ProFeaturePreview
      title="Flame Temperature Calculator"
      description="Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations."
      icon={<Thermometer size={40} />}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 text-center pt-20 sm:pt-24">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-semibold mb-3 sm:mb-4 leading-tight">
              Flame Temperature Calculator
            </h1>
            <p className="text-sm sm:text-lg text-[#bdc3c7] max-w-2xl mx-auto">
              Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations with chemical equilibrium.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 dark:bg-gray-800 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Professional Engineering Judgment Required</p>
              <p className="text-yellow-700 dark:text-gray-300 mt-1">
                Results are for reference only. Actual flame temperatures depend on many factors including 
                burner design, heat transfer, and combustion efficiency. Consult qualified combustion engineers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GasComposition
              components={gasComponents}
              setComponents={setGasComponents}
              presets={gasPresets}
              selectedPreset={selectedPreset}
              setSelectedPreset={setSelectedPreset}
              title="Fuel Gas Composition"
              presetLabel="Gas type"
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden">
              <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] dark:text-white mb-4 sm:mb-6 flex items-center">
                <span className="w-7 h-7 sm:w-8 sm:h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-2 sm:mr-3 flex-shrink-0">2</span>
                Operating Conditions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Fuel Temperature</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fuelTemperature}
                      onChange={(e) => setFuelTemperature(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <span className="text-sm text-[#7f8c8d] dark:text-gray-400">°C</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Pressure</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pressure}
                      onChange={(e) => setPressure(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                      placeholder="1"
                    />
                    <span className="text-sm text-[#7f8c8d] dark:text-gray-400">bar</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Oxidizer Type</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setOxidizerType('air')}
                    className={`flex-1 py-2 px-3 rounded font-semibold transition-colors text-sm ${
                      oxidizerType === 'air'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Air
                  </button>
                  <button
                    onClick={() => setOxidizerType('oxygen')}
                    className={`flex-1 py-2 px-3 rounded font-semibold transition-colors text-sm ${
                      oxidizerType === 'oxygen'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Pure O₂
                  </button>
                  <button
                    onClick={() => setOxidizerType('mixed')}
                    className={`flex-1 py-2 px-3 rounded font-semibold transition-colors text-sm ${
                      oxidizerType === 'mixed'
                        ? 'bg-[#f39c12] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Mixed
                  </button>
                </div>

                {oxidizerType === 'mixed' && (
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="text-sm text-[#555] dark:text-gray-300 font-medium">Oxygen-Enriched Air Mixture</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#555] dark:text-gray-400 mb-1">Air %</label>
                        <input
                          type="text"
                          value={airRatio}
                          onChange={(e) => {
                            const airVal = e.target.value
                            setAirRatio(airVal)
                            if (airVal !== '') {
                              const num = parseFloat(airVal) || 0
                              setOxygenRatio((100 - num).toString())
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 rounded text-center dark:text-white text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#555] dark:text-gray-400 mb-1">Pure O₂ %</label>
                        <input
                          type="text"
                          value={oxygenRatio}
                          onChange={(e) => {
                            const oxyVal = e.target.value
                            setOxygenRatio(oxyVal)
                            if (oxyVal !== '') {
                              const num = parseFloat(oxyVal) || 0
                              setAirRatio((100 - num).toString())
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 rounded text-center dark:text-white text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[#7f8c8d] dark:text-gray-400">
                      Total: {((parseFloat(airRatio) || 0) + (parseFloat(oxygenRatio) || 0)).toFixed(0)}% {Math.abs(((parseFloat(airRatio) || 0) + (parseFloat(oxygenRatio) || 0)) - 100) < 0.01 ? '✓' : '(must equal 100%)'}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Oxidizer Temperature</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={oxidizerTemperature}
                      onChange={(e) => setOxidizerTemperature(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <span className="text-sm text-[#7f8c8d] dark:text-gray-400">°C</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2 whitespace-pre-wrap">
                    {oxidizerType === 'air' ? 'Excess Air Ratio (λ)' : oxidizerType === 'oxygen' ? 'Excess Oxygen Ratio (λ)' : 'Excess Oxidizer Ratio (λ)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={excessAirRatio}
                      onChange={(e) => setExcessAirRatio(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                      placeholder="1.0"
                    />
                    <span className="text-sm text-[#7f8c8d] dark:text-gray-400">λ</span>
                  </div>
                </div>
              </div>

              {showResults && results ? (
                <div className="mb-4 space-y-4">
                  <div className="p-4 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
                      <h3 className="text-base font-bold text-white">Flame Temperature Results</h3>
                      <span className="text-xs text-[#bdc3c7]">{results.pressure_bar.toFixed(1)} bar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Flame size={12} /> Frozen
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-[#f39c12]">{results.T_frozen_C.toFixed(0)}°C</div>
                        <div className="text-[10px] text-[#7f8c8d] mt-1">{results.T_frozen_K.toFixed(1)} K</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Zap size={12} /> Equilibrium
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-[#f39c12]">{results.T_equilibrium_C.toFixed(0)}°C</div>
                        <div className="text-[10px] text-[#7f8c8d] mt-1">{results.T_equilibrium_K.toFixed(1)} K</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-bold text-[#2c3e50] dark:text-white mb-2">Combustion Products (mole %)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                      {sortedSpecies.map(([sp, pct]) => (
                        <div key={sp} className="flex justify-between">
                          <span className="text-[#555] dark:text-gray-300">{sp}:</span>
                          <span className="text-[#2c3e50] dark:text-white font-medium">{pct.toFixed(3)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-bold text-[#2c3e50] dark:text-white mb-2">Thermodynamic Properties</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#555] dark:text-gray-300">Total Moles:</span>
                        <span className="text-[#2c3e50] dark:text-white font-medium">{results.totalMoles.toFixed(3)} mol</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#555] dark:text-gray-300">ΔG (kJ):</span>
                        <span className="text-[#2c3e50] dark:text-white font-medium">{results.deltaG.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#555] dark:text-gray-300">Cp (kJ/mol/K):</span>
                        <span className="text-[#2c3e50] dark:text-white font-medium">{results.cpMix.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#555] dark:text-gray-300">γ (Isentropic):</span>
                        <span className="text-[#2c3e50] dark:text-white font-medium">{results.gamma.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => handleProAction(() => setShowResults(!showResults))}
                className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white py-2.5 rounded font-semibold transition-colors text-sm"
              >
                {showResults ? 'Hide Results' : 'Calculate Flame Temperature'}
              </button>

              {showResults && results && (
                <div className="mt-3">
                  <button
                    onClick={exportToPDF}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={18} />
                    Export PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="bg-[#2c3e50] dark:bg-gray-900 text-[#bdc3c7] text-center py-12 px-6 mt-20">
          <div className="flex justify-center gap-8 mb-5 flex-wrap">
            <a href="/#features" className="text-sm hover:text-white transition-colors">Features</a>
            <a href="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-sm hover:text-white transition-colors">About</a>
            <a href="#privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-sm hover:text-white transition-colors">Terms of Service</a>
            <a href="#contact" className="text-sm hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-[#7f8c8d] dark:text-gray-500">© 2026 Burner-Design-Pro. Professional tools for burner engineers.</p>
        </footer>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Thermometer className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isLoggedIn ? 'Pro Feature Required' : 'Login Required'}
              </h2>
              <p className="text-gray-600">
                {isLoggedIn
                  ? 'Upgrade to Pro to use this calculator and unlock all premium features.'
                  : 'Please log in to use the flame temperature calculator and access all features.'}
              </p>
            </div>

            {!isLoggedIn && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Free account benefits:</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Full access to basic calculators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Calculation history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Free forever - no credit card needed
                  </li>
                </ul>
              </div>
            )}

            {isLoggedIn && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Pro Features:</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Flame Temperature Calculator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    All Pro calculators
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    PDF report export
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Priority support
                  </li>
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isLoggedIn ? handleUpgradeClick : handleLoginClick}
                className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                {isLoggedIn ? 'Upgrade Now' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProFeaturePreview>
  )
}