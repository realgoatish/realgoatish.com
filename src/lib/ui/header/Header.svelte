<script>
  import { Cover, Frame, Center, Box } from '@realgoatish/svelte-every-layout'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Nav from '$lib/ui/nav/Nav.svelte'

  export let header

  export let text
  
  export let images

</script>

<header class="header">
  <Frame ratio={undefined}>
    <Image
      images={images}
      altText={"test alt text"}
    />
  </Frame>
  <Cover noPad={true}>
    <Nav slot="header" />
    <h1 slot="featured">{@html header}</h1>
    <Box colorLight={"hsl(var(--h), var(--s), 90%)"} colorDark={"hsl(var(--h), var(--s), calc(var(--l) - 15%))"} invert={true} padding={"var(--s-1)"}  slot="footer">
      <Center andText={true} max={"var(--measure)"}>
        <h2>{@html text}</h2>
      </Center>
    </Box>
  </Cover>
</header>

<style>
  header {
    position: relative;
    max-width: 75ch;
    margin: 0 auto;
  }

  header :global(.frame) {
    min-height: 100vh;
  }

  header :global(.frame img) {
    object-position: 50% 100%;
  }

  header :global(.cover) {
    /* z-index: 999; */
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  /* TODO Cover's featured item (my name) needs to be much closer to its header item on smaller sreens */
  header.header :global(.cover > .featured) {
    margin-top: var(--s-4);
  }

  header  h1 {
    --complement-hue: calc(var(--h) + 180);
    line-height: 1;
    font-size: var(--s3);
    /* color: var(--color-lightish);
    text-shadow:
    -1px -1px 0 var(--color-white),
    1px -1px 0 var(--color-white),
    -1px 1px 0 var(--color-white),
    1px 1px 0 var(--color-white);  */
    /* color: hsl(var(--complement-hue), var(--s), var(--l)); */
    color: var(--color-secondary);
    text-shadow:
    /* -1px -1px 0 hsl(var(--complement-hue), var(--s), 90%),
    1px -1px 0 hsl(var(--complement-hue), var(--s), 90%),
    -1px 1px 0 hsl(var(--complement-hue), var(--s), 90%),
    1px 1px 0 hsl(var(--complement-hue), var(--s), 90%); */
    -1px -1px 0 var(--color-secondary--white),
    1px -1px 0 var(--color-secondary--white),
    -1px 1px 0 var(--color-secondary--white),
    1px 1px 0 var(--color-secondary--white);
  }

  header h2 {
    color: hsl(var(--h), var(--s), 90%);
  }

  @media (min-width: 600px) {
    header h1 {
      font-size: var(--s4);
    }

    header.header :global(.cover > .featured) {
      margin-top: var(--s3);
    }
  }

</style>