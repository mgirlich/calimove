import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['eslint', 'import', 'oxc', 'promise', 'typescript', 'unicorn', 'vitest', 'vue'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
  },
  rules: {
    // oxc - nursery
    'oxc/branches-sharing-code': 'error',
    // oxc - perf
    'oxc/no-accumulating-spread': 'error',
    'oxc/no-map-spread': 'error',
    // oxc - restriction
    'oxc/bad-bitwise-operator': 'error',
    'oxc/no-barrel-file': 'error',
    'oxc/no-const-enum': 'error',
    // oxc - suspicious
    'oxc/no-this-in-exported-function': 'error',

    // import - nursery
    'import/export': 'error',
    'import/named': 'error',
    // import - restriction
    'import/no-commonjs': 'error',
    'import/no-cycle': 'error',
    'import/no-default-export': 'error',
    // import - style
    'import/consistent-type-specifier-style': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-namespace': 'error',
    // import - suspicious
    'import/no-self-import': 'error',
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],

    // vue - restriction
    'vue/no-import-compiler-macros': 'error',
    'vue/no-multiple-slot-args': 'error',
    'vue/define-emits-declaration': ['error', 'type-literal'],
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/define-props-destructuring': 'error',
    'vue/require-typed-ref': 'error',
    'vue/no-required-prop-with-default': 'error',
  },
  ignorePatterns: ['**/node_modules/**', '**/dist/**', 'database.generated.ts'],
  overrides: [
    {
      files: ['src/locales/**.ts'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      files: ['**.test.ts'],
      rules: { 'vue/require-typed-ref': 'off' },
    },
  ],
})
