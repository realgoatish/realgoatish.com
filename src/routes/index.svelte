<script context="module">

  import Header from '$lib/ui/header/Header.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
  import AboutSection from '$lib/ui/content/AboutSection.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'

	export async function load({ fetch }) {
		let res = await fetch('/api/home/getHomePageData/', {
			method: 'GET'
		}).then((data) => data.json());

    console.log(`res before processing: ${JSON.stringify(res, null, 2)}`)


    const { hero, about, pageSEO } = res

		return {
			props: {
				hero,
        about,
        pageSEO
			}
		};
	}
</script>

<script>
  import { globalSeoData } from '$lib/js/constants'
  import { getContext } from 'svelte'

  export let hero

  export let about

  export let pageSEO

  let globalSEO = getContext(globalSeoData)

</script>

<BaseSEO data={{
  currentPage: pageSEO,
  global: globalSEO
}}/>

<Header {...hero} />
<main>
  <Center>
    <AboutSection {...about} />
  </Center>
</main>
