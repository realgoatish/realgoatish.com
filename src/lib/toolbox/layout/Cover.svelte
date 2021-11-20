<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';
</script>

<!-- Cover can have 3 direct children:
  1. "header" i.e. content pinned to the top of Cover
  2. vertically-centered content
  3. "footer" i.e. content pinned to the bottom of Cover
-->
<div class={wrapperClass ? `cover ${wrapperClass}` : 'cover'}>
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
    min-height: 100vh;
    /* padding: 1rem; */
	}

	.cover > :global(*) {
		margin-top: var(--space, 1rem);
		margin-bottom: var(--space, 1rem);
	}

	.cover > .header {
		margin-top: 0;
	}

	.cover > .footer {
		margin-bottom: 0;
	}

	.cover > .featured {
		margin-top: auto;
		margin-bottom: auto;
	}
</style>
