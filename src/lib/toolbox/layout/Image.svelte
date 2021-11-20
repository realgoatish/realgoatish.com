<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';

	/**
	 * @type {Array.<{width: (string|number), src: string}>}
	 * an array of processed image objects for responsive images
	 */
	export let images;

	/**
	 * @type {string}
	 */
	export let altText;
</script>

<img
	srcset={images.map((obj) => `${obj.src} ${obj.width}w,`).join('')}
	src={images[images.length - 1].src}
	sizes="50vw"
	alt={altText}
	class={wrapperClass}
/>

<style>
	img {
		opacity: 0;
		animation-name: fadeImages;
		animation-duration: 1.2s;
		animation-fill-mode: forwards;
		border-radius: var(--image-border-radius, none);
	}

	/* animation for opacity fade-in of image with or without JS */
	@keyframes fadeImages {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>
