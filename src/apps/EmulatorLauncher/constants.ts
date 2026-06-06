export type SystemId =
  | 'nes' | 'snes' | 'gb' | 'gba' | 'n64'
  | 'vb' | 'segaMD' | 'segaMS' | 'segaGG'
  | 'atari2600' | 'atari7800' | 'lynx'
  | 'pce' | 'ngp' | 'ws'

export interface SystemMeta {
  id: SystemId
  label: string
  color: string
  gradient: string
  emulatorjsCore: string
  extensions: string[]
}

export const SYSTEM_MAP: Record<SystemId, SystemMeta> = {
  nes:        { id: 'nes',      label: 'NES',        color: '#e74c3c', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)',  emulatorjsCore: 'nes',      extensions: ['.nes'] },
  snes:       { id: 'snes',     label: 'SNES',       color: '#9b59b6', gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)',  emulatorjsCore: 'snes',     extensions: ['.sfc', '.smc'] },
  gb:         { id: 'gb',       label: 'Game Boy',   color: '#2ecc71', gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',  emulatorjsCore: 'gb',       extensions: ['.gb', '.gbc'] },
  gba:        { id: 'gba',      label: 'GBA',        color: '#3498db', gradient: 'linear-gradient(135deg, #3498db, #2980b9)',  emulatorjsCore: 'gba',      extensions: ['.gba'] },
  n64:        { id: 'n64',      label: 'N64',        color: '#f1c40f', gradient: 'linear-gradient(135deg, #f1c40f, #f39c12)',  emulatorjsCore: 'n64',      extensions: ['.n64', '.z64', '.v64'] },
  vb:         { id: 'vb',       label: 'Virtual Boy',color: '#8e44ad', gradient: 'linear-gradient(135deg, #8e44ad, #6c3483)',  emulatorjsCore: 'vb',       extensions: ['.vb'] },
  segaMD:     { id: 'segaMD',   label: 'Mega Drive', color: '#2980b9', gradient: 'linear-gradient(135deg, #2980b9, #1a5276)',  emulatorjsCore: 'segaMD',   extensions: ['.md', '.bin', '.gen'] },
  segaMS:     { id: 'segaMS',   label: 'Master Sys',color: '#1abc9c', gradient: 'linear-gradient(135deg, #1abc9c, #16a085)',  emulatorjsCore: 'segaMS',   extensions: ['.sms'] },
  segaGG:     { id: 'segaGG',   label: 'Game Gear', color: '#e84393', gradient: 'linear-gradient(135deg, #e84393, #c0398a)',  emulatorjsCore: 'segaGG',   extensions: ['.gg'] },
  atari2600:  { id: 'atari2600',label: 'Atari 2600', color: '#e67e22', gradient: 'linear-gradient(135deg, #e67e22, #d35400)',  emulatorjsCore: 'atari2600', extensions: ['.a26'] },
  atari7800:  { id: 'atari7800',label: 'Atari 7800', color: '#d35400', gradient: 'linear-gradient(135deg, #d35400, #a04000)',  emulatorjsCore: 'atari7800', extensions: ['.a78'] },
  lynx:       { id: 'lynx',     label: 'Atari Lynx', color: '#f39c12', gradient: 'linear-gradient(135deg, #f39c12, #d68910)',  emulatorjsCore: 'lynx',     extensions: ['.lnx'] },
  pce:        { id: 'pce',      label: 'PC Engine',  color: '#00bcd4', gradient: 'linear-gradient(135deg, #00bcd4, #0097a7)',  emulatorjsCore: 'pce',      extensions: ['.pce'] },
  ngp:        { id: 'ngp',      label: 'Neo Geo PK', color: '#8bc34a', gradient: 'linear-gradient(135deg, #8bc34a, #689f38)',  emulatorjsCore: 'ngp',      extensions: ['.ngp'] },
  ws:         { id: 'ws',       label: 'WonderSwan', color: '#e91e63', gradient: 'linear-gradient(135deg, #e91e63, #c2185b)',  emulatorjsCore: 'ws',       extensions: ['.ws'] },
}

export interface ScannedGame {
  id: string
  title: string
  system: SystemId
  fileName: string
  romUrl?: string
}

export const ALL_SYSTEMS: SystemId[] = Object.keys(SYSTEM_MAP) as SystemId[]

const _extMap: Record<string, SystemId> = {}
const _allExts: string[] = []
for (const [sys, meta] of Object.entries(SYSTEM_MAP)) {
  for (const ext of meta.extensions) {
    _extMap[ext] = sys as SystemId
    _allExts.push(ext)
  }
}
export const EXTENSION_TO_SYSTEM = _extMap
export const ALL_EXTENSIONS = _allExts
