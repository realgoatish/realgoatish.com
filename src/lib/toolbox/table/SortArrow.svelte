<script>
	/**
	 * @type {string}
	 * current selected sorting direction prop designed to conditionally alter the SVG
	 * (the direction in which the arrow points - 'ascending' or 'descending')
	 */
	export let sortDir = '';
	/**
	 * @type {boolean}
	 * will be passed in from the parent Table component to indicate that
	 * this SVG lives in the column the user selected to sort
	 */
	export let isCurrent = false;

	$: ascending = sortDir === 'ascending';
</script>

{@html `
<svg viewbox="0 0 100 200" width="100" height="200">
  ${
		!(!ascending && isCurrent)
			? `<polyline points="20 50, 50 20, 80 50" />`
			: ``
	}
  <line x1="50" y1="20" x2="50" y2="180" />
  ${
		!(ascending && isCurrent)
			? `<polyline points="20 150, 50 180, 80 150" />`
			: ``
	}
</svg>
  `}
