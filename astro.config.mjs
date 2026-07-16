// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales: ["es", "en"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  },
  redirects: {
    "/": "/es"
  },
  vite: {
    plugins: [tailwindcss()]
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "UniviaPro",
      cssVariable: "--univia-pro-regular",
      options: {
        variants: [{
          src: ['./src/assets/fonts/UniviaPro/UniviaPro-Regular.otf'],
          weight: 'normal',
          style: 'normal'
        }]
      }
    },
    {
      provider: fontProviders.local(),
      name: "UniviaPro",
      cssVariable: "--univia-pro-ultra",
      options: {
        variants: [{
          src: ['./src/assets/fonts/UniviaPro/UniviaPro-Ultra.otf'],
          weight: 'normal',
          style: 'normal'
        }]
      }
    },
    {
      provider: fontProviders.local(),
      name: "RobotoMono",
      cssVariable: "--roboto-mono",
      options: {
        variants: [{
          src: ['./src/assets/fonts/RobotoMono/RobotoMono-VariableFont_wght.ttf'],
          weight: 'normal',
          style: 'normal'
        }]
      }
    },
    {
      provider: fontProviders.local(),
      name: "Roboto",
      cssVariable: "--roboto",
      options: {
        variants: [{
          src: ['./src/assets/fonts/Roboto/Roboto-VariableFont_wdth,wght.ttf'],
          weight: 'normal',
          style: 'normal'
        }]
      }
    }
  ]
});