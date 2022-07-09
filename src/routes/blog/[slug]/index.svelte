<script context="module">
  import { Center, Stack, Frame, Cover } from '@realgoatish/svelte-every-layout'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'

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
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import 'prismjs/themes/prism.min.css'
  import Prism from 'prismjs'
  import 'prism-svelte'
  export let post

  onMount(() => {

    document.querySelectorAll('pre').forEach((el) => {
      // hack to avoid escaping HTML
      let txt = document.createElement("textarea")
      txt.innerHTML = el.childNodes[0].data
      console.log(txt.value)

      const highlighted = Prism.highlight(txt.value, Prism.languages.svelte, 'svelte')
      el.innerHTML = highlighted
      el.classList.add('language-')
    })
  })

  $: console.log(`$page.stuff on /blog/[slug] page: ${JSON.stringify($page.stuff, null, 2)}`)

</script>

<BaseSEO data={{
  currentPage: $page.stuff.pageSEO,
  global: $page.stuff.globalSEO
}}/>

<main>
  <Center intrinsic={true} gutters={"var(--s-3)"} max={"70ch"}>
    <Article>
      <Cover noPad={true} >
        <div slot="header">
          <Stack>
            <HeadingTag message={post.title} />
            <p>{post.subTitle}</p>
          </Stack>
        </div>
        <Section slot="featured">
          <Stack space={"var(--s1)"}>
            {#each post.postSections as section}
              {#if section.postBlockLayout === 'Text'}
                <div class="blog-post-text">{@html section.text}</div>
              {:else if section.postBlockLayout === 'Title'}
                <HeadingTag message={section.title} />
              {:else if section.postBlockLayout === 'Image'}
                <div class="blog-post-image">
                  <Frame>
                    <Image lazy={true} images={section.image} altText={section.altText} />
                  </Frame>
                </div>
              {:else if section.postBlockLayout === 'Title Image'}
                <div>
                  <Stack>
                    <HeadingTag message={section.title} />
                    <div class="blog-post-image">
                      <Frame>
                        <Image lazy={true} images={section.image} altText={section.altText} />
                      </Frame>
                    </div>
                  </Stack>
                </div>
              {:else if section.postBlockLayout === 'Title Image Text'}
                <div>
                  <Stack>
                    <HeadingTag message={section.title} />
                    <div class="blog-post-image">
                      <Frame>
                        <Image lazy={true} images={section.image} altText={section.altText} />
                      </Frame>
                    </div>
                    <div class="blog-post-text">{@html section.text}</div>
                  </Stack>
                </div>
              {:else if section.postBlockLayout === 'Title Text'}
                <div>
                  <Stack>
                    <HeadingTag message={section.title} />
                    <div class="blog-post-text">{@html section.text}</div>
                  </Stack>
                </div>
              {:else if section.postBlockLayout === 'Title Text Image'}
                <div>
                  <Stack>
                    <HeadingTag message={section.title} />
                    <div class="blog-post-text">{@html section.text}</div>
                    <div class="blog-post-image">
                      <Frame>
                        <Image lazy={true} images={section.image} altText={section.altText} />
                      </Frame>
                    </div>
                  </Stack>
                </div>
              {:else if section.postBlockLayout === 'Embed Media'}
                <div class="embedded-media">
                  {@html section.text}
                </div>
              {/if}
            {/each}
          </Stack>
        </Section>
        <!-- <div slot="footer">
          <button>CTA!</button>
        </div> -->
      </Cover>
    </Article>
  </Center>
</main>


<style>

  /* main :global(.center) {
    --gutters: var(--s-3);
    --measure: 70ch;
  } */

  main :global(.cover) {
    /* padding-top: var(--s1);
    padding-bottom: var(--s1); */
    padding-block: var(--s1);
  }

  main :global(pre.language-) {
    font-size: var(--s-1);
    /* Prism adds padding: 1em to the pre element, and we need a width in order 
    to trigger the overflow-x */
    width: calc(100vw - 1em);
    overflow-x: auto;
  }

  main :global(ul) {
    list-style: disc;
    padding-left: 45%;
  }

  /* main :global(article > section > .stack) {
    --space: var(--s1);
  } */

  main .blog-post-text > :global(* + *) {
    margin-top: var(--s0);
  }

  main :global(.embedded-media) {
    margin-left: auto;
    margin-right: auto;
  }
</style>

