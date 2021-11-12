<script>

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''

</script>
<!-- Cover can have 3 direct children:
  1. "header" i.e. content pinned to the top of Cover
  2. vertically-centered content
  3. "footer" i.e. content pinned to the bottom of Cover
-->
<div class={wrapperClass
  ? `cover ${wrapperClass}`
  : "cover"
}>
  <slot />
</div>

<style>
  /* Exposed CSS variables:
      --space
  */

  .cover {
    display: flex;
    flex-direction: column;
  }

  .cover > :global(*) {
    margin-top: var(--space, 1rem);
    margin-bottom: var(--space, 1rem);
  }

  .cover > :global(*:nth-child(1)) {
    margin-top: 0;
  }

  .cover > :global(*:nth-child(3)) {
    margin-bottom: 0;
  }

  .cover > :global(*:nth-child(2)) {
    margin-top: auto;
    margin-bottom: auto;
  }

</style>