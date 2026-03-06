import oxlint from 'eslint-plugin-oxlint'
import eslintPluginVue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'

export default ts.config(
  ...ts.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  ...oxlint.buildFromOxlintConfigFile('./oxlint.config.ts'),
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
)
