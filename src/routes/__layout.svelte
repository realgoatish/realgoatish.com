<script context="module">
	import '@fontsource/playfair-display/800.css';
	import '../app.css';
  import Sprite from '$lib/toolbox/sprite/Sprite.svelte'




	export async function load({ fetch }) {
		let res = await fetch('/api/layout/getLayoutData', {
			method: 'GET'
		}).then((data) => data.json());

    const stuff = {
      headerData: res
    }

		return {
			props: {
        stuff
      },
      stuff
		};
	}
</script>

<script>
  import { navData } from '$lib/js/constants'
  import { setContext } from 'svelte'
  export let stuff

  setContext(navData, stuff)

</script>

<Sprite />

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>


<div id="body-wrapper">
  <slot />
</div>

<style>
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Playfair Display';
	}

</style>
