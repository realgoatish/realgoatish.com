<script context="module">

  import Header from '$lib/ui/header/Header.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Box from '$lib/toolbox/layout/Box.svelte'



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
<!-- <main>
  <Center>
    <Cover>
      <h2 slot="header">Here's some stuff</h2>
      <Box slot="featured">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        </p>
      </Box>
      <button slot="footer">PRESS ME</button>
    </Cover>
  </Center>
</main> -->


<style>

main > :global(.center) {
  --measure: 75ch;
}

</style>