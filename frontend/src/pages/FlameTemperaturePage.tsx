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
  // CO₂ - 来源: gri30 (CO2)
  'CO₂': {
    Tmid: 1.00000000E+3,
    low: { a: [2.35677352E+0, 8.98459677E-3, -7.12356269E-6, 2.45919022E-9, -1.43699548E-13, -4.83719697E+4, 9.90105222E+0] },
    high: { a: [3.85746029E+0, 4.41437026E-3, -2.21481404E-6, 5.23490188E-10, -4.72084164E-14, -4.87591660E+4, 2.27163806E+0] }
  },
  // H₂O - 来源: gri30 (H2O)
  'H₂O': {
    Tmid: 1.00000000E+3,
    low: { a: [4.19864056E+0, -2.03643410E-3, 6.52040211E-6, -5.48797062E-9, 1.77197817E-12, -3.02937267E+4, -8.49032208E-1] },
    high: { a: [3.03399249E+0, 2.17691804E-3, -1.64072518E-7, -9.70419870E-11, 1.68200992E-14, -3.00042971E+4, 4.96677010E+0] }
  },
  // N₂ - 来源: gri30 (N2)
  'N₂': {
    Tmid: 1.00000000E+3,
    low: { a: [3.29867700E+0, 1.40824040E-3, -3.96322200E-6, 5.64151500E-9, -2.44485400E-12, -1.02089990E+3, 3.95037200E+0] },
    high: { a: [2.92664000E+0, 1.48797680E-3, -5.68476000E-7, 1.00970380E-10, -6.75335100E-15, -9.22797700E+2, 5.98052800E+0] }
  },
  // O₂ - 来源: gri30 (O2)
  'O₂': {
    Tmid: 1.00000000E+3,
    low: { a: [3.78245636E+0, -2.99673416E-3, 9.84730201E-6, -9.68129509E-9, 3.24372837E-12, -1.06394356E+3, 3.65767573E+0] },
    high: { a: [3.28253784E+0, 1.48308754E-3, -7.57966669E-7, 2.09470555E-10, -2.16717794E-14, -1.08845772E+3, 5.45323129E+0] }
  },
  // CO - 来源: gri30 (CO)
  'CO': {
    Tmid: 1.00000000E+3,
    low: { a: [3.57953347E+0, -6.10353680E-4, 1.01681433E-6, 9.07005884E-10, -9.04424499E-13, -1.43440860E+4, 3.50840928E+0] },
    high: { a: [2.71518561E+0, 2.06252743E-3, -9.98825771E-7, 2.30053008E-10, -2.03647716E-14, -1.41518724E+4, 7.81868772E+0] }
  },
  // H₂ - 来源: gri30 (H2)
  'H₂': {
    Tmid: 1.00000000E+3,
    low: { a: [2.34433112E+0, 7.98052075E-3, -1.94781510E-5, 2.01572094E-8, -7.37611761E-12, -9.17935173E+2, 6.83010238E-1] },
    high: { a: [3.33727920E+0, -4.94024731E-5, 4.99456778E-7, -1.79566394E-10, 2.00255376E-14, -9.50158922E+2, -3.20502331E+0] }
  },
  // OH - 来源: gri30 (OH)
  'OH': {
    Tmid: 1.00000000E+3,
    low: { a: [3.99201543E+0, -2.40131752E-3, 4.61793841E-6, -3.88113333E-9, 1.36411470E-12, 3.61508056E+3, -1.03925458E-1] },
    high: { a: [3.09288767E+0, 5.48429716E-4, 1.26505228E-7, -8.79461556E-11, 1.17412376E-14, 3.85865700E+3, 4.47669610E+0] }
  },
  // O - 来源: gri30 (O)
  'O': {
    Tmid: 1.00000000E+3,
    low: { a: [3.16826710E+0, -3.27931884E-3, 6.64306396E-6, -6.12806624E-9, 2.11265971E-12, 2.91222592E+4, 2.05193346E+0] },
    high: { a: [2.56942078E+0, -8.59741137E-5, 4.19484589E-8, -1.00177799E-11, 1.22833691E-15, 2.92175791E+4, 4.78433864E+0] }
  },
  // H - 来源: gri30 (H)
  'H': {
    Tmid: 1.00000000E+3,
    low: { a: [2.50000000E+0, 7.05332819E-13, -1.99591964E-15, 2.30081632E-18, -9.27732332E-22, 2.54736599E+4, -4.46682853E-1] },
    high: { a: [2.50000001E+0, -2.30842973E-11, 1.61561948E-14, -4.73515235E-18, 4.98197357E-22, 2.54736599E+4, -4.46682914E-1] }
  },
  // NO - 来源: gri30 (NO)
  'NO': {
    Tmid: 1.00000000E+3,
    low: { a: [4.21847630E+0, -4.63897600E-3, 1.10410220E-5, -9.33613540E-9, 2.80357700E-12, 9.84462300E+3, 2.28084640E+0] },
    high: { a: [3.26060560E+0, 1.19110430E-3, -4.29170480E-7, 6.94576690E-11, -4.03360990E-15, 9.92097460E+3, 6.36930270E+0] }
  },
  // NO₂ - 来源: gri30 (NO2)
  'NO₂': {
    Tmid: 1.00000000E+3,
    low: { a: [3.94403120E+0, -1.58542900E-3, 1.66578120E-5, -2.04754260E-8, 7.83505640E-12, 2.89661790E+3, 6.31199170E+0] },
    high: { a: [4.88475420E+0, 2.17239560E-3, -8.28069060E-7, 1.57475100E-10, -1.05108950E-14, 2.31649830E+3, -1.17416950E-1] }
  },
  // CH₄ - 来源: gri30 (CH4)
  'CH₄': {
    Tmid: 1.00000000E+3,
    low: { a: [5.14987613E+0, -1.36709788E-2, 4.91800599E-5, -4.84743026E-8, 1.66693956E-11, -1.02466476E+4, -4.64130376E+0] },
    high: { a: [7.48514950E-2, 1.33909467E-2, -5.73285809E-6, 1.22292535E-9, -1.01815230E-13, -9.46834459E+3, 1.84373180E+1] }
  },
  // C₂H₆ - 来源: gri30 (C2H6)
  'C₂H₆': {
    Tmid: 1.00000000E+3,
    low: { a: [4.29142492E+0, -5.50154270E-3, 5.99438288E-5, -7.08466285E-8, 2.68685771E-11, -1.15222055E+4, 2.66682316E+0] },
    high: { a: [1.07188150E+0, 2.16852677E-2, -1.00256067E-5, 2.21412001E-9, -1.90002890E-13, -1.14263932E+4, 1.51156107E+1] }
  },
  // C₃H₈ - 来源: gri30 (C3H8)
  'C₃H₈': {
    Tmid: 1.00000000E+3,
    low: { a: [9.33553810E-1, 2.64245790E-2, 6.10597270E-6, -2.19774990E-8, 9.51492530E-12, -1.39585200E+4, 1.92016910E+1] },
    high: { a: [7.53413680E+0, 1.88722390E-2, -6.27184910E-6, 9.14756490E-10, -4.78380690E-14, -1.64675160E+4, -1.78923490E+1] }
  },
  // C₂H₂ - 来源: gri30 (C2H2)
  'C₂H₂': {
    Tmid: 1.00000000E+3,
    low: { a: [8.08681094E-1, 2.33615629E-2, -3.55171815E-5, 2.80152437E-8, -8.50072974E-12, 2.64289807E+4, 1.39397051E+1] },
    high: { a: [4.14756964E+0, 5.96166664E-3, -2.37294852E-6, 4.67412171E-10, -3.61235213E-14, 2.59359992E+4, -1.23028121E+0] }
  },
  // C₂H₄ - 来源: gri30 (C2H4)
  'C₂H₄': {
    Tmid: 1.00000000E+3,
    low: { a: [3.95920148E+0, -7.57052247E-3, 5.70990292E-5, -6.91588753E-8, 2.69884373E-11, 5.08977593E+3, 4.09733096E+0] },
    high: { a: [2.03611116E+0, 1.46454151E-2, -6.71077915E-6, 1.47222923E-9, -1.25706061E-13, 4.93988614E+3, 1.03053693E+1] }
  },
  // NH₃ - 来源: gri30 (NH3)
  'NH₃': {
    Tmid: 1.00000000E+3,
    low: { a: [4.28602740E+0, -4.66052300E-3, 2.17185130E-5, -2.28088870E-8, 8.26380460E-12, -6.74172850E+3, -6.25372770E-1] },
    high: { a: [2.63445210E+0, 5.66625600E-3, -1.72786760E-6, 2.38671610E-10, -1.25787860E-14, -6.54469580E+3, 6.56629280E+0] }
  },
  // Ar - 来源: nasa_gas (Ar)
  'Ar': {
    Tmid: 6.00000000E+3,
    low: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] },
    high: { a: [2.50000000E+0, 0, 0, 0, 0, -7.45375000E+2, 4.37967491E+0] }
  },
  // H₂S - 来源: nasa_gas (H2S)
  'H₂S': {
    Tmid: 1.00000000E+3,
    low: { a: [3.93234760E+0, -5.02609050E-4, 4.59284730E-6, -3.18072140E-9, 6.64975610E-13, -3.65053590E+3, 2.31579050E+0] },
    high: { a: [2.74521990E+0, 4.04346070E-3, -1.53845100E-6, 2.75202490E-10, -1.85920950E-14, -3.41994440E+3, 8.05467450E+0] }
  },
  // C₆H₆ - 来源: nasa_gas (C6H6)
  'C₆H₆': {
    Tmid: 1.00000000E+3,
    low: { a: [5.03469664E-1, 1.85142363E-2, 7.37864409E-5, -1.18106127E-7, 5.07182527E-11, 8.55266293E+3, 2.16481796E+1] },
    high: { a: [1.10771708E+1, 2.07067895E-2, -7.51625100E-6, 1.22209416E-9, -7.35312513E-14, 4.30988395E+3, -4.00116950E+1] }
  },
  // C₃H₆ - 来源: nasa_gas (C3H6,propylene)
  'C₃H₆': {
    Tmid: 1.00000000E+3,
    low: { a: [3.83464524E+0, 3.29078405E-3, 5.05228184E-5, -6.66251418E-8, 2.63707585E-11, 7.53838295E+2, 7.53410995E+0] },
    high: { a: [6.03870499E+0, 1.62963895E-2, -5.82130624E-6, 9.35936483E-10, -5.58602903E-14, -7.76595092E+2, -8.43824322E+0] }
  },
  // C₄H₈ - 来源: nasa_gas (C4H8,1-butene)
  'C₄H₈': {
    Tmid: 1.00000000E+3,
    low: { a: [4.42674073E+0, 6.63946249E-3, 6.80652815E-5, -9.28753562E-8, 3.73473949E-11, -2.11532796E+3, 7.54694860E+0] },
    high: { a: [8.02147991E+0, 2.26010707E-2, -8.31284033E-6, 1.37803072E-9, -8.42175459E-14, -4.30852153E+3, -1.71170697E+1] }
  },
  // C₄H₁₀ - 来源: nasa_gas (C4H10,n-butane)
  'C₄H₁₀': {
    Tmid: 1.00000000E+3,
    low: { a: [6.14746806E+0, 1.55947389E-4, 9.67913517E-5, -1.25483910E-7, 4.97816555E-11, -1.75994402E+4, -1.09409879E+0] },
    high: { a: [9.44535834E+0, 2.57858073E-2, -9.23619122E-6, 1.48632755E-9, -8.87897158E-14, -2.01382165E+4, -2.63470076E+1] }
  },
  // C₅H₁₂ - 来源: nasa_gas (C5H12,n-pentane)
  'C₅H₁₂': {
    Tmid: 1.00000000E+3,
    low: { a: [1.89836790E+0, 4.12030370E-2, 1.23121750E-5, -3.65895010E-8, 1.50425090E-11, -2.00915000E+4, 1.86790820E+1] },
    high: { a: [1.35469980E+1, 2.84217860E-2, -9.41746480E-6, 1.38935890E-9, -7.42126090E-14, -2.45776800E+4, -4.70211750E+1] }
  },
  // C₇H₁₆ - 来源: nasa_gas (C7H16,n-heptane)
  'C₇H₁₆': {
    Tmid: 1.00000000E+3,
    low: { a: [1.11532484E+1, -9.49415433E-3, 1.95571181E-4, -2.49752520E-7, 9.84873213E-11, -2.67711735E+4, -1.59096110E+1] },
    high: { a: [1.85354704E+1, 3.91420468E-2, -1.38030268E-5, 2.22403874E-9, -1.33452580E-13, -3.19500783E+4, -7.01902840E+1] }
  },
  // C₆H₁₄ (正己烷) - 来源: NIST Chemistry WebBook 离散数据拟合 (Cp误差<1.5%)
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

        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 pt-[100px]">
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-white">Flame Temperature Results</h3>
                      <span className="text-xs text-[#bdc3c7]">{results.pressure_bar.toFixed(1)} bar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Flame size={12} /> Frozen
                        </div>
                        <div className="text-xl font-bold text-[#f39c12]">{results.T_frozen_C.toFixed(0)}°C</div>
                        <div className="text-[10px] text-[#7f8c8d] mt-1">{results.T_frozen_K.toFixed(1)} K</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded">
                        <div className="flex items-center gap-1 text-xs text-[#bdc3c7] mb-1">
                          <Zap size={12} /> Equilibrium
                        </div>
                        <div className="text-xl font-bold text-[#f39c12]">{results.T_equilibrium_C.toFixed(0)}°C</div>
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