<script>
  import { intersectionObserver } from '$lib/js/actions'

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''

  /**
   * @type {boolean}
   * set to 'true' for image lazyloading
  */
  export let lazy = false

  let intersecting = false

  const setIntersecting = () => {
    intersecting = true
  }

</script>

<div
  use:intersectionObserver={{once: true, options: { rootMargin: '0px'}}}
  on:intersection={setIntersecting}
  class={wrapperClass
  ? `frame ${wrapperClass}`
  : "frame"
}>
  <noscript>
    <slot />
  </noscript>
  {#if lazy && intersecting}
    <slot />
  {:else if !lazy}
    <slot />
  {/if}
</div>


<style>
  /* 
    Exposed as CSS variables:
      --numerator
      --denominator
  */

  .frame {
    padding-bottom: calc(var(--numerator, 1) / var(--denominator, 1) * 100%);
    position: relative;
  }

  /* 
  for cropping non - <img> or <video> direct children 
  */
  .frame > :global(*) {
    overflow: hidden;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .frame > :global(noscript) {
    overflow: visible;
  }

  /* 
  for cropping <img> or <video> descendants of .frame
  Note that this allows the option of a <Loader> component to slot into .frame & 
  wrap the <img> for lazyloading 

  TODO - test how this will affect e.g. when a <div> is the child of .frame,
  but the <div> has multiple children including an <img>
  */
  .frame > :global(img),
  .frame > :global(noscript > img),
  .frame > :global(video),
  .frame > :global(noscript > video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

</style>