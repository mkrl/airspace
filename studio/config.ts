import type { AnyCollection, Plugin } from 'airspace'

export interface StudioConfig<
  C extends Record<string, AnyCollection> = Record<string, AnyCollection>,
  P extends readonly Plugin<any>[] = readonly Plugin<any>[],
> {
  lexicons: Record<string, unknown>
  collections: C
  plugins?: P
  allowPrivateNetwork?: boolean
}

export function defineStudio<
  const C extends Record<string, AnyCollection>,
  const P extends readonly Plugin<any>[] = [],
>(config: StudioConfig<C, P>): StudioConfig<C, P> {
  return config
}
