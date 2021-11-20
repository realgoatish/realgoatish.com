<script>
	// This component's progressive enhancements change its presentation in the DOM substantially,
	// so it should always be used below the fold to avoid CLS/jank issues
	import { browser } from '$app/env';
	import { onMount } from 'svelte';

	/**
	 * @type {Array<string>}
	 * words or short phrases to appear as the titles of each tab in the Tabbed Interface UI
	 */
	export let sectionTitles = [];

	let tabbed;
	let tablist;
	let tabs;
	let panels;
	let handleTabClicks;
	let handleKeydown;
	let switchTab;

	function enhance(attributeValue) {
		// this can't evaluate to true until client-side JS :)
		if (browser) {
			return attributeValue;
		}
		// all values will return null during SSR, and Svelte won't render those attributes at all :D
		return null;
	}

	onMount(() => {
		tabs = tablist.querySelectorAll('a');
		panels = tabbed.querySelectorAll('[id^="section"]');

		switchTab = (oldTab, newTab) => {
			newTab.focus();
			// Make the active tab focusable by the user (Tab key)
			newTab.removeAttribute('tabindex');
			// Set the selected state
			newTab.setAttribute('aria-selected', 'true');
			oldTab.removeAttribute('aria-selected');
			oldTab.setAttribute('tabindex', '-1');
			// Get the indices of the new and old tabs to find the correct tab panels to show and hide
			let index = Array.prototype.indexOf.call(tabs, newTab);
			let oldIndex = Array.prototype.indexOf.call(tabs, oldTab);
			panels[oldIndex].hidden = true;
			panels[index].hidden = false;
		};

		handleTabClicks = (e) => {
			let currentTab = tablist.querySelector('[aria-selected]');
			if (e.currentTarget !== currentTab) {
				switchTab(currentTab, e.currentTarget);
			}
		};

		handleKeydown = (e) => {
			// Get the index of the current tab in the tabs node list
			let index = Array.prototype.indexOf.call(tabs, e.currentTarget);

			// Determine key pressed
			let dir = e.which === 37 ? index - 1 : e.which === 39 ? index + 1 : null;

			// Switch to the new tab if it exists
			if (dir !== null) {
				e.preventDefault();

				// Find correct tab to focus
				let newIndex;
				if (tabs[dir]) {
					newIndex = dir;
				} else {
					// Loop around if adjacent tab doesn't exist
					newIndex = dir === index - 1 ? tabs.length - 1 : 0;
				}
				switchTab(e.currentTarget, tabs[newIndex]);
				tabs[newIndex].focus();
			}
		};
	});
</script>

<div class="tabbed" bind:this={tabbed}>
	<ul role={enhance('tablist')} bind:this={tablist}>
		{#each sectionTitles as title, i}
			<li role={enhance('presentation')}>
				<a
					on:click|preventDefault={handleTabClicks}
					on:keydown={handleKeydown}
					role={enhance('tab')}
					id={enhance(`tab${i + 1}`)}
					aria-selected={i === 0 ? enhance(true) : null}
					href={`#section${i + 1}`}
				>
					{title}
				</a>
			</li>
		{/each}
	</ul>
	<section
		role={enhance('tabpanel')}
		aria-labelledby={enhance('tab1')}
		id="section1"
	>
		<slot name="tabpanel-first" />
	</section>
	<section
		role={enhance('tabpanel')}
		aria-labelledby={enhance('tab2')}
		id="section2"
		hidden={enhance(true)}
	>
		<slot name="tabpanel-second" />
	</section>
	<section
		role={enhance('tabpanel')}
		aria-labelledby={enhance('tab3')}
		id="section3"
		hidden={enhance(true)}
	>
		<slot name="tabpanel-third" />
	</section>
	<section
		role={enhance('tabpanel')}
		aria-labelledby={enhance('tab4')}
		id="section4"
		hidden={enhance(true)}
	>
		<slot name="tabpanel-fourth" />
	</section>
</div>

<style>
	section[hidden] {
		display: none;
	}

	.tabbed [role='tablist'] {
		padding: 0;
	}

	.tabbed [role='tablist'] li,
	.tabbed [role='tablist'] a {
		display: inline-block;
	}

	.tabbed [role='tablist'] a {
		color: inherit;
		text-decoration: none;
		padding: 0.5rem 1em;
	}

	.tabbed [role='tablist'] [aria-selected] {
		border: 2px solid;
		background: #fff;
		border-bottom: 0;
		position: relative;
		top: 2px;
	}

	.tabbed [role='tabpanel'] {
		border: 2px solid;
		padding: 1.5rem;
	}

	.tabbed [role='tabpanel'] * + * {
		margin-top: 0.75rem;
	}

	.tabbed *:focus {
		outline: 2px solid transparent;
		/* ↑ for WHCM users */
		box-shadow: inset 0 0 0 4px lightBlue;
	}

	@media (max-width: 550px) {
		.tabbed [role='tablist'] li,
		.tabbed [role='tablist'] a {
			display: block;
			position: static;
		}

		.tabbed [role='tablist'] a {
			border: 2px solid #222 !important;
		}

		.tabbed [role='tablist'] li + li a {
			border-top: 0 !important;
		}

		.tabbed [role='tablist'] [aria-selected] {
			position: static;
		}

		.tabbed [role='tablist'] [aria-selected]::after {
			content: '\0020⬅';
		}

		.tabbed [role='tabpanel'] {
			border-top: 0;
		}
	}
</style>
