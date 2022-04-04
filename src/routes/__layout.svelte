<script context="module">
	import '@fontsource/playfair-display/800.css';
	import '../app.css';
  import Sprite from '$lib/toolbox/sprite/Sprite.svelte'
  import Footer from '$lib/ui/footer/Footer.svelte'

	export async function load({ fetch, url }) {
		let res = await fetch('/api/layout/getLayoutData/', {
			method: 'GET'
		}).then((data) => data.json());

    const { headerData, globalSEO } = res
    const host = url.hostname
    const path = url.pathname

    globalSEO.canonical = `https://${host}${path}`
    globalSEO.siteUrl = `https://${host}/`

		return {
			props: {
        headerData,
        globalSEO
      }
		};
	}

</script>

<script>
  import { navData, globalSeoData } from '$lib/js/constants'
  import { setContext } from 'svelte'
  export let headerData
  export let globalSEO

  setContext(navData, headerData)
  setContext(globalSeoData, globalSEO)

</script>

<Sprite />

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div id="body-wrapper">
  <slot />
  <Footer />
</div>

<style>
	div :global(.heading-tag),
  div :global(h1),
  div :global(h2) {
		font-family: 'Playfair Display';
    color: var(--color-lightish);
	}

</style>
