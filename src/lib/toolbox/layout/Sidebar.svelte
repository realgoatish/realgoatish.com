<!--
  @component
  A sidebar & main content area, which stack on smaller screens
-->

<script>
	/**
	 * @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;
  
	/**
	 * @type {string} [side="left"] - Which element to treat as the sidebar (all values but "left" are considered "right") */
	export let side = "left";

  /** @type {?string} [sideWidth=null] - Represents the width of the sidebar when adjacent. If not set (null) it defaults to the sidebar's content width */
  export let sideWidth = null

  /** @type {string} [contentMin="50%"] - A CSS percentage value. The minimum width of the content element in the horizontal configuration */
  export let contentMin = "50%"

  /** @type {?string} [space=null] - a CSS margin value representing the spacing between the two elements */
  export let space = null

</script>

<!-- <div class={wrapperClass ? `with-sidebar ${wrapperClass}` : 'with-sidebar'}>
	<div class:mainContent={sidebar !== 'left'}>
		<slot name="sidebar-content" />
	</div>
	<div class:mainContent={sidebar !== 'right'}>
		<slot name="main-content" />
	</div>
</div> -->

<div class={wrapperClass ? `with-sidebar ${wrapperClass}` : `with-sidebar`}
  style:--space={space ? space : null}
>
	<div
    style:flex-grow={side === `left` ? `1` : `999`}
    style:flex-basis={side === `left` ? sideWidth : `0`}
    style:min-inline-size={side === `left` ? null : contentMin}
  >
		<slot name="first-child" />
	</div>
	<div
    style:flex-grow={side !== `left` ? `1` : `999`}
    style:flex-basis={side !== `left` ? sideWidth : `0`}
    style:min-inline-size={side !== `left` ? null : contentMin}
  >
		<slot name="last-child" />
	</div>
</div>

<style>
	/* Properties exposed as CSS variables:
      --space
  */

  .with-sidebar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space, var(--s0));
  }

</style>
