<script>
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Frame from '$lib/toolbox/layout/Frame.svelte'

  import { Carousel } from './carousel.js'
  import { onMount } from 'svelte'

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass

  /**
   * @type {Array.<{arr: Array.<{format: string, width: (string|number), height: (string|number), src: string}>, altText: string}>}
   * an array of carousel image objects, each with the following properties:
   *  - arr: contains an array of procesed image objects to enable responsive images, 
   * each with these properties
   *    - format
   *    - width
   *    - height
   *    - src
   *  - altText: to describe the image
  */
  export let images

  /**
   * @type {string}
   * an aria-label attribute for the entire carousel
  */
  export let carouselAriaLabel = "My favorite unsplash images"

  /* Initialize Carousel Tablists */

  let firstCarouselItem

  onMount(() => {
    window.addEventListener('load', function () {

      firstCarouselItem = document.querySelector('[aria-label="1 of 5"]')
      console.log(firstCarouselItem)
      firstCarouselItem.classList.add('active')

      let carousels = document.querySelectorAll('.carousel');
    
      for (let i = 0; i < carousels.length; i++) {
        let carousel = new Carousel(carousels[i]);
        carousel.init();
      }
    }, false);
  })

</script>

<section id="myCarousel"
  class={wrapperClass
  ? `carousel ${wrapperClass}`
  : "carousel"}
  aria-roledescription="carousel"
  aria-label={carouselAriaLabel}
>
  <div class="carousel-inner">
    <div class="controls">
      <button class="rotation pause" aria-label="Stop automatic slide show">
        <svg width="42"
             height="34"
             version="1.1"
             xmlns="http://www.w3.org/2000/svg">
          <rect class="background"
                x="2"
                y="2"
                rx="5"
                ry="5"
                width="38"
                height="24"></rect>
          <rect class="border"
                x="4"
                y="4"
                rx="5"
                ry="5"
                width="34"
                height="20"></rect>
          <polygon class="pause" points="17 8 17 20"></polygon>
          <polygon class="pause" points="24 8 24 20"></polygon>
          <polygon class="play" points="15 8 15 20 27 14"></polygon>
        </svg>
      </button>
      <button class="previous"
              aria-controls="myCarousel-items"
              aria-label="Previous Slide">
        <svg width="42"
             height="34"
             version="1.1"
             xmlns="http://www.w3.org/2000/svg">
          <rect class="background"
                x="2"
                y="2"
                rx="5"
                ry="5"
                width="38"
                height="24"></rect>
          <rect class="border"
                x="4"
                y="4"
                rx="5"
                ry="5"
                width="34"
                height="20"></rect>
          <polygon points="9 14 21 8 21 11 33 11 33 17 21 17 21 20"></polygon>
        </svg>
      </button>
      <button class="next"
              aria-controls="myCarousel-items"
              aria-label="Next Slide">
        <svg width="42"
             height="34"
             version="1.1"
             xmlns="http://www.w3.org/2000/svg">
          <rect class="background"
                x="2"
                y="2"
                rx="5"
                ry="5"
                width="38"
                height="24"></rect>
          <rect class="border"
                x="4"
                y="4"
                rx="5"
                ry="5"
                width="34"
                height="20"></rect>
          <polygon points="9 11 21 11 21 8 33 14 21 20 21 17 9 17"></polygon>
        </svg>
      </button>
    </div>
    <div id="myCarousel-items"
         class="carousel-items"
         aria-live="off">
      {#each images as image, i}
        <div class="carousel-item"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of 5`}> <!-- <== need to make this dynamic-->
          <div class="carousel-image">
            <a href="#">
              <Frame --numerator="1" --denominator="1" lazy={false}>
                <Image 
                  images={image.arr}
                  altText={image.altText}
                />
              </Frame>
            </a>
          </div>
          {#if image.carouselCaptions}
            <div class="carousel-caption">
              <h3>
                <a href="#" id={`carousel-label-${i}`}>
                  This is a test motherfucker
                </a>
              </h3>
              {#if image.carouselCaptions[1]}
                <div class="hidden-xs hidden-sm">
                  <p>
                    <span class="contrast">
                      {image.carouselCaptions[1]}
                    </span>
                  </p>
                </div>
              {/if}
            </div>
            <!-- .carousel-caption -->
          {/if}
        </div>
        <!-- .item -->
      {/each}
  </div>
</section>

<style>

  /* 
    Exposed as CSS variables:
      --carousel-max-width
      --carousel-max-height
      --carousel-width
      --carousel-height
  */

  /* .carousel */

  .carousel .carousel-inner {
    position: relative;
  }

  :global(.carousel .carousel-item) {
    display: none;
    max-height: var(--carousel-max-width, none);
    max-width: var(--carousel-max-height, none);
    position: relative;
    overflow: hidden;
    width: var(--carousel-width, 100%);
    height: var(--carousel-height, 100vh);
  }

  :global(.carousel .carousel-item.active) {
    display: block;
  }

  /* More like bootstrap, less accessible */

  .carousel .carousel-items {
    border: solid 2px transparent;
  }

  :global(.carousel .carousel-items.focus) {
    border-color: white;
    outline: solid 3px #005a9c;
  }

  :global(.carousel .carousel-item .carousel-image a img) {
    height: 100%;
    width: 100%;
  }

  .carousel .carousel-item .carousel-caption a {
    text-decoration: underline;
  }

  .carousel .carousel-item .carousel-caption a,
  .carousel .carousel-item .carousel-caption span.contrast {
    display: inline-block;
    background-color: rgba(0, 0, 0, 0.65);
    padding-left: 0.25em;
    padding-right: 0.25em;
    border-radius: 5px;
    border: 2px solid transparent;
    margin: 0;
  }

  .carousel .carousel-item .carousel-caption h3 a {
    color: #fff;
    font-weight: 600;
  }

  .carousel .carousel-item .carousel-caption a:hover,
  .carousel .carousel-item .carousel-caption span.contrast:hover {
    background-color: rgba(0, 0, 0, 1);
    margin: 0;
  }

  .carousel .carousel-item .carousel-caption a:focus {
    background-color: rgba(0, 0, 0, 1);
    border-color: #fff;
    margin: 0;
  }

  .carousel .carousel-item .carousel-caption p {
    font-size: 1em;
    line-height: 1.5;
    margin-bottom: 0;
  }

  .carousel .carousel-item .carousel-caption {
    position: absolute;
    right: 15%;
    bottom: 0;
    left: 15%;
    padding-top: 20px;
    padding-bottom: 20px;
    color: #fff;
    text-align: center;
  }

  /* Shared CSS for Pause, Next and Previous Slide Controls */

  .carousel .controls button {
    padding: 0;
    position: absolute;
    top: 5px;
    z-index: 10;
    background-color: transparent;
    border: none;
    outline: none;
  }

  .carousel .controls button svg rect.background {
    stroke: black;
    fill: black;
    stroke-width: 1px;
    opacity: 0.6;
  }

  .carousel .controls button svg rect.border {
    fill: transparent;
    stroke: transparent;
    stroke-width: 2px;
  }

  /* Next and Previous Slide Controls */

  .carousel .controls button svg polygon {
    stroke: white;
    fill: white;
    stroke-width: 2;
    opacity: 1;
  }

  .carousel .controls button.previous {
    right: 50px;
  }

  .carousel .controls button.next {
    right: 6px;
  }

  /* Pause Control */

  .carousel .controls button.rotation {
    left: 6px;
  }

  .carousel .controls button.rotation svg polygon.pause {
    stroke-width: 4;
    fill: transparent;
    stroke: transparent;
  }

  .carousel .controls button.rotation svg polygon.play {
    stroke-width: 1;
    fill: transparent;
    stroke: transparent;
  }

  .carousel .controls button.rotation.pause svg polygon.pause,
  .carousel .controls button.rotation.play svg polygon.play {
    fill: white;
    stroke: white;
  }

  /* Common focus styling for svg buttons */

  .carousel .controls button:focus rect.background,
  .carousel .controls button:hover rect.background,
  .carousel .controls button:focus rect.border,
  .carousel .controls button:hover rect.border {
    fill: #005a9c;
    stroke: #005a9c;
    opacity: 1;
  }

  .carousel .controls button:focus rect.border {
    stroke: white;
  }

</style>