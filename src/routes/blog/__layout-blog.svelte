<script context="module">
	import '@fontsource/playfair-display/800.css';
  import '../../app.css';
  import Sprite from '$lib/toolbox/sprite/Sprite.svelte'
  import Nav from '$lib/ui/nav/Nav.svelte'
  import Footer from '$lib/ui/footer/Footer.svelte'

	export async function load({ fetch, url }) {
		let res = await fetch('/api/layout/getLayoutData/', {
			method: 'GET'
		}).then((data) => data.json());

    // console.log(`res before processing: ${JSON.stringify(res, null, 2)}`)


    const { headerData, globalSEO } = res
    const host = url.hostname
    const path = url.pathname
    // const { host, path } = page

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
  <header>
    <Nav />
  </header>
  <slot />
  <Footer />
</div>

<style>
  div :global(.heading-tag) {
		font-family: 'Playfair Display';
    color: var(--color-lightish);
  }

  /* BEGIN CODE BLOCK FOR PINNING FOOTER TO BOTTOM OF PAGE */

div :global(main) {
  display: block;
}

div {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

/* END CODE BLOCK FOR PINNING FOOTER TO BOTTOM OF PAGE */
</style>