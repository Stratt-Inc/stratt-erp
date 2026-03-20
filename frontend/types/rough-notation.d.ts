// Ambient module declarations for rough-notation used in the project
// We declare minimal types required by `components/ui/highlighter.tsx`.
declare module "rough-notation" {
  export type AnnotationType =
    | "highlight"
    | "underline"
    | "box"
    | "circle"
    | "strike-through"
    | "crossed-off"
    | "bracket"

  export interface AnnotationConfig {
    type?: AnnotationType
    color?: string
    strokeWidth?: number
    animationDuration?: number
    iterations?: number
    padding?: number
    multiline?: boolean
  }

  export interface RoughAnnotation {
    show(): void
    hide(): void
    remove(): void
  }

  export function annotate(
    element: Element | string,
    config?: AnnotationConfig
  ): RoughAnnotation

  export default annotate
}

declare module "rough-notation/lib/model" {
  import { RoughAnnotation } from "rough-notation"
  export type RoughAnnotationType = RoughAnnotation
}

