<!--
  @component
  SVG icons with a text label or an aria-label
-->

<script>

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

	/** @type {!string} - A CSS `id` selector for the icon you want to pull from the sprite */
	export let iconId;

	/** @type {?string} [ariaLabel=null] - including this prop will represent the enclosing span as an image with role="img" and aria-label={label}. This prop is used when there is no accompanying visible label text slotted into the component, in order to ensure that it has an accessible name. */
	export let ariaLabel = null;

  /** @type {boolean} [ariaHidden=false] - For decorative SVGs that don't convey information to the user, use this attribute to make the SVG invisible to screen readers */
  export let ariaHidden = false

  /** @type {boolean} [space=true] - The space between the text and the icon. If null, natural word spacing is preserved */
  export let space = true


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

	aria-label={ariaLabel ? ariaLabel : null}
	role={ariaLabel ? 'img' : null}
  aria-hidden={ariaHidden ? ariaHidden : null}
>
	<svg class="icon">
		<use href={`${iconId}`} />
	</svg>
	{#if !ariaLabel}
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
