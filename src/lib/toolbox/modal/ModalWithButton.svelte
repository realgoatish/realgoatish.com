<script>
	import Center from '$lib/toolbox/layout/Center.svelte';
	import Modal, { prepareDOM } from './Modal.svelte';

	/**
	 * @type {boolean}
	 * allow horizontal scrolling within the modal
	 *  - this prop generally shouldn't be needed, since modals shouldn't have a lot of content
	 */
	export let contain;

	/**
	 * @type {boolean}
	 * whether to position the element relative to the viewport
	 */
	export let fixed;

	/**
	 * @type {string}
	 * the message you want the modal to display to users
	 */
	export let prompt = 'default prompt value from ModalWithButton.svelte';

	const displayDialog = (message, bool, fixed) => {
		prepareDOM();
		const modal = new Modal({
			target: document.body,
			props: {
				dialogMessage: message,
				contain: bool,
				fixed: fixed
			}
		});
	};
</script>

<Center>
	<button id="showModal" on:click={displayDialog(prompt, contain, fixed)}
		>Show Modal</button
	>
</Center>

<style>
	button#showModal {
		background: blue;
		color: #eafdf8;
		padding: 0.5rem;
		cursor: pointer;
	}
</style>
