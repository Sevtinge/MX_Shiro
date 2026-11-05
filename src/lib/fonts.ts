import localFont from 'next/font/local'

const sansFont = localFont({
  src: [
    {
      path: '../assets/fonts/manrope-latin-300.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/manrope-latin-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/manrope-latin-500.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const serifFont = localFont({
  src: '../assets/fonts/noto-serif-sc-latin-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Noto Serif SC'],
})

export { sansFont, serifFont }
