// Single shared flat config (quality spec: "Repository-wide linting and formatting").
// Pragmatic ruleset: recommended + a few high-value correctness rules. Prettier owns
// formatting — no stylistic rules here.
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/.next/",
      "**/.open-next/",
      "**/.ponder/",
      "**/.wrangler/",
      "**/generated/",
      // Generated type shims.
      "apps/indexer/ponder-env.d.ts",
      "apps/web/next-env.d.ts",
      "apps/web/cloudflare-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // High-value additions over recommended.
      eqeqeq: ["error", "smart"],
      "no-else-return": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // Chain data code passes viem branded types around; explicit any stays an
      // error (from recommended), but we allow `!` where config values are asserted.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    // Config/JS files: outside the packages' tsconfigs — lint without type info.
    files: ["**/*.{js,mjs,cjs}", "**/vitest.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
