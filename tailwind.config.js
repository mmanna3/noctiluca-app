/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			// Toda la escala movida +2px respecto de los valores por default de Tailwind
			// (la tipografía de la app era muy chica). Mantiene las proporciones entre pasos.
			fontSize: {
				xs: ["0.875rem", { lineHeight: "1.125rem" }],
				sm: ["1rem", { lineHeight: "1.375rem" }],
				base: ["1.125rem", { lineHeight: "1.625rem" }],
				lg: ["1.25rem", { lineHeight: "1.875rem" }],
				xl: ["1.375rem", { lineHeight: "1.875rem" }],
				"2xl": ["1.625rem", { lineHeight: "2.125rem" }],
				"3xl": ["2rem", { lineHeight: "2.375rem" }],
			},
		},
	},
	plugins: [],
};
