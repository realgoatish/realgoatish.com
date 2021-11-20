<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';

	/**
	 * @type {boolean}
	 * prop to add a class and invert 'color' & 'background-color'
	 */
	export let switchColors = false;
</script>

<div
	class={wrapperClass ? `box ${wrapperClass}` : 'box'}
	class:invert={switchColors}
>
	<slot />
</div>

<style>
	/* 
    Exposed CSS variables:
      --color
      --background-color
  */

	.box {
		color: var(--color, #000);
		background-color: var(--background-color, #fff);
	}

	.box * {
		color: inherit;
	}

	/* switch the text & background colors e.g. for light/dark mode */
	.box.invert {
		color: var(--background-color);
		background-color: var(--color);
	}
</style>
