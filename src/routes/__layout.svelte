<script context="module">


	export async function load({ fetch, url, stuff }) {
		let res = await fetch('/getLayoutData/', {
			method: 'GET'
		}).then((data) => data.json());

    const { headerData, globalSEO } = res
    const host = url.hostname
    const path = url.pathname

    globalSEO.canonical = `https://${host}${path}`
    globalSEO.siteUrl = `https://${host}/`

    stuff = globalSEO

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
  import '@fontsource/playfair-display/800.css';
  import '../app.css';
  import Sprite from '$lib/toolbox/sprite/Sprite.svelte'
  import Nav from '$lib/ui/nav/Nav.svelte'
  import Footer from '$lib/ui/footer/Footer.svelte'
  export let headerData

  setContext(navData, headerData)

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
    color: var(--color-secondary);
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