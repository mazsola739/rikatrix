export const rand = (min: number, max: number) => min + Math.random() * (max - min)

export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Weighted random index: with [3, 1], index 0 comes up three times as often. */
export function pickWeightedIndex(weights: readonly number[]): number {
  let total = 0
  for (const w of weights) total += w
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}
