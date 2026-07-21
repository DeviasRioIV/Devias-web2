// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // The site stays static; only routes with `export const prerender = false`
  // (e.g. /api/contact) run on-demand as Vercel serverless functions.
  adapter: vercel(),
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
          style: 'normal'
        }]
      }
    }
  ]
});