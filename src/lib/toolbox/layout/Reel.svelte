<script>
  import { onMount } from 'svelte'
  import { detectTouch } from '$lib/js/actions.js'

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''
  /**
   * @type {boolean}
   * div#instructions will always be present for screen readers via div#reel's aria-describedby="instructions"
   * attribute. Set this prop to 'true' if you want to display those instructions as a visual aid for
   * users on hover, on focus, and for touch users
  */
  export let visualInstructions = false

  onMount(() => {

    const className = 'reel';
    const reels = Array.from(document.querySelectorAll(`.${className}`));
    const toggleOverflowClass = elem => {
      elem.classList.toggle('overflowing', elem.scrollWidth > elem.clientWidth);
    };

    for (let reel of reels) {
      if ('ResizeObserver' in window) {
        new ResizeObserver(entries => {
          toggleOverflowClass(entries[0].target);
        }).observe(reel);
      }

      if ('MutationObserver' in window) {
        new MutationObserver(entries => {
          toggleOverflowClass(entries[0].target);
        }).observe(reel, {childList: true});
      }
    }
  })


</script>

<div use:detectTouch class={wrapperClass}>
  <div class="reel" role="region" aria-labelledby="reel-label" tabindex="0" aria-describedby="instructions">
    <!-- use a visually hidden text node to announce the reel to screen readers since aria-label has i18n problems -->
    <span id="reel-label" aria-hidden="true" style="width:0;height:0;">Gallery</span>
    <!-- wrapper <divs> are required for each child you slot in as a desired element in the Reel's display. I prefer this over having to hardcode a predetermined number of named slots -->
    <slot />
  </div>
    <div id="instructions" style={visualInstructions ? null : "visibility:hidden;"}>
      <span aria-hidden="true">←</span>
      scroll for more
      <span aria-hidden="true">→</span>
    </div>
</div>


<style>

  /* Exposed as CSS variables
    ** --color and --background-color only control the scrollbar and its track **
    --color 
    --background-color
    --space => this controls the space between reel children *and* the space between the children &
    scrollbar
  */

  #instructions {
    visibility: hidden;
    margin-top: 0.5rem;
    text-align: center;
  }

  .reel {
    display: flex;
    /* height: var(--reel-height, auto); */
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-color: var(--color, #fff) var(--background-color, #000);
  }

  .reel::-webkit-scrollbar {
    height: 1rem;
  }

  .reel::-webkit-scrollbar-track {
    background-color: var(--background-color, #000);
  }

  .reel::-webkit-scrollbar-thumb {
    background-color: var(--background-color, #000);
    background-image: linear-gradient(
      var(--background-color, #000) 0, 
      var(--background-color, #000) 25%, 
      var(--color, #fff) 25%, 
      var(--color, #fff) 75%, 
      var(--background-color, #000) 75%
    );
  }

  /* set flex-grow, flex-shrink & flex-basis for children of the reel, but exclude the visually hidden <span> */
  .reel > :global(*:not(span)) {
    flex: 0 0 25rem;
  }

  .reel > :global(img) {
    height: 100%;
    flex-basis: auto;
    width: auto;
  }

  /* put spacing between the children of the reel, but exclude the visually hidden <span> */
  .reel > :global(*:not(span) + *) {
    margin-left: var(--space, 1rem);
  }

  .reel:global(.overflowing) {
    padding-bottom: var(--space, 1rem);
  }

  /* add a focus style, since we're using tabindex=0 to make the reel focusable */
  [aria-labelledby="reel-label"]:focus {
    outline: 4px solid Skyblue;
  }

  /* show a visual directive for how to use the slider on hover, focus, and if the user is using a touch interface. These styles are overridden if the component's prop visibleInstructions=false */
  [aria-labelledby="reel-label"]:hover + #instructions,
  [aria-labelledby="reel-label"]:focus + #instructions,
  :global(.touch #instructions) {
    visibility: visible;
  }

</style>