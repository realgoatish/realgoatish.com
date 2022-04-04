<!--
  @component
  Switch between horizontal & vertical layout at a given, container-based breakpoint
-->


<script>
	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
  export let wrapperClass = null;

	/** @type {!string} - control the parent of slot content by choosing 'div', 'ul', 'ol', or 'dl' */
	export let wrapperElement;

  /** @type {string} - A CSS `width` value (representing the `container breakpoint`) */
  export let threshold = "var(--measure)"

  /** @type {?string} [space=null] - A CSS `margin` value */
  export let space = null

  /** @type {number} - A number representing the maximum number of items permitted for a horizontal layout */
  export let limit = 4
</script>

{#if wrapperElement === 'ul'}
	<ul class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}
    style:--threshold={threshold}
    style:--space={space ? space : null}
  >
  {@html `<style>
    .switcher > :nth-last-child(n+ ${limit + 1}) {
      flex-basis: 100%;
    }
    </style>`}
		<slot />
	</ul>
{:else if wrapperElement === 'ol'}
	<ol class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}
    style:--threshold={threshold}
    style:--space={space ? space : null}
  >
  {@html `<style>
    .switcher > :nth-last-child(n+ ${limit + 1}) {
      flex-basis: 100%;
    }
    </style>`}
		<slot />
	</ol>
{:else if wrapperElement === 'dl'}
	<dl class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}
    style:--threshold={threshold}
    style:--space={space ? space : null}
  >
  {@html `<style>
    .switcher > :nth-last-child(n+ ${limit + 1}) {
      flex-basis: 100%;
    }
    </style>`}
		<slot />
	</dl>
{:else if wrapperElement === 'div'}
	<!-- each slotted child element for the Switcher requires a <div> wrapper -->
	<div class={wrapperClass ? `switcher ${wrapperClass}` : 'switcher'}
    style:--threshold={threshold}
    style:--space={space ? space : null}
  >
  {@html `<style>
    .switcher > :nth-last-child(n+${limit + 1}) {
      flex-basis: 100%;
    }
    </style>`}
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
		flex-basis: calc((var(--threshold, 30rem) - 100%) * 999);
	}

	ul,
	ol,
	dl {
		list-style: none;
	}
</style>
