import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			globals: {
				process: "readonly",
				console: "readonly",
				fetch: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				Response: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{ prefer: "type-imports" },
			],
			"@typescript-eslint/no-namespace": "off",
		},
	},
	{
		ignores: ["dist/**", "node_modules/**"],
	}
);


