import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.wrangler/**',
      '**/dist/**',
      '**/.open-next/**',
      '**/next-env.d.ts',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='get'] > TemplateLiteral",
          message:
            'String-interpolated SQL is banned outside packages/db. Use parameterized Drizzle queries.',
        },
      ],
    },
  },
  {
    files: ['apps/web/components/**/*.{ts,tsx}', 'apps/web/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mma/db',
              message:
                'The D1 binding must never reach the browser bundle. Fetch through lib/api.ts instead.',
            },
          ],
          patterns: ['@mma/db/*', '@mma/db/repositories*'],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
)
