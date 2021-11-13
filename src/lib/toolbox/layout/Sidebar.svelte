<script>

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''
  /**
   * @type {string}
   * configures which side of the screen you want the sidebar to be on vs. the main content
  */
  export let sidebar = "left"
</script>

<div class={wrapperClass
  ? `with-sidebar ${wrapperClass}`
  : "with-sidebar"
} >
  <div class:mainContent={sidebar !== "left"}>
    <slot name="sidebar-content" />
  </div>
  <div class:mainContent={sidebar !== "right"}>
    <slot name="main-content" />
  </div>
</div>

<style>
  /* Properties exposed as CSS variables:
      --sidebar-spacing => used for spacing between sidebar-content and main-content
      --sidebar-width => without the current 20rem default value, it will default to the width of its contents
      --sidebar-content-content-min-width
  */

  .with-sidebar {
    overflow: hidden;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sidebar-spacing, 1.5rem);
  }

  .with-sidebar :not(.mainContent) {
    flex-basis: var(--sidebar-width, 20rem);
    flex-grow: 1;
  }

  .with-sidebar .mainContent {
    flex-basis: 0;
    flex-grow: 999;
    min-width: var(--sidebar-main-content-min-width, 50%);
  }
</style>