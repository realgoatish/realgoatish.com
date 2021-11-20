<script>
	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';

	export let message;

	let liveRegion;
	let toggleButton;

	function revealMessage() {
		liveRegion.innerHTML = '';
		window.setTimeout(function () {
			liveRegion.innerHTML = `
        <span class="toggletip-bubble">
          ${message}
        </span>
      `;
		}, 100);

		// Close on outside click
		document.addEventListener('click', function (e) {
			if (toggleButton !== e.target) liveRegion.innerHTML = '';
		});

		// Remove toggletip on ESC
		toggleButton.addEventListener('keydown', function (e) {
			if ((e.keyCode || e.which) === 27) liveRegion.innerHTML = '';
		});

		toggleButton.addEventListener('blur', function (e) {
			liveRegion.innerHTML = '';
		});
	}
</script>

<span
	class={wrapperClass
		? `tooltip-container ${wrapperClass}`
		: 'tooltip-container'}
>
	<button
		type="button"
		data-toggletip-content={message}
		bind:this={toggleButton}
		on:click={revealMessage}
	>
		<span aria-hidden="true">i</span>
		<span class="screen-reader-only">More info</span>
	</button>
	<span role="status" bind:this={liveRegion} />
</span>

<style>
	.tooltip-container {
		position: relative;
		display: inline-block;
	}

	span:global(.toggletip-bubble) {
		display: inline-block;
		position: absolute;
		left: 100%;
		top: 0;
		min-width: 15rem;
		padding: 0.5rem;
		background: #000;
		color: #fff;
	}

	button {
		width: 2em;
		height: 2em;
		border-radius: 50%;
		border: 0.25rem solid transparent;
		background: #000;
		font-family: serif;
		font-weight: bold;
		font-size: inherit;
		color: #fff;
		padding: 0;
	}

	button:focus {
		outline: 0.125rem solid transparent;
		outline-offset: 0.125rem;
		box-shadow: 0 0 0 0.25 skyBlue;
	}
</style>
