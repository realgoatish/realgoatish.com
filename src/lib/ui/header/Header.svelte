<script>
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Frame from '$lib/toolbox/layout/Frame.svelte'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Box from '$lib/toolbox/layout/Box.svelte'
  import Nav from '$lib/ui/nav/Nav.svelte'

  export let header

  export let text
  
  export let images

</script>

<header class="header">
  <Frame>
    <Image
      images={images}
      altText={"test alt text"}
    />
  </Frame>
  <Cover noPad={true}>
    <Nav slot="header" />
    <h1 slot="featured">{@html header}</h1>
    <Box colorLight={"var(--color-white)"} colorDark={"var(--color-darkish)"} invert={true} padding={"var(--s-1)"}  slot="footer">
      <Center andText={true}>
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

  /* Cover's featured item (my name) needs to be much closer to its header item on smaller sreens */
  header.header :global(.cover > .featured) {
    margin-top: var(--s-4);
  }

  header  h1 {
    line-height: 1;
    font-size: var(--s3);
    color: var(--color-lightish);
    text-shadow:
    -1px -1px 0 var(--color-white),
    1px -1px 0 var(--color-white),
    -1px 1px 0 var(--color-white),
    1px 1px 0 var(--color-white); 
  }

  header h2 {
    color: var(--color-light);
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