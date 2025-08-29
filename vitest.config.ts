import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test file patterns - matches existing structure
    include: [
      'src/**/__tests__/*.test.ts',
      'src/__tests__/*.test.ts'
    ],
    
    // Environment configuration
    environment: 'node',
    
    // Test timeout (matches current 10s timeout)
    testTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types.ts' // Type definitions don't need coverage
      ],
      // V8 3.2.4: ignoreEmptyLines now defaults to true for cleaner reports
      ignoreEmptyLines: true,
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 70,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Watch mode configuration
    watch: false,
    
    // TypeScript configuration
    typecheck: {
      enabled: false // Use separate tsc command for type checking
    },
    
    // Setup files (if needed in the future)
    // setupFiles: ['./test-setup.ts'],
    
    // Global test settings
    globals: false, // Keep explicit imports for better tree shaking
    
    // Pool and concurrency
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },
  
  // Resolve configuration for TypeScript
  resolve: {
    alias: {
      // Can add path aliases here if needed
    }
  },
  
  // Define configuration (no Vite plugins needed for pure Node.js testing)
  plugins: []
})