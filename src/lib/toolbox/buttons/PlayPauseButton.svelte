<script>
	/**
	 * @type {boolean}
	 * toggles 'aria-pressed' attribute and play/pause icon appearance
	 */
	let pressedState = false;
</script>

<button
	type="button"
	aria-pressed={pressedState}
	on:click={() => (pressedState = !pressedState)}
>
	<span aria-hidden="true">{pressedState ? '\u23f8' : '\u25B6'}</span>
	<span class="screen-reader-only">play</span>
</button>
