<!--
  @component
  Needs to be wrapped in a `position: relative` parent
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

	/** @type {boolean} [contain=false] - Use this with the `margin` prop to allow horizontal scrolling within the modal */
	export let contain = false;

	/** @type {boolean} [fixed=false] - whether to position the element relative to the viewport */
	export let fixed = false;

  /** @type {string} [margin="0"] - The minimum space between the element and the inside edges of the positioning container over which it is placed */
  export let margin = "0"

	/** @type {HTMLElement} - due to a11y requirements for DOM manipulation, we have to expose a reference to the Imposter's wrapper div so it can be manipulated from parent components e.g. Modal.svelte */
	export let imposterWrapperDiv;

</script>

<div
	bind:this={imposterWrapperDiv}
	class={wrapperClass ? `imposter ${wrapperClass}` : 'imposter'}
  style:--margin={margin}
	class:contain
	class:fixed
>
	<slot />
</div>

<style>

	.imposter {
		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 50%;
		transform: translate(-50%, -50%);
	}

	.fixed {
		position: fixed;
	}

	.contain {
		overflow: auto;
		max-inline-size: calc(100% - (var(--margin) * 2));
		max-block-size: calc(100% - (var(--margin) * 2));
	}
</style>
