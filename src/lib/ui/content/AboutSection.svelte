<script>
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Box from '$lib/toolbox/layout/Box.svelte'
  import Switcher from '$lib/toolbox/layout/Switcher.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Frame from '$lib/toolbox/layout/Frame.svelte'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'

  export let title

  export let summary
  
  export let sections

</script>

<div>
  <Section>
    <Cover>
      <Section slot="header">
        <Stack>
          <HeadingTag message={title} />
          {@html summary}
        </Stack>
      </Section>
      <Switcher slot="featured" wrapperElement="div">
        {#each sections as section}
          <Article>
            <Stack>
              <HeadingTag message={section.header} />
              {@html section.description}
            </Stack>
          </Article>
        {/each}
      </Switcher>
      <button slot="footer">PRESS ME</button>
    </Cover>
  </Section>
</div>

<style>

  /* div :global(.box) {
    --color: var(--color-darkish);
  }

  div :global(h1), div :global(h2), div :global(h3), div :global(h4), div :global(h5), div :global(h6) {
    --color: var(--color-lightish);
  } */

  /* div :global(article) {
  } */

  div :global(h1),
  div :global(h2),
  div :global(h3),
  div :global(h4),
  div :global(h5),
  div :global(h6) {
    color: var(--color-lightish);
    /* background: var(--color-darkish); */
  }


  /* div :global(.box) {
    --background-color: transparent;
  } */

  div :global(.switcher) {
    --space: var(--s2);
    --measure: 30rem;
  }

  div :global(.stack) {
    --space: var(--s0);
  }

</style>