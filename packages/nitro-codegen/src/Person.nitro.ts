import type { HybridObject } from 'react-native-nitro-modules';

export interface Person
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly name: string;
  readonly age: number;
  sayHi(name: string): void;
}
