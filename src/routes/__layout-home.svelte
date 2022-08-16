<script context="module">


	export async function load({ fetch, url }) {
		let res = await fetch('/getLayoutData/', {
			method: 'GET'
		}).then((data) => data.json());

    const { headerData, globalSEO } = res
    const host = url.hostname
    const path = url.pathname

    globalSEO.canonical = `https://${host}${path}`
    globalSEO.siteUrl = `https://${host}/`

		return {
			props: {
        headerData
      },
      stuff: {
        globalSEO
      }
		};
	}

</script>

<script>
  import { navData } from '$lib/js/constants'

  import { setContext } from 'svelte'
  import { page } from '$app/stores'
  import '@fontsource/playfair-display/800.css';
	import '../app.css';
  import Sprite from '$lib/toolbox/sprite/Sprite.svelte'
  export let headerData

  setContext(navData, headerData)

  console.log(`$page.stuff in __layout-home.svelte: ${JSON.stringify($page.stuff, null, 2)}`)

</script>

<Sprite />

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div id="body-wrapper">
  <slot />
</div>

<style>
	div :global(.heading-tag),
  div :global(h1),
  div :global(h2) {
		font-family: 'Playfair Display';
    color: var(--color-secondary);
	}

</style>
