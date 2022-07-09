<script context="module">

  import Header from '$lib/ui/header/Header.svelte'
  import { Center } from '@realgoatish/svelte-every-layout'
  import AboutSection from '$lib/ui/content/AboutSection.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'
  import Footer from '$lib/ui/footer/Footer.svelte'

  export const load = async ({ props }) => {

    const { pageSEO } = props

    return {
      props,
      stuff: {
        pageSEO
      }
    }
  }

</script>

<script>

  import { page } from '$app/stores'

  export let hero

  export let about

  $: console.log(`$page.stuff on home page: ${JSON.stringify($page.stuff, null, 2)}`)

</script>

<BaseSEO data={{
  currentPage: $page.stuff.pageSEO,
  global: $page.stuff.globalSEO
}}/>

<Header {...hero} />
<main>
  <Center max={"var(--measure)"}>
    <AboutSection {...about} />
  </Center>
</main>
<Footer />