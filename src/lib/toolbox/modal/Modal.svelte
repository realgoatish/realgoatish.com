<script context="module">

  let allOtherElements
  let focusableElements
  let body

  export function prepareDOM() {

    // Parent component imports this function and calls it upon a triggering event. This function removes the rest of document.body from keyboard navigation and prevents focus on other elements, preparing the DOM for this component to be appended
    
    body = document.body
    body.setAttribute('position', 'relative')
    allOtherElements = document.querySelectorAll('body > *')
    focusableElements = document.querySelectorAll('a:not([tabindex="-1"]), button:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), details:not([tabindex="-1"]), [contenteditable]:not([tabindex="-1"])')

    Array.prototype.forEach.call(allOtherElements, el => {
      el.setAttribute('inert', 'inert')
      el.setAttribute('aria-hidden', 'true')
    })

    Array.prototype.forEach.call(focusableElements, el => {
      el.setAttribute('tabindex', '-1')
    })
  }

</script>

<script>
  import Imposter from '$lib/toolbox/layout-primitives/Imposter.svelte'
  import Stack from '$lib/toolbox/layout-primitives/Stack.svelte'
  import { onMount } from 'svelte'

  /**
   * @type {string}
   * the message you want the modal to display to users
  */
  export let dialogMessage = "default prompt value from Modal.svelte"

  /**
   * @type {boolean}
   * whether to position the element relative to the viewport
  */
  export let fixed

  /**
   * @type {boolean}
   * allow horizontal scrolling within the modal
   *  - this prop generally shouldn't be needed, since modals shouldn't have a lot of content
  */
  export let contain

  let dialog
  let overlay
  let dialogLabel
  let close
  let okay
  let trigger

  onMount(() => {

    const unique = +new Date()

    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-labelledby', `q-${unique}`)
    dialogLabel.setAttribute('id', `q-${unique}`)

    close = () => {
      Array.prototype.forEach.call(allOtherElements, el => {
        if (el !== dialog) {
          el.removeAttribute('inert')
          el.removeAttribute('aria-hidden')
        }
      })
      Array.prototype.forEach.call(focusableElements, el => {
        el.removeAttribute('tabindex')
      })
      overlay.parentNode.removeChild(overlay)
      // TODO this won't work if the modal is triggered by something that was removed from the DOM e.g. deleting an item from a TODO list
      trigger.focus()
    }

    // get a reference to the last active element before the modal was opened, so that keyboard users can be returned to the same place after the modal is closed with trigger.focus()
    trigger = document.activeElement
    
    // focus the "okay" button inside the modal
    okay.focus()

    // retain ability for keyboard users to use ESC key to close the modal
    dialog.addEventListener('keydown', e => {
      if (e.keyCode === 27) {
        e.preventDefault()
        close()
      }
    })
  })

</script>

<div class="overlay" bind:this={overlay}>
  <Imposter bind:imposterWrapperDiv={dialog} --imposter-margin="var(--s0)" {contain} {fixed}>
    <Stack>
      <p slot="stack-first-item" bind:this={dialogLabel}>{dialogMessage}</p>
      <div slot="stack-second-item" class="modal-buttons">
        <button class="okay" on:click={close} bind:this={okay}>Okay</button>
        <button class="cancel" on:click={close}>Cancel</button>
      </div>
    </Stack>
  </Imposter>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
    z-index: 99;
    animation-name: fadeOverlay;
    animation-duration: 0.25s;
    animation-fill-mode: forwards;
    animation-timing-function: ease-out;
  }

  @keyframes fadeOverlay {
    0% { background: hsla(0, 0%, 0%, 0); }
    100% { background: hsla(0, 0%, 0%, 0.33); }
  }

  /* TODO - this should be scoped - target div :global([role="dialog"]) */
  /* TODO - these CSS variables look outdated - how should you handle these settings for intermediary comps like this? 
        - padding
        - border
        - border-radius
        - box-shadow (filter: drop-shadow?) */
  /* TODO - ^ global card/box properties, how to best feed them down into this comp & Imposter? */

  :global([role="dialog"]) {
    background: #fff;
    padding: var(--card-padding, 1rem);
    border: var(--card-border, 1px solid #aaa);
    border-radius: var(--card-border-radius, 2px);
    box-shadow: var(--card-box-shadow, 2px 2px 8px rgba(0, 0, 0, 0.1));
  }

  .modal-buttons {
    display: flex;
    justify-content: space-evenly;
  }

  /* TODO - same problem as above - button color & padding should be set by their context - in a mod, which sets styles from global options (button-primary, button-secondary, etc.) */
  .modal-buttons button {
    background: blue;
    color: #eafdf8;
    padding: 0.5rem;
    cursor: pointer;
  }
</style>