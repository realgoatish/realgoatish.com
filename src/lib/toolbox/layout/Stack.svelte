<script>
	import { onMount } from 'svelte';

	/**
	 * @type {string}
	 * set an optional class name for the top-level element of this component to enable
	 * scoped styling of each component instance from outside (in parent components or pages)
	 */
	export let wrapperClass = '';
	/**
	 * @type {number | null}
	 * Insert 'margin-bottom: auto;' after the -nth child of the Stack
	 */
	export let splitAfter = null;
	let stack;

	onMount(() => {
		if (splitAfter) {
			stack.children[splitAfter - 1].classList.toggle('split-after');
		}
	});
</script>

<div class={wrapperClass 
  ? `stack ${wrapperClass}` 
  : 'stack'} 
  bind:this={stack}>
	<slot />
</div>

<style>
	/* 
    Exposed as CSS variables:
      --space
  */
	.stack {
		display: flex;
		flex-flow: column nowrap;
		justify-content: flex-start;
	}

	.stack,
	.stack :global(*) {
		border-radius: inherit;
	}

	/* margins should already be cleared by your app.css resets, but in case it's not */
	.stack > :global(*) {
		margin-top: 0;
		margin-bottom: 0;
	}

	.stack > :global(* + *) {
		margin-top: var(--space, 1rem);
	}

  .stack > :global(.split-after) {
    margin-bottom: auto;
  }

	/* .stack > :global(.split-after) {
		height: 100%;
		display: flex;
	} */
</style>
