import { defineConfig } from 'tsup';

export default defineConfig([
  // Main build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
    external: [
      'react', 
      'react-native', 
      'expo-secure-store', 
      'expo-local-authentication',
      'expo-modules-core',
      '@react-native-async-storage/async-storage',
    ],
    banner: {
      js: '"use client";',
    },
  },
  // Web-specific build
  {
    entry: ['src/web.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    external: ['react'],
    banner: {
      js: '"use client";',
    },
  },
  // React Native build
  {
    entry: ['src/native.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    external: [
      'react', 
      'react-native', 
      'expo-secure-store', 
      'expo-local-authentication',
      'expo-modules-core',
      '@react-native-async-storage/async-storage'
    ],
    banner: {
      js: '"use client";',
    },
  },
]);