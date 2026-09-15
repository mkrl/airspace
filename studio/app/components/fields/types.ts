import type { StudioField } from '#shared/studio'

export interface StudioFieldProps {
  name: string
  inputName: string
  schema: StudioField
  modelValue: unknown
  required?: boolean
  issue?: string
}
