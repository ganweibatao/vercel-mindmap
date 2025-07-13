import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 允许使用 any 类型，但建议避免
      "@typescript-eslint/no-explicit-any": "warn",
      // 允许未使用的变量，但建议清理
      "@typescript-eslint/no-unused-vars": "warn",
      // React Hook 依赖项警告
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
