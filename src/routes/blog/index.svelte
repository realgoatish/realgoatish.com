<script context="module">

  import { Center, Stack, Cluster } from '@realgoatish/svelte-every-layout'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import BaseSEO from '$lib/toolbox/seo/BaseSEO.svelte'

  export const load = async ({ props }) => {

    console.log(`props in /blog/ load function before processing: ${JSON.stringify(props, null, 2)}`)

    const { allPostsData } = props
    const pageData = props.pageData.page
    const { pageSEO } = props.pageData

    return {
      props: {
        allPostsData,
        pageData
      },
      stuff: {
        pageSEO
      }
    }
  }

</script>

<script>

  import { page } from '$app/stores'
  export let pageData
  export let allPostsData

  $: console.log(`$page.stuff on /blog/ page: ${JSON.stringify($page.stuff, null, 2)}`)

</script>

<BaseSEO data={{
  currentPage: $page.stuff.pageSEO,
  global: $page.stuff.globalSEO
}}/>

<main>
  <Center intrinsic={true} gutters={"var(--s-3)"} max={"var(--measure)"}>
    <Stack space={"var(--s1)"}>
      <div>
        <HeadingTag message={pageData.title} />
      </div>
      <Section>
        <Stack space={"var(--s0"}>
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
