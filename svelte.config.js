import preprocess from 'svelte-preprocess';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: vercel(),
    trailingSlash: 'always',
    // browser: {
    //   router: false
    // }
	}
};

export default config;
