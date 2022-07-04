<script context="module">
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Cluster from '$lib/toolbox/layout/Cluster.svelte'

  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'

	export async function load({ fetch }) {
		let res = await fetch('/api/blog/getAllPosts/', {
			method: 'GET'
		}).then((data) => data.json());

    console.log(`res before processing: ${JSON.stringify(res, null, 2)}`)

    const { allPostsData } = res
    const { page } = res.pageData
    const { pageSEO } = res.pageData 

		return {
			props: {
        pageSEO,
				page,
        allPostsData
			}
		};
	}
</script>

<script>
  import { globalSeoData } from '$lib/js/constants'
  import { getContext } from 'svelte'
  export let pageSEO
  export let page
  export let allPostsData


  const globalSEO = getContext(globalSeoData)

  // $: console.log(JSON.stringify(page, null, 2))
</script>

<BaseSEO data={{
  currentPage: pageSEO,
  global: globalSEO
}}/>

<main>
  <Center intrinsic={true} gutters={"var(--s-3)"}>
    <Stack>
      <div>
        <HeadingTag message={page.title} />
      </div>
      <Section>
        <Stack>
          {#each allPostsData as post}
            <Article>
              <p class="text-small">{post.publicationDate}</p>
              <a class="link-hover-effect" href={post.href}>
                {post.title}
              </a>
              <br>
              {#if post.tags.length !== 0}
                <Cluster wrapperElement="ul">
                  {#each post.tags as tag}
                    <li>
                      <span class="text-small">{tag}</span>
                    </li>
                  {/each}
                </Cluster>
              {/if}
            </Article>
          {/each}
        </Stack>
      </Section>
    </Stack>
  </Center>
</main>

<style>

  main :global(.center > .stack) {
    --space: var(--s1);
  }

  main :global(section .stack) {
    --space: var(--s0);
  }

</style>