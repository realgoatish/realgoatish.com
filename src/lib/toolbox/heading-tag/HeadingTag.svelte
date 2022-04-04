<script>
	import { getContext, afterUpdate } from 'svelte';
	import { headingLevel, counter } from '$lib/js/constants';
	import { browser } from '$app/env';

	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass;
	/**
	 * @type {string}
	 * the content you want inside the heading tag. Also accepts HTML
	 * (need to sanitize it yourself if applicable)
	 */
	export let message;

	let level;

	let id = `h-${Math.floor(new Date() * Math.random())}`;

	if (typeof getContext(headingLevel) === 'number') {
		level = Math.min(getContext(headingLevel), 6);
	} else {
		level = 1;
	}

	let test = getContext(counter);

	$: if (browser && $test === 0) {
		$test = 1;
	}

	afterUpdate(() => {
		if (browser && $test) {
			$test = 0;
		}
	});

	const render = (param) => {
		return `
    <h${level} 
      id=${id} 
      class=${wrapperClass ? `heading-tag ${wrapperClass}` : `heading-tag`}
    >
      ${param}
    </h${level}>
  `;
	};
</script>

{@html render(message)}
