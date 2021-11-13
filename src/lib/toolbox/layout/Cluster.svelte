<script>

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''
  
  /**
   * @type {string}
   * choose the parent element for this component's slot contents:
   *  - ul
   *  - ol
   *  - dl
   *  - div
  */
  export let wrapperElement

</script>

{#if wrapperElement === "ul"}
  <ul class={wrapperClass
    ? `cluster ${wrapperClass}`
    : "cluster"
  }>
    <slot />
  </ul>
{:else if wrapperElement === "ol"}
  <ol class={wrapperClass
    ? `cluster ${wrapperClass}`
    : "cluster"
  }>
    <slot />
  </ol>
{:else if wrapperElement === "dl"}
  <dl class={wrapperClass
    ? `cluster ${wrapperClass}`
    : "cluster"
  }>
    <slot />
  </dl>
{:else if wrapperElement === 'div'}
  <div class={wrapperClass
    ? `cluster ${wrapperClass}`
    : "cluster"
  }>
    <slot />
  </div>
{/if}

<style>
  /* 
    Exposed as CSS variables:
      --space
  */

  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space, 1rem);
    justify-content: flex-start;
    align-items: center;
  }

  ul, ol, dl {
    list-style: none
  }

</style>