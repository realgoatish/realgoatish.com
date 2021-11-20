<script>
	/**
	 * @type {string}
	 * the message on the button
	 */
	export let text;

	let pressedState = false;
</script>

<button
	type="button"
	aria-pressed={pressedState}
	on:click={() => (pressedState = !pressedState)}>{text}</button
>

<style>
	/* Exposed as CSS variables:
      --button-focus-color
  */

	/* this component should inherit whatever global <button> styles you set for your site design */

	[aria-pressed] {
		position: relative;
		top: -0.25rem;
		left: -0.25rem;
		box-shadow: 0.125em 0.125em 0 #fff, 0.25em 0.25em #000;
	}

	[aria-pressed]:focus {
		outline: 2px solid transparent;
		box-shadow: 0 0 0 0.25rem var(--button-focus-color, SkyBlue);
		outline: 2px solid transparent;
	}

	/* visual feedback to convey state change when the toggle is selected */
	[aria-pressed='true'] {
		box-shadow: inset 0 0 0 0.15rem #000, inset 0.25em 0.25em 0 #fff;
	}

	[aria-pressed='true']:focus {
		box-shadow: 0 0 0 0.25rem var(--button-focus-color, SkyBlue),
			inset 0 0 0 0.15rem #000, inset 0.25em 0.25em 0 #fff;
	}

	/* MSHCM removes box-shadows, so this will append a ✓ onto the button text to provide better visual feedback
  when the button is pressed */
	@media (-ms-high-contrast: active) {
		[aria-pressed='true']::after {
			content: '\0020✓';
		}
	}
</style>
