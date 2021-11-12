<script>
  // This component wraps its slot content in an <a> tag

  /**
   * @type {string}
   * URL you want to link to
  */
  export let href

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''

</script>

<a sveltekit:noscroll {href} class={wrapperClass}>
  <slot></slot>
</a>
