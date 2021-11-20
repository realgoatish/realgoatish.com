<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';

	/**
	 * @type {string}
	 * the ID attribute (including '#') of the icon you want to pull from the sprite
	 */
	export let iconId;

	/**
	 * @type {string}
	 * including this prop will represent the enclosing span as an image with role="img" and aria-label={label}.
	 * this prop is used when there is no accompanying visible label text slotted into the component,
	 * in order to ensure that it has an accessible name.
	 */
	export let label = '';

  export let space = true

	// class="{wrapperClass ? `with-icon ${wrapperClass}` : 'with-icon'}"

</script>

<span
	class="{
    wrapperClass 
    ? `${wrapperClass}` 
    : ''}
    {
      space
      ? `with-icon`
      : ''
    }"

	aria-label={label ? label : null}
	role={label ? 'img' : null}
>
	<svg class="icon">
		<use href={`${iconId}`} />
	</svg>
	{#if !label}
		<slot />
	{/if}
</span>

<style>
	/* Exposed as CSS variables:
      --space
  */

	.icon {
		width: 0.75em;
		width: 1cap;
		height: 0.75em;
		height: 1cap;
	}

	.with-icon {
		display: inline-flex;
		align-items: baseline;
	}

	.with-icon .icon {
		margin-inline-end: var(--space, 1rem);
	}
</style>
