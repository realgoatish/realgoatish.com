<script>

  export let mobile = ''
  export let tablet = ''
  export let desktop = ''
  export let fullSize = ''

</script>

<div class="bg" style={`--mobile-image: url(${mobile}); --tablet-image: url(${tablet}); --desktop-image: url(${desktop}); --fullSize-image: url(${fullSize});`}>
  <div>
    <slot />
  </div>
</div>

<style>

  /* .bg, div:not(.bg) {
    width: 100%;
    min-height: 100%;
  } */

  div:not(.bg) {
    background-image: var(--mobile-image);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
  }

  @media (min-width: 400px) {
    div:not(.bg) {
      background-image: var(--tablet-image);
    }
  }

  @media (min-width: 800px) {
    div:not(.bg) {
      background-image: var(--desktop-image)
    }
  }

  @media (min-width: 1200px) {
    div:not(.bg) {
      background-image: var(--fullSize-image)
    }
  }

</style>