<!--
  @component
  Center content with a maximum width
-->

<script>
	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

  /** @type {string} [max="var(--measure)"] - a CSS max-width value */
  export let max = "var(--measure)"

  /** @type {boolean} [andText=false] - Center align the text too (text-align: center) */
  export let andText = false

  /** @type {?string} [gutters=null] - the minimum space on either side of the content */
  export let gutters = null

  /** @type {boolean} [intrinsic=false] - center child elements based on their content width */
  export let intrinsic = false

</script>



<div class={wrapperClass ? `center ${wrapperClass}` : 'center'} 
  style:max-inline-size={max} 
  style:text-align={andText ? 'center' : null}
  style:padding-inline-start={gutters ? gutters : null}
  style:padding-inline-end={gutters ? gutters : null}
  style:display={intrinsic ? 'flex' : null}
  style:flex-direction={intrinsic ? 'column' : null}
  style:align-items={intrinsic ? 'center' : null}
>
	<slot />
</div>

<style>
	/* 
    Exposed as CSS variables:
      --measure
  */

  .center {
    box-sizing: content-box;
    margin-inline: auto;
  }

</style>
