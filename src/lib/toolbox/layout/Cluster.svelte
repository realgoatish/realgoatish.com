<!--
  @component
  A cluster of elements with equal spacing. Good for navigation links, social media icons, etc.
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

  /** @type {string} [justify=`flex-start`] - A CSS `justify-content` value */
  export let justify = `flex-start`

  /** @type {string} [align=`flex-start`] - A CSS `align-items` value */
  export let align = `flex-start`

  /** @type {?string} [space=null] - A CSS `gap` value. The minimum space between the clustered child elements. */
  export let space = null

</script>

{#if wrapperElement === 'ul'}
	<ul class={wrapperClass ? `cluster ${wrapperClass}` : 'cluster'}
    style:--space={space ? space : null}
    style:--justify={justify}
    style:--align={align}
  >
		<slot />
	</ul>
{:else if wrapperElement === 'ol'}
	<ol class={wrapperClass ? `cluster ${wrapperClass}` : 'cluster'}
    style:--space={space ? space : null}
    style:--justify={justify}
    style:--align={align}
  >
		<slot />
	</ol>
{:else if wrapperElement === 'dl'}
	<dl class={wrapperClass ? `cluster ${wrapperClass}` : 'cluster'}
    style:--space={space ? space : null}
    style:--justify={justify}
    style:--align={align}
  >
		<slot />
	</dl>
{:else if wrapperElement === 'div'}
	<div class={wrapperClass ? `cluster ${wrapperClass}` : 'cluster'}
    style:--space={space ? space : null}
    style:--justify={justify}
    style:--align={align}
  >
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
		justify-content: var(--justify);
		align-items: var(--align);
	}

	ul,
	ol,
	dl {
		list-style: none;
	}
</style>
