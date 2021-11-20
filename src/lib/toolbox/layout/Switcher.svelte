<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';
	/**
	 * @type {string}
	 * control the parent of slot content by choosing 'div', 'ul', 'ol', or 'dl'
	 */
	export let wrapperElement;
</script>

{#if wrapperElement === 'ul'}
	<ul class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}>
		<slot />
	</ul>
{:else if wrapperElement === 'ol'}
	<ol class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}>
		<slot />
	</ol>
{:else if wrapperElement === 'dl'}
	<dl class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}>
		<slot />
	</dl>
{:else if wrapperElement === 'div'}
	<!-- each slotted child element for the Switcher requires a <div> wrapper -->
	<div class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}>
		<slot />
	</div>
{/if}

<style>
	/* Exposed as CSS variables:
      --space
      --measure => the container width at which the component switches between a 
          horizontal & vertical layout
  */

	.switcher {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space, 1rem);
	}

	.switcher > :global(*) {
		flex-grow: 1;
		flex-basis: calc((var(--measure, 30rem) - 100%) * 999);
	}

	.switcher > :global(* > :nth-last-child(n + 5)),
	.switcher > :global(* > :nth-last-child(n + 5) ~ *) {
		flex-basis: 100%;
	}

	ul,
	ol,
	dl {
		list-style: none;
	}
</style>
