<script>
	/**
	 * @type {{uniqueId: String, visibleText: String}}
	 * uniqueId is used to tether the visibleText's span to an aria-labelledby attribute for the button
	 */
	export let item;
	let checkedState = false;
</script>

<li>
	<span id={item.uniqueId}>{item.visibleText}</span>
	<button
		role="switch"
		aria-checked={checkedState}
		aria-labelledby={item.uniqueId}
		on:click={() => (checkedState = !checkedState)}
	>
		<span>on</span>
		<span>off</span>
	</button>
</li>

<style>
	[role='switch'][aria-checked='true'] :first-child,
	[role='switch'][aria-checked='false'] :last-child {
		background: #000;
		border: 2px solid white;
		color: #fff;
	}

	li {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		align-items: center;
	}

	button {
		padding: 0.25rem 0.5rem;
		border: 0.25rem solid;
		border-radius: 0.25rem;
		font-size: inherit;
	}

	[aria-checked] span {
		font-size: 0.75rem;
		font-weight: bold;
		display: inline-block;
		border-radius: 0.25rem;
		padding: 0.25rem;
	}
</style>
