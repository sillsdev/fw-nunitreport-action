import js from "@eslint/js";
import github from "eslint-plugin-github";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/", "coverage/"]),
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      github.getFlatConfigs().recommended,
      // typescript-eslint must follow github so its eslint-recommended overrides win.
      ...tseslint.configs.recommended,
      vitest.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      parserOptions: {
        project: ["./.github/linters/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      camelcase: "off",
      "eslint-comments/no-use": "off",
      "i18n-text/no-en": "off",
      "import/no-namespace": "off",
      // The node resolver cannot map NodeNext ".js" specifiers to ".ts" sources
      // or read exports maps; tsc (npm run typecheck) checks resolution instead.
      "import/no-unresolved": "off",
      "no-console": "off",
      "no-restricted-globals": [
        "error",
        ...["__dirname", "__filename", "require", "module", "exports"].map(
          (name) => ({
            name,
            message: "Not defined in an ES module; use import.meta instead.",
          }),
        ),
      ],
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        { accessibility: "no-public" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "@typescript-eslint/no-extraneous-class": "error",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/prefer-function-type": "warn",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/unbound-method": "error",
    },
  },
  {
    files: ["eslint.config.mjs", "vitest.config.mjs"],
    extends: [js.configs.recommended],
  },
]);
