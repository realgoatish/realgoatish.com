<script>
  import { Cover, Switcher, Stack, Icon, Center } from '@realgoatish/svelte-every-layout'
  import Section from '$lib/toolbox/section/Section.svelte'
  import Article from '$lib/toolbox/article/Article.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import Render from '$lib/toolbox/render-on-scroll/RenderOnScroll.svelte'

  export let title

  export let summary
  
  export let sections

</script>

<div>
  <Section>
    <Center max={"var(--measure)"} gutters={"var(--s-3)"}>
      <Cover noPad={true}>
        <Section slot="header">
          <Render>
            <Stack>
              <HeadingTag message={title} />            
              {@html summary}
            </Stack>
          </Render>
  
        </Section>
        <Switcher slot="featured" space="var(--s1)" threshold={"25rem"} wrapperElement="div">
          {#each sections as section, i}
              <Article>
                <Render>
                  <Center andText={true} intrinsic={true} max={"var(--measure)"}>
                    <Stack>
                      {#if i === 1}
                        <HeadingTag message={section.header} />
                          <Icon ariaHidden={true} iconId="#trending-up" />
                      {:else}
                        <HeadingTag message={section.header} />
                          <Icon ariaHidden={true} iconId="#light-bulb" />
                      {/if}
                      {@html section.description}
                    </Stack>
                  </Center>
                </Render>
              </Article>
  
          {/each}
        </Switcher>
        <!-- <button slot="footer">PRESS ME</button> -->
      </Cover>
    </Center>

  </Section>
</div>

<style>

  div :global(.cover) {
    margin-block: var(--s5);
  }

  div :global(.switcher article) {
    margin-block-start: var(--s5);
    min-block-size: 100%;
  }

  div :global(section > .render-on-scroll > .stack),
  div :global(.switcher > article > .render-on-scroll > *) {
	  animation: fade-in-bottom .8s cubic-bezier(0.390, 0.575, 0.565, 1.000) forwards;
  }

  @keyframes -global-fade-in-bottom {
  0% {
    transform: translateY(50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

  div :global(.icon) {
    font-size: var(--s4);
  }


</style>