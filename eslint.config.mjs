import { defineConfig } from "eslint/config";
import jest from "eslint-plugin-jest";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("eslint:recommended", "plugin:jest/recommended"),

    plugins: {
        jest,
    },

    languageOptions: {
        globals: {
            ...globals.node,
            ...jest.environments.globals.globals,
        },

        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "jest/no-disabled-tests": "warn",
        "jest/no-conditional-expect": "error",
        "jest/no-identical-title": "error",
    },
}]);