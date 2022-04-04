<script>
  import { intersectionObserver } from '$lib/js/actions'

  let intersecting = false;

  const setIntersecting = () => {
    intersecting = true;
  };
</script>

<div
	use:intersectionObserver={{ once: true, options: { rootMargin: '0px' } }}
	on:intersection={setIntersecting}
  class="render-on-scroll"
>
	<noscript>
		<slot />
	</noscript>
	{#if intersecting}
		<slot />
	{/if}
</div>