<script>

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''

</script>

<div class={wrapperClass
  ? `center ${wrapperClass}`
  : "center"
}>
  <slot />
</div>

<style>
  /* 
    Exposed as CSS variables:
      --measure
      --gutters
  */

  .center {
    box-sizing: content-box;
    margin-left: auto;
    margin-right: auto;
    max-width: var(--measure, none);
    padding-left: var(--gutters, 0);
    padding-right: var(--gutters, 0);
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>