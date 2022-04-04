<script>
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Switcher from '$lib/toolbox/layout/Switcher.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
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
    <Cover>
      <Section slot="header">
        <Render>
          <Stack space="var(--s0)" >
            <HeadingTag message={title} />
            {@html summary}
          </Stack>
        </Render>
      </Section>
      <Switcher slot="featured" space="var(--s1)" threshold={"25rem"} wrapperElement="div">
        {#each sections as section, i}
          <Render>
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
          </Render>
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

  div :global(.switcher > div > article) {
    margin-block-start: var(--s5);
  }

  div :global(section > .render-on-scroll > .stack) {
	  animation: fade-in-bottom .8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
  }

  div :global(.switcher > .render-on-scroll:nth-child(2) > article) {
	  animation: fade-in-left .8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
  }

  div :global(.switcher > .render-on-scroll:last-child > article) {
	  animation: fade-in-right .8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
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

@keyframes -global-fade-in-left {
  0% {
    transform: translateX(50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes -global-fade-in-right {
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

  div :global(.icon) {
    font-size: var(--s4);
  }


</style>