<!--
  @component
  Frame for cropping images to a desired aspect ratio
-->

<script>
	import { intersectionObserver } from '$lib/js/actions';

	/** @type {?string} [wrapperClass=null] - add a class name to the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages) */
	export let wrapperClass = null;

	/** @type {boolean} [lazy=false] - set to 'true' for image lazyloading */
	export let lazy = false;

  /** @type {string} [ratio=`1:1`] - The desired aspect ratio */
  export let ratio = `1:1`

	let intersecting = false;

	const setIntersecting = () => {
		intersecting = true;
	};
</script>

<div
	use:intersectionObserver={{ once: true, options: { rootMargin: '0px' } }}
	on:intersection={setIntersecting}
	class={wrapperClass ? `frame ${wrapperClass}` : 'frame'}
  style:--numerator={ratio.split(`:`)[0]}
  style:--denominator={ratio.split(`:`)[1]}
>
	<noscript>
		<slot />
	</noscript>
	{#if lazy && intersecting}
		<slot />
	{:else if !lazy}
		<slot />
	{/if}
</div>

<style>
	/* 
    Exposed as CSS variables:
      --numerator
      --denominator
  */

	.frame {
		padding-bottom: calc(var(--numerator, 1) / var(--denominator, 1) * 100%);
		position: relative;
	}

	/* 
  for cropping non - <img> or <video> direct children 
  */
	.frame > :global(*) {
		overflow: hidden;
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.frame > :global(noscript) {
		overflow: visible;
	}

	/* 
  for cropping <img> or <video> children of .frame
  */
	.frame > :global(img),
	.frame > :global(noscript > img),
	.frame > :global(video),
	.frame > :global(noscript > video) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
