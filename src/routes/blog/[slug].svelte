<script context="module">
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Frame from '$lib/toolbox/layout/Frame.svelte'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'

	export async function load({ fetch, params }) {

    const { slug } = params

		let res = await fetch(`/api/blog/${slug}/`, {
			method: 'GET'
		}).then((data) => data.json());

    console.log(`res before processing: ${JSON.stringify(res, null, 2)}`)

    const { post, pageSEO } = res


		return {
			props: {
				post,
        pageSEO
			}
		};
	}
</script>

<script>
  import { globalSeoData } from '$lib/js/constants'
  import { getContext } from 'svelte'
  export let post
  export let pageSEO

  const globalSEO = getContext(globalSeoData)

  $: console.log(`pageSEO on blog/[slug].svelte: ${JSON.stringify(pageSEO, null, 2)}`)
</script>

<BaseSEO data={{
  currentPage: pageSEO,
  global: globalSEO
}}/>
<main>
  <Center>
    <Article>
      <Cover>
        <div slot="header">
          <Stack>
            <HeadingTag message={post.title} />
            <p>{post.subTitle}</p>
          </Stack>
        </div>
        <Section slot="featured">
          <Stack>
            {#each post.postSections as section}
              {#if section.postBlockLayout === 'Text'}
                <div class="blog-post-text">{@html section.text}</div>
              {:else if section.postBlockLayout === 'Title'}
                <HeadingTag message={section.title} />
              {:else if section.postBlockLayout === 'Image'}
                <div class="blog-post-image">
                  <Frame>
                    <Image images={section.image} altText={section.altText} />
                  </Frame>
                </div>
              {:else if section.postBlockLayout === 'Title Image'}
                <div>
                  <Stack>
                    <HeadingTag message={section.title} />
                    <div class="blog-post-image">
                      <Frame>
                        <Image images={section.image} altText={section.altText} />
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
                        <Image images={section.image} altText={section.altText} />
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
                        <Image images={section.image} altText={section.altText} />
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

  main :global(.center) {
    --gutters: var(--s-3);
    --measure: 60ch;
  }

  main :global(.cover) {
    padding-top: var(--s1);
    padding-bottom: var(--s1);
  }

  main :global(ul) {
    list-style: disc;
    padding-left: 45%;
  }

  main :global(article > section > .stack) {
    --space: var(--s1);
  }

  main .blog-post-text > :global(* + *) {
    margin-top: var(--s0);
  }

  main :global(.embedded-media) {
    margin-left: auto;
    margin-right: auto;
  }
</style>

