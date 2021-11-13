<script>

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable 
   * scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass = ''
  /**
   * @type {Array.<{visibleText: String, route: String}>}
   * an array of objects, each containing the text you want displayed in the menu 
   * and the route you want it linked to
  */
  export let menuItems = [
    { visibleText: "test", route: "/test" },
    { visibleText: "page", route: "/page" }
  ]

  let expanded = false

  function showMenu(event) {
    expanded = !expanded
  }

</script>

<nav class={wrapperClass}>
  <button aria-expanded={expanded} on:click={showMenu}>
    <svg role="img" aria-label="hamburger menu" viewBox="0 0 10 10" width="10" height="10" stroke="black" >
      <path stroke="1" fill="black" d="M0,1 10,1 M0,5 10,5 M0,9 10,9" />
    </svg>
  </button>
  <ul>
    {#each menuItems as { visibleText, route }}
      <li><a href={route}>{visibleText}</a></li>
    {/each}
  </ul>
</nav>

<style>

  /* Properties exposed as CSS variables:
        --nav-width
        --nav-font
        --button-bg-color
        --button-width
        --button-padding
        --ul-bg-color
        --link-width
        --link-padding
        --link-text-decoration
  */

  /* Expose the <nav>'s width property as customizable, since <ul> and <li> will inherit it */
  nav {
    width: 8rem;
    /* font: inherit; */
  }

  /* both <ul> and <li> are "width: 100%;" by default */
  ul {
    /* background-color: inherit; */
    list-style: none;
    max-height: 0;
    visibility: hidden;
    transition: visibility .3s ease-out, max-height .4s ease-out;
  }

  [aria-expanded="true"] ~ ul {
    /* can't transition to height: auto, so use max-height with an unrealistic value */
    max-height: 500px;
    visibility: visible;
  }

  /* --link-width can't be greater than --nav-width */
  a {
    display: inline-block;
    /* text-decoration: none;  Attributes like this should be set globally and only overridden 
    in specific contexts. We don't want every component with links to require this */
    width: 100%;
    padding: 1rem 0;
  }

  button {
    display: block;
    /* margin: var(--button-margin, 0); */
    background-color: transparent;
    border: none;
    cursor: pointer;
    width: 3rem;
    padding: 0;
  }

  svg {
    /* make SVG occupy the full dimensions of the <button> */
    width: 100%;
    height: auto;
  }

  [aria-expanded] path {
    transition: d 0.25s;
  }

  [aria-expanded="true"] path {
    d: path("M1,1 9,9 M5,5 5,5 M1,9 9,1");
  }


</style>