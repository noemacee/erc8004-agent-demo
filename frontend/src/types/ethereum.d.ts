import { Eip1193Provider } from 'ethers'

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on(event: 'accountsChanged', handler: (accounts: string[]) => void): void
      on(event: 'chainChanged', handler: (chainId: string) => void): void
      removeListener(event: string, handler: (...args: unknown[]) => void): void
    }
  }
}

export {}
