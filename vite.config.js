import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
  resolve: {
    alias: {
      $static: path.resolve('static')
    }
  },
  server: {
    fs: {
      allow: ['static']
    }
  }
};

export default config;