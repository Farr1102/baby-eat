import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    ['btn', 'px-4 py-1 rounded inline-block bg-pink-500 text-white cursor-pointer transition active:scale-96 disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50'],
    ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-pink-500'],
    // Apple-style material surfaces (light + dark)
    ['card', 'rounded-2xl bg-white shadow-[0_1px_2px_rgba(20,20,36,0.04),0_10px_30px_-12px_rgba(20,20,36,0.12)] dark:bg-#1c1c1e dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_10px_30px_-12px_rgba(0,0,0,0.7)]'],
    ['card-press', 'card transition-transform duration-150 ease-out active:scale-98'],
    ['glass', 'bg-white/60 dark:bg-#1c1c1e/60 backdrop-blur-14 backdrop-saturate-180'],
    ['glass-strong', 'bg-white/72 dark:bg-#1c1c1e/68 backdrop-blur-22 backdrop-saturate-180'],
  ],
  theme: {
    colors: {
      gray: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#595959',
        400: '#404040',
        500: '#333333',
        600: '#262626',
        700: '#1a1a1a',
        800: '#111111',
        900: '#000000',
      },
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
