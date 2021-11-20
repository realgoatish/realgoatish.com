<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';
	/**
	 * @type {boolean}
	 * allow horizontal scrolling within the modal
	 *  - this prop generally shouldn't be needed, since modals shouldn't have a lot of content
	 */
	export let contain = false;
	/**
	 * @type {boolean}
	 * whether to position the element relative to the viewport
	 */
	export let fixed = false;
	/**
	 * @type {HTMLElement}
	 * due to a11y requirements for DOM manipulation, we have to expose a
	 * reference to the Imposter's wrapper div so it can be manipulated from parent
	 * components e.g. Modal.svelte
	 */
	export let imposterWrapperDiv;
</script>

<!-- This *needs* to be wrapped in a position:relative parent -->
<div
	bind:this={imposterWrapperDiv}
	class={wrapperClass ? `imposter ${wrapperClass}` : 'imposter'}
	class:contain
	class:fixed
>
	<slot />
</div>

<style>
	/* 
    Exposed as CSS variables:
      --margin
  */
	.imposter {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.fixed {
		position: fixed;
	}

	.contain {
		overflow: auto;
		max-width: calc(100% - (var(--margin, 0) * 2));
		max-height: calc(100% - (var(--margin, 0) * 2));
	}
</style>
