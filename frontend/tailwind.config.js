/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
              "surface-container": "#eaeff1",
              "surface-container-high": "#e3e9ec",
              "on-tertiary-fixed": "#2e3d4e",
              "tertiary-container": "#cfdef5",
              "inverse-on-surface": "#9b9d9e",
              "inverse-surface": "#0c0f10",
              "tertiary-dim": "#465467",
              "secondary-dim": "#44546a",
              "on-secondary-container": "#435368",
              "surface-container-lowest": "#ffffff",
              "surface": "#f8f9fa",
              "on-surface": "#2b3437",
              "surface-bright": "#f8f9fa",
              "outline-variant": "#abb3b7",
              "tertiary-fixed": "#cfdef5",
              "on-primary-fixed": "#354053",
              "on-error-container": "#752121",
              "surface-container-highest": "#dbe4e7",
              "on-secondary-fixed-variant": "#4d5d73",
              "inverse-primary": "#dae6fe",
              "background": "#f8f9fa",
              "tertiary": "#526073",
              "surface-dim": "#d1dce0",
              "on-secondary-fixed": "#314055",
              "on-tertiary": "#f7f9ff",
              "primary-fixed-dim": "#cad5ed",
              "secondary-fixed-dim": "#c5d6f0",
              "surface-container-low": "#f1f4f6",
              "error-container": "#fe8983",
              "on-surface-variant": "#586064",
              "error-dim": "#4e0309",
              "secondary": "#506076",
              "on-error": "#fff7f6",
              "primary-dim": "#485367",
              "primary": "#545f73",
              "surface-variant": "#dbe4e7",
              "error": "#9f403d",
              "on-background": "#2b3437",
              "on-tertiary-fixed-variant": "#4a596c",
              "on-primary": "#f6f7ff",
              "tertiary-fixed-dim": "#c1d0e6",
              "surface-tint": "#545f73",
              "secondary-fixed": "#d3e4fe",
              "secondary-container": "#d3e4fe",
              "outline": "#737c7f",
              "primary-container": "#d8e3fb",
              "on-tertiary-container": "#414f62",
              "on-secondary": "#f7f9ff",
              "on-primary-fixed-variant": "#515c70",
              "on-primary-container": "#475266",
              "primary-fixed": "#d8e3fb",
              "border-subtle": "#e2e8f0",
              "background-light": "#f8fafc"
            },
            keyframes: {
                'progress-shrink': {
                    '0%': { width: '100%' },
                    '100%': { width: '0%' }
                }
            },
            animation: {
                'progress-shrink': 'progress-shrink 5s linear forwards'
            },
            fontFamily: {
              "sans": ["Inter", "sans-serif"],
              "inter": ["Inter", "sans-serif"],
              "headline": ["Inter", "sans-serif"],
              "body": ["Inter", "sans-serif"],
              "label": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [],
}
