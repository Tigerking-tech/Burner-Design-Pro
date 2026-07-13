import { useState } from 'react'
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
  low: { a: number[] }
  high: { a: number[] }
}

const nasaCoeffs: Record<string, NasaCoeffs> = {
  'CO₂': {
    low: { a: [2.35677352E+00, 8.98459677E-03, -7.12356269E-06, 2.45919022E-09, -1.43699548E-13, -4.83719697E+04, 9.90105222E+00] },
    high: { a: [3.85746029E+00, 4.41437026E-03, -2.21481404E-06, 5.23490188E-10, -4.72084164E-14, -4.87591660E+04, 2.27168103E+00] }
  },
  'H₂O': {
    low: { a: [4.19864056E+00, -2.03643410E-03, 6.52040211E-06, -5.48797062E-09, 1.77197817E-12, -3.02937267E+04, -8.49032208E-01] },
    high: { a: [3.03399249E+00, 2.17691804E-03, -1.64072518E-07, -9.70419870E-12, 1.68200992E-15, -3.00084271E+04, 4.96677010E+00] }
  },
  'N₂': {
    low: { a: [3.29867700E+00, 1.40824040E-03, -3.96322200E-06, 5.64151500E-09, -2.44485400E-12, -1.02089990E+03, 3.95037200E+00] },
    high: { a: [2.92664000E+00, 1.48797680E-03, -5.68476000E-07, 1.00970300E-10, -6.75335100E-15, -9.22797700E+02, 5.98052800E+00] }
  },
  'O₂': {
    low: { a: [3.78245636E+00, -2.99673416E-03, 9.84730201E-06, -9.68129509E-09, 3.24372837E-12, -1.06394356E+03, 3.65767573E+00] },
    high: { a: [3.28253784E+00, 1.48308754E-03, -7.57966669E-07, 2.09470555E-10, -2.16717794E-14, -1.08845772E+03, 5.45323129E+00] }
  },
  'CO': {
    low: { a: [3.57953347E+00, -6.10353680E-04, 1.01681433E-06, 9.07005884E-10, -9.04424499E-13, -1.43440860E+04, 3.50840928E+00] },
    high: { a: [2.71518561E+00, 2.06252743E-03, -9.98825771E-07, 2.30053008E-10, -2.03647716E-14, -1.41518724E+04, 7.81868772E+00] }
  },
  'H₂': {
    low: { a: [2.34433112E+00, 7.98052075E-03, -1.94781510E-05, 2.01572094E-08, -7.37611761E-12, -9.17935173E+02, 6.83010238E-01] },
    high: { a: [3.33727920E+00, -4.94024731E-05, 4.99456778E-07, -1.79566394E-10, 2.00255376E-14, -9.50158922E+02, -3.20502331E+00] }
  },
  'OH': {
    low: { a: [3.99201543E+00, -2.40131752E-03, 4.61793841E-06, -3.88113333E-09, 1.36411470E-12, 3.61508056E+03, -1.03925458E-01] },
    high: { a: [3.09288767E+00, 5.48429716E-04, 1.26505228E-07, -8.79461556E-11, 1.17481976E-14, 3.85865704E+03, 4.47669610E+00] }
  },
  'O': {
    low: { a: [3.16826710E+00, -3.27931884E-03, 6.64306396E-06, -6.12806624E-09, 2.11265971E-12, 2.91222592E+04, 2.05193346E+00] },
    high: { a: [2.56942078E+00, -8.59741137E-05, 4.19484586E-08, -1.00177799E-11, 1.22833691E-15, 2.92175791E+04, 4.78433864E+00] }
  },
  'H': {
    low: { a: [2.50000000E+00, 7.05332819E-13, -1.99592064E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+04, -4.46682914E-01] },
    high: { a: [2.50000000E+00, 7.05332819E-13, -1.99592064E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+04, -4.46682914E-01] }
  },
  'NO': {
    low: { a: [4.21859896E+00, -4.63988124E-03, 1.10443049E-05, -9.34055507E-09, 2.77256731E-12, 9.83572000E+03, 2.28061000E+00] },
    high: { a: [3.26060534E+00, 1.19110431E-03, -4.29170487E-07, 6.94588191E-11, -3.89803100E-15, 9.92143120E+03, 6.57240900E+00] }
  },
  'NO₂': {
    low: { a: [4.30252312E+00, -2.04403820E-03, 7.32207260E-06, -7.55600410E-09, 2.61114820E-12, -1.39808000E+03, 4.87864000E+00] },
    high: { a: [2.97296528E+00, 2.94267370E-03, -1.15680611E-06, 2.13218434E-10, -1.45451497E-14, -1.39808000E+03, 1.11188160E+01] }
  },
  'Ar': {
    low: { a: [2.50000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, -7.45375000E+02, 4.36600000E+00] },
    high: { a: [2.50000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, 0.00000000E+00, -7.45375000E+02, 4.36600000E+00] }
  },
  'CH₄': {
    low: { a: [5.14987613E+00, -1.36709788E-02, 4.91800599E-05, -4.84743026E-08, 1.66693956E-11, -1.02466476E+04, -4.64130376E+00] },
    high: { a: [7.48514950E-02, 1.33909467E-02, -5.73285809E-06, 1.22292535E-09, -1.01815230E-13, -9.46834459E+03, 1.84373180E+01] }
  },
  'C₂H₆': {
    low: { a: [4.29142587E+00, -5.50154980E-03, 5.99438459E-05, -7.08466469E-08, 2.68685836E-11, -1.15222056E+04, 2.66678944E+00] },
    high: { a: [1.07188000E+00, 2.16852650E-02, -8.03970800E-06, 1.30768590E-09, -7.91968000E-14, -1.27337200E+04, 1.85E+01] }
  },
  'C₃H₈': {
    low: { a: [-6.69578170E-01, 6.66199664E-02, -3.44182634E-05, 8.87844759E-09, -8.86961885E-13, -1.39958323E+04, 2.96809492E+01] },
    high: { a: [1.24658720E+01, 1.76798584E-02, -5.32752862E-06, 7.97787789E-10, -4.48860300E-14, -1.83658740E+04, -3.43183150E+01] }
  },
  'C₄H₁₀': {
    low: { a: [1.33955402E-01, 8.39408501E-02, -4.51009455E-05, 1.18846864E-08, -1.20565410E-12, -1.65443107E+04, 2.50664018E+01] },
    high: { a: [1.61309592E+01, 2.30272879E-02, -7.58774190E-06, 1.18186093E-09, -6.94827490E-14, -2.04427373E+04, -5.36822040E+01] }
  }
}

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
  return T < 1000 ? data.low.a : data.high.a
}

function enthalpy(species: string, T: number): number {
  const a = getCoeffs(species, T)
  if (!a) {
    const cpMap: Record<string, number> = {
      'C₂H₆': 0.053, 'C₅H₁₂': 0.12, 'C₆H₁₄': 0.14, 'C₇H₁₆': 0.16,
      'C₆H₆': 0.082, 'C₂H₄': 0.043, 'C₃H₆': 0.059, 'C₄H₈': 0.072,
      'C₂H₂': 0.044, 'NH₃': 0.036, 'H₂S': 0.034
    }
    return (enthalpyOfFormation[species] || 0) + (cpMap[species] || 0.05) * (T - 298.15)
  }
  const H_RT = a[0] + a[1] * T / 2 + a[2] * T * T / 3 + a[3] * T * T * T / 4 + a[4] * T * T * T * T / 5 + a[5] / T
  return R * T * H_RT
}

function entropy(species: string, T: number): number {
  const a = getCoeffs(species, T)
  if (!a) return 0.2
  const S_R = a[0] * Math.log(T) + a[1] * T + a[2] * T * T / 2 + a[3] * T * T * T / 3 + a[4] * T * T * T * T / 4 + a[6]
  return R * S_R
}

function chemPotential(species: string, T: number): number {
  return enthalpy(species, T) - T * entropy(species, T)
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

function equilibriumComposition(b: ElementVector, T: number): Record<string, number> {
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
      const mu = chemPotential(sp, T)
      let arg = -mu / RT
      for (const el of activeElements) arg += comp[el] * lambda[elementIndex[el]!] / RT
      return Math.exp(Math.max(-700, Math.min(700, arg)))
    })
  }

  let lambda = new Array(ne).fill(0)
  if (elementIndex['o'] !== undefined) lambda[elementIndex['o']] = chemPotential('O₂', T) / 2
  if (elementIndex['n'] !== undefined) lambda[elementIndex['n']] = chemPotential('N₂', T) / 2
  if (elementIndex['c'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['c']] = chemPotential('CO₂', T) - 2 * lambda[elementIndex['o']]
  }
  if (elementIndex['h'] !== undefined && elementIndex['o'] !== undefined) {
    lambda[elementIndex['h']] = (chemPotential('H₂O', T) - lambda[elementIndex['o']]) / 2
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

function productEnthalpy(b: ElementVector, T: number, arMoles: number = 0): number {
  const eq = equilibriumComposition(b, T)
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
  const [excessOxygen, setExcessOxygen] = usePersistentState('flametemp_excessOxygen', '10')
  const [pressure, setPressure] = usePersistentState('flametemp_pressure', '1')
  const [heatLoss, setHeatLoss] = usePersistentState('flametemp_heatLoss', '0')

  const [showResults, setShowResults] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  
  const isLoggedIn = authAPI.isAuthenticated()
  const isProUser = isLoggedIn && authAPI.getSubscriptionTier() !== 'free'

  const handleProAction = (action: () => void) => {
    if (!isProUser) {
      setShowSubscriptionModal(true)
    } else {
      action()
    }
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

    const excessAirRatio = 1 + parseFloat(excessOxygen) / 100
    const actualO2 = stoichO2 * excessAirRatio

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

    const heatLossFraction = parseFloat(heatLoss) / 100
    Hreact *= (1 - heatLossFraction)

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
      const Hmid = productEnthalpy(b, Tmid, arMoles)
      if (Hmid > Hreact) Thigh = Tmid
      else Tlow = Tmid
      if (Thigh - Tlow < 0.1) break
    }
    const TeqK = (Tlow + Thigh) / 2

    Tlow = 300; Thigh = Tmax
    for (let i = 0; i < 200; i++) {
      const Tmid = (Tlow + Thigh) / 2
      const Hmid = frozenEnthalpy(Tmid)
      if (Hmid > Hreact) Thigh = Tmid
      else Tlow = Tmid
      if (Thigh - Tlow < 0.1) break
    }
    const TfrozenK = (Tlow + Thigh) / 2

    const composition = equilibriumComposition(b, TeqK)
    const totalMoles = Object.values(composition).reduce((s, v) => s + v, 0) + arMoles
    
    const compositionPercent: Record<string, number> = {}
    for (const [sp, moles] of Object.entries(composition)) {
      compositionPercent[sp] = (moles / totalMoles) * 100
    }
    if (arMoles > 0) {
      compositionPercent['Ar'] = (arMoles / totalMoles) * 100
    }

    const deltaG = (T: number) => {
      let sum = 0
      for (const sp of equilibriumSpecies) {
        const n = composition[sp] || 0
        if (n > 0) sum += n * chemPotential(sp, T)
      }
      return sum
    }

    const cpMix = () => {
      let sum = 0
      for (const sp of equilibriumSpecies) {
        const n = composition[sp] || 0
        if (n > 0) {
          const a = getCoeffs(sp, TeqK)
          if (a) sum += n * R * (a[0] + a[1] * TeqK + a[2] * TeqK * TeqK + a[3] * TeqK * TeqK * TeqK + a[4] * TeqK * TeqK * TeqK * TeqK)
        }
      }
      return sum / totalMoles
    }

    const gamma = cpMix() / (cpMix() - R)

    return {
      theoretical: Math.max(0, TfrozenK - 273.15),
      actual: Math.max(0, TeqK - 273.15),
      stoichO2,
      composition: compositionPercent,
      totalMoles,
      deltaG: deltaG(TeqK),
      cpMix: cpMix(),
      gamma,
      pressure: parseFloat(pressure) || 1
    }
  }

  const results = calculateFlameTemperature()

  const exportToPDF = () => {
    if (!results) return

    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Flame Temperature Calculation Report', 20, 20)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Pressure: ${results.pressure} bar`, 20, 36)
    doc.text(`Heat Loss: ${heatLoss}%`, 120, 36)
    
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
    doc.text(`Excess Oxygen: ${excessOxygen}%`, 20, yPos)
    
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Calculation Results:', 120, 48)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Theoretical Flame Temperature: ${results.theoretical.toFixed(0)} °C`, 120, 56)
    doc.text(`Actual Flame Temperature: ${results.actual.toFixed(0)} °C`, 120, 62)
    doc.text(`Stoichiometric O₂: ${results.stoichO2.toFixed(4)} mol/mol`, 120, 68)
    doc.text(`Total Moles: ${results.totalMoles.toFixed(3)} mol`, 120, 74)
    
    yPos = 78
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('Combustion Products (mole %):', 20, yPos)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    for (const [sp, pct] of Object.entries(results.composition)) {
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

  const sortedSpecies = Object.entries(results?.composition || {})
    .sort((a, b) => b[1] - a[1])

  return (
    <ProFeaturePreview
      title="Flame Temperature Calculator"
      description="Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations."
      icon={<Thermometer size={40} />}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />

        <section className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] dark:from-gray-800 dark:to-gray-900 text-white py-16 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4 leading-tight">
              Flame Temperature Calculator
            </h1>
            <p className="text-lg text-[#bdc3c7] max-w-2xl mx-auto">
              Calculate theoretical and actual flame temperatures for various fuel-oxidizer combinations with chemical equilibrium.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
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

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden">
              <h2 className="text-2xl font-bold text-[#2c3e50] dark:text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-[#f39c12] rounded-full flex items-center justify-center text-white text-sm mr-3">2</span>
                Operating Conditions
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Heat Loss</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={heatLoss}
                      onChange={(e) => setHeatLoss(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <span className="text-sm text-[#7f8c8d] dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#555] dark:text-gray-300 mb-2">Excess Oxygen</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={excessOxygen}
                    onChange={(e) => setExcessOxygen(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f39c12]/20 focus:border-[#f39c12] text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                  <span className="text-sm text-[#7f8c8d] dark:text-gray-400">%</span>
                </div>
              </div>

              {showResults && results ? (
                <div className="mb-4 space-y-4">
                  <div className="p-4 bg-gradient-to-br from-[#2c3e50] to-[#34495e] rounded-lg">
                    <h3 className="text-base font-bold text-white mb-3">Flame Temperature Results</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Flame size={12} /> Theoretical
                        </div>
                        <div className="text-xl font-bold text-[#f39c12]">{results.theoretical.toFixed(0)}°C</div>
                        <div className="text-[10px] text-[#7f8c8d] mt-1">Adiabatic</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Zap size={12} /> Actual
                        </div>
                        <div className="text-xl font-bold text-[#f39c12]">{results.actual.toFixed(0)}°C</div>
                        <div className="text-[10px] text-[#7f8c8d] mt-1">With dissociation</div>
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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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