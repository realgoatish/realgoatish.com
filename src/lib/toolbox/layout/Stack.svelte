<!--
  @component
  Evenly-spaced child elements stacked vertically
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
  export let wrapperClass = null;

  /** @type {?string} [space=null] - A CSS `margin` value. */
  export let space = null

</script>

<div class={wrapperClass 
  ? `stack ${wrapperClass}` 
  : 'stack'} 
  style:--space={space ? space : null}
>
  <slot />

</div>

<style>
	/* 
    Exposed as CSS variables:
      --space
  */

  .stack {
    display: flex;
    flex-direction: column;
    justify-content: flex-start
  }

  .stack > :global(*) {
    margin-block: 0;
  }

  .stack > :global(* + *) {
    margin-block-start: var(--space, var(--s0));
  }

</style>
