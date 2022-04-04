<!--
  @component
  Grid layout for e.g. cards
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

	/**
	 * @type {!string}
	 * choose the parent element for this component's slot contents:
	 *  - ul
	 *  - ol
	 *  - dl
	 *  - div
	 */
	export let wrapperElement;

  /** @type {string} [min="250px"] - A CSS length value representing `x` in `minmax(min(x, 100%), 1fr) */
  export let min = "250px"

  /** @type {?string} [space=null] - The space between grid cells */
  export let space = null

</script>

{#if wrapperElement === 'ul'}
	<ul class={wrapperClass ? `grid ${wrapperClass}` : 'grid'}
    style:--space={space ? space : null}
    style:--min={min}
  >
		<slot />
	</ul>
{:else if wrapperElement === 'ol'}
	<ol class={wrapperClass ? `grid ${wrapperClass}` : 'grid'}
    style:--space={space ? space : null}
    style:--min={min}
  >
		<slot />
	</ol>
{:else if wrapperElement === 'dl'}
	<dl class={wrapperClass ? `grid ${wrapperClass}` : 'grid'}
    style:--space={space ? space : null}
    style:--min={min}
  >
		<slot />
	</dl>
{:else if wrapperElement === 'div'}
	<div class={wrapperClass ? `grid ${wrapperClass}` : 'grid'}
    style:--space={space ? space : null}
    style:--min={min}
  >
		<slot />
	</div>
{/if}

<style>
	/* 
    Exposed as CSS variables:
      --space
  */

	.grid {
		display: grid;
		grid-gap: var(--space, 1rem);
    /* a little extra insurance against grid blowout */
    max-inline-size: max-content;
	}

	ul,
	ol,
	dl {
		list-style: none;
	}

	@supports (width: min(var(--min), 100%)) {
		.grid {
			grid-template-columns: repeat(auto-fit, minmax(min(var(--min), 100%), 1fr));
		}
	}
</style>
