<script>
	import { browser } from '$app/env';

	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';

	let active;
	let ThemeKey;

	if (browser) {
		ThemeKey = localStorage.getItem('DarkMode');
		if (ThemeKey === 'true') {
			active = true;
		} else if (
			!ThemeKey &&
			matchMedia('(prefers-color-scheme: dark)').matches
		) {
			active = true;
		}
	}

	const toggle = () => {
		active = !active;
		localStorage.setItem('DarkMode', String(active));
	};
</script>

<div class={wrapperClass}>
	<button aria-pressed={active} on:click={toggle}>
		Dark Theme:{' '}
		<span aria-hidden="true">{active ? 'On' : 'Off'}</span>
	</button>
	<!-- 
    1. set "filter: invert(100%)" on the document. 
    2. It only works on elements where background-color properties have been declared, so we use the
      lowest-specificity "*" selector to set inherit on everything without overriding any of the 
      colors we set in our design. 
    3. avoid inverting images & video
  -->
	<style media={active ? 'screen' : 'none'}>
		html {
			filter: invert(100%);
			background: #fefefe;
		}
		* {
			background-color: inherit;
		}
		img:not([src*='.png']),
		video {
			filter: invert(100%);
		}
	</style>
</div>

<style>
	button {
		border: solid 2px;
	}
</style>
