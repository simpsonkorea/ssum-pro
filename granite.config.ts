import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'chat-decoder',

  brand: {
    displayName: '읽씹당했나',
    primaryColor: '#EC4899',
    icon: 'https://ssum-pro.vercel.app/logo_light_600.png',
  },

  permissions: [],

  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'npm run ait:dev',
      build: 'npm run ait:build',
    },
  },

  outdir: 'dist',
});
