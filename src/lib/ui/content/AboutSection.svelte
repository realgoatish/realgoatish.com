<script>
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Switcher from '$lib/toolbox/layout/Switcher.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'


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
        <Stack space="var(--s0)">
          <HeadingTag message={title} />
          {@html summary}
        </Stack>
      </Section>
      <Switcher slot="featured" space="var(--s1)" threshold={"25rem"} wrapperElement="div">
        {#each sections as section, i}
          <Article>
            <Center andText={true} intrinsic={true}>
              <Stack>
                {#if i === 1}
                  <HeadingTag message={section.header} />
                    <Icon ariaHidden={true} space={null} iconId="#trending-up" />
                {:else}
                  <HeadingTag message={section.header} />
                    <Icon ariaHidden={true} space={null} iconId="#light-bulb" />
                {/if}
                {@html section.description}
              </Stack>
            </Center>
          </Article>
        {/each}
      </Switcher>
      <!-- <button slot="footer">PRESS ME</button> -->
    </Cover>
  </Section>
</div>

<style>

  div :global(.cover) {
    margin-block: var(--s5);
  }

  div :global(.switcher > article) {
    margin-block-start: var(--s5);
  }

  div :global(.icon) {
    font-size: var(--s4);
  }


</style>