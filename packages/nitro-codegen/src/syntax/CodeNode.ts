import type { Language } from '../getPlatformSpecs.js'
import type { SourceFile } from './SourceFile.js'

export interface CodeNode {
  /**
   * Get the code of this code node (e.g. property, method) in the given language.
   */
  getCode(language: Language): string
  /**
   * Get all extra definition files this code node needs (e.g. extra type/struct declarations
   * for complex types), or `[]` if none are required (e.g. if this uses primitive types only)
   */
  getDefinitionFiles(language: Language): SourceFile[]
}