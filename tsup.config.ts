import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    web: 'src/web.ts',
    native: 'src/native.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [
    'react',
    'react-native',
    '@react-native-async-storage/async-storage',
    'expo-secure-store',
    'expo-crypto',
    'react-native-get-random-values'
  ]
});