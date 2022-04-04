<!--
  @component
  Create basic, two-tone boxes
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

  /** @type {?string} [colorLight=null] - light color for the box, defaults to 'background-color'. Becomes 'color' if 'invert' prop is true */
  export let colorLight = null

  /** @type {?string} [colorDark=null] - dark color for the box, defaults to 'color'. Becomes 'background-color' if 'invert' prop is true */
  export let colorDark = null

  /** @type {string} - a CSS padding value */
  export let padding = null

  /** @type {?(string|number)} - a CSS border-width value */
  export let borderWidth = null

	/** @type {boolean} [invert=false] - prop to add a class and invert 'color' & 'background-color' */
	export let invert = false;

</script>

<div
	class={wrapperClass ? `box ${wrapperClass}` : 'box'}
  style:--padding={padding ? padding : '0'}
  style:--border-thin={borderWidth ? borderWidth : null}
  style:--color-light={colorLight ? colorLight : null}
  style:--color-dark={colorDark ? colorDark : null}
  style:border={borderWidth ? `${borderWidth} solid` : 'none'}
  style:outline={borderWidth ? null : `var(--border-thin, var(--s-4)) solid transparent`}
  style:outline-offset={borderWidth ? null : `calc(var(--border-thin, var(--s-4)) * -1)`}
	class:invert
>
	<slot />
</div>

<style>

  .box {
    padding: var(--padding);
    color: var(--color-dark, #000);
    background-color: var(--color-light, #fff);
  }

  .box * {
    color: inherit;
  }

  .box.invert {
    color: var(--color-light, #fff);
    background-color: var(--color-dark, #000);
  }

</style>
