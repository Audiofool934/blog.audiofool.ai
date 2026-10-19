import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,md,ts}'],
	darkMode: 'class',
	// Touch taps leave :hover applied; only real pointers get hover styles.
	future: {
		hoverOnlyWhenSupported: true,
	},
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'monospace'],
			},
			borderWidth: {
				DEFAULT: '1px',
			},
			borderColor: {
				DEFAULT: '#000000',
			},
		},
	},
	plugins: [typography],
};
