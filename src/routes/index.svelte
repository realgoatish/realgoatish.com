<script context="module">

  import Header from '$lib/ui/header/Header.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'


  // import Imposter from '$lib/toolbox/layout/Imposter.svelte'
  // import Box from '$lib/toolbox/layout/Box.svelte'



	export async function load({ fetch, stuff }) {
		let res = await fetch('/api/home/getHomePageData', {
			method: 'GET'
		}).then((data) => data.json());

    console.log(stuff)

		return {
			props: {
				homePageData: res,
			}
		};
	}
</script>

<script>
	export let homePageData;

  const { hero } = homePageData

</script>

<Header backgroundImage={hero.images} />
<main>
  <p>Here's some test homepage content</p>
</main>


<style>



</style>