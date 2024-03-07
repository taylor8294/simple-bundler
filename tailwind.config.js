/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.{html,js}',
    './components/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        'black':       '#000000',
        'white':       '#ffffff',
        'npl-black':   '#000230',
        'lavender':    '#5967A5',
        'cornflower':  '#879AD0',
        'green':       '#DCEC00',
        'dark-green':  '#DCEC00',
        'blue':        '#009CD5',
        'other-blue':  '#2d357a',
        'deep-blue':   '#00658F',
        'grey':        '#EDEEF2',
        'dark-grey':   '#bebfcb',
        'off-white':   '##E6F0FF',
        'light':       '#F3F4F6',
        'powder-blue': '#C0CCF0',
        'purple':      '#2D0C8C',
        'violet':      '#5300DB',
        'lilac':       '#36335a',
        'rose':        '#DF006E',
        'deep-rose':   '#9D002B',
        'yellow':      '#FFC200',
        'gold':        '#EC9200',
        'tooltip':     '#e6f0ff',
      },
      fontFamily: {
        sans: ['Poppins', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        serif: ['RobotoSerif', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      spacing: {
        22: '5.5rem',
        88: '22rem',
        104: '26rem',
        112: '28rem',
        120: '30rem',
      },
      fontSize: {
        0: ['0', { lineHeight: '0' }],
        md: ['1.0625rem', { lineHeight: '1.5rem' }],
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderWidth: {
        12: '12px',
        16: '16px',
        24: '24px',
        32: '32px',
      },
      listStyleType: {
        circle: 'circle'
      }
    }
  },
}
