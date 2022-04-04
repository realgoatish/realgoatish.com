<!--
  @component
  Cover can have 3 direct children:
  1. "header" i.e. content pinned to the top of Cover
  2. vertically-centered content
  3. "footer" i.e. content pinned to the bottom of Cover
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

  /** @type {?string} [space=null] - the minimum spacing between & around all of the child elements */
  export let space = null

  /** @type {string} [minHeight="100vh"] - the minimum height of the Cover, before it grows to the height of its content */
  export let minHeight = "100vh"

  /** @type {boolean} [noPad=false] - whether child elements should have padding */
  export let noPad = false
</script>

<div class={wrapperClass ? `cover ${wrapperClass}` : 'cover'}
  style:--space={space ? space : null}
  style:padding={noPad ? null : "var(--space, var(--s0))"}
  style:min-block-size={minHeight}
>
  {#if $$slots.header}
    <div class="header">
      <slot name="header" />
    </div>
  {/if}
  {#if $$slots.featured}
    <div class="featured">
      <slot name="featured" />
    </div>
  {/if}
  {#if $$slots.footer}
    <div class="footer">
      <slot name="footer" />
    </div>
  {/if}
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
    margin-block: var(--space, var(--s0));
  }

  .cover > :first-child:not(.featured) {
    margin-block-start: 0;
  }

  .cover > :last-child:not(.featured) {
    margin-block-end: 0;
  }

  .cover > .featured {
    margin-block: auto;
  }
</style>
