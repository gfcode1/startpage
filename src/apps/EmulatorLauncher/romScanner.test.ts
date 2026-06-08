import { describe, it, expect, vi } from 'vitest'
import { scanBundledRoms } from './romScanner'

describe('scanBundledRoms', () => {
  it('returns empty array when manifest fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const result = await scanBundledRoms()
    expect(result).toEqual([])
  })

  it('returns empty array when manifest response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false } as Response)
    const result = await scanBundledRoms()
    expect(result).toEqual([])
  })

  it('returns scanned games from valid manifest', async () => {
    const manifest = {
      roms: [
        { path: 'nes/mario.nes', title: 'Super Mario', system: 'nes', fileName: 'mario.nes' },
        { path: 'snes/zelda.sfc', title: 'Zelda', system: 'snes', fileName: 'zelda.sfc' },
      ],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(manifest),
    } as Response)

    const result = await scanBundledRoms()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'bundled:nes:mario.nes',
      title: 'Super Mario',
      system: 'nes',
      fileName: 'mario.nes',
      romUrl: '/emulator-roms/nes/mario.nes',
    })
    expect(result[1]).toEqual({
      id: 'bundled:snes:zelda.sfc',
      title: 'Zelda',
      system: 'snes',
      fileName: 'zelda.sfc',
      romUrl: '/emulator-roms/snes/zelda.sfc',
    })
  })

  it('skips entries with unknown system', async () => {
    const manifest = {
      roms: [
        { path: 'nes/mario.nes', title: 'Super Mario', system: 'nes', fileName: 'mario.nes' },
        { path: 'unknown/game.rom', title: 'Unknown', system: 'faketendo', fileName: 'game.rom' },
      ],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(manifest),
    } as Response)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await scanBundledRoms()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Super Mario')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('faketendo'),
    )
  })
})
