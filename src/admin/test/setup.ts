import { beforeEach, vi } from 'vitest'

const makeStorage = () => {
  const store = new Map<string, string>()
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    get length() {
      return store.size
    },
  }
}

const localStorageMock = makeStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent: vi.fn(),
  },
  configurable: true,
})

Object.defineProperty(globalThis, 'atob', {
  value: (value: string) => Buffer.from(value, 'base64').toString('binary'),
  configurable: true,
})

beforeEach(() => {
  localStorage.clear()
})
