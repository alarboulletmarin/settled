import { createContext, use } from 'react'

/**
 * Devise courante. Alimentée par les réglages du document de données ;
 * « EUR » tant que la coquille n'a pas hydraté.
 */
export const CurrencyContext = createContext<string>('EUR')

export function useCurrency(): string {
  return use(CurrencyContext)
}
