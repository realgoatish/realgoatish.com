<script>
  import Cover from '$lib/toolbox/layout/Cover.svelte'
  import Frame from '$lib/toolbox/layout/Frame.svelte'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Cluster from '$lib/toolbox/layout/Cluster.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import Nav from '$lib/ui/nav/Nav.svelte'

  export let backgroundImage

  export let links

</script>

<header class="header">
  <Frame>
    <Image
      images={backgroundImage}
      altText={"test alt text"}
    />
  </Frame>
  <Cover>
    <Nav slot="header" />
    <h1 slot="featured">
      Mike <br> Lamb
    </h1> 
    <button slot="footer">Test Button</button>
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
    /* --space: auto; */
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .header :global(.cover > .featured) {
    margin-top: 0;
  }

  h1 {
    line-height: 1;
    font-size: var(--s3);
    color: var(--color-lightish);
    text-shadow:
    -1px -1px 0 var(--color-darkish),
    1px -1px 0 var(--color-darkish),
    -1px 1px 0 var(--color-darkish),
    1px 1px 0 var(--color-darkish); 
  }


</style>