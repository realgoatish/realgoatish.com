<script>
  import Section from '$lib/toolbox/section/Section.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'

  let status
  let todosUl
  $: userInput = null

  /**
   * @type {string}
   * set an optional class name for the top-level element of this component to enable scoped styling of each component instance from outside (in parent components or pages)
  */
  export let wrapperClass
  /**
   * @type {Array.<{name: string, done: boolean}>}
   * provide an array of objects with properties for each todo's name and status
  */ 
  export let todos = [
    { name: "Pick up kids from school", done: true },
    { name: "Learn Haskell", done: false },
    { name: "Sleep", done: false }
  ]

  function addedFeedback() {
    todos = [...todos, { name: userInput, done: false}]
    status.textContent = `${userInput} added.`
    userInput = ''
  }

  function deletedFeedback(i, name) {
    todos.splice(i, 1)
    todos = todos
    // set focus to the heading of the Todos Section so screen reader output is contextual
    todosUl.previousElementSibling.setAttribute('tabindex', '-1')
    todosUl.previousElementSibling.focus()
    status.textContent = `${name} deleted`
  }

</script>

<Section {wrapperClass}>
  <HeadingTag message={"My Todo List"}/>
  <ul bind:this={todosUl}>
    {#each todos as todo, index}
      <li>
        <label for={`todo-${index}`}>
          <input type="checkbox" id={`todo-${index}`} bind:checked={todo.done} class="screen-reader-only">
          <span class="tick">
            <svg id="tick" viewBox="0 0 10 10">
              <polyline stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none" points="1,5 4,8 9,2"></polyline>
            </svg>
          </span>
          <span class="text">
            {todo.name}
          </span>
        </label>
        <button aria-label={`delete ${todo.name}`} on:click={deletedFeedback(index, todo.name)}>
          <svg id="bin-icon" viewBox="0 0 50 50">
            <path fill="currentColor" d="m20.651 2.3339c-.73869 0-1.3312.59326-1.3312 1.3296v2.5177h-6.3634c-.73887 0-1.3314.59331-1.3314 1.3295v1.1888c0 .73639.59249 1.3289 1.3312 1.3289h7.6948 8.8798 7.6948c.73869 0 1.3312-.59249 1.3312-1.3289v-1.1888c0-.73639-.59249-1.3296-1.3312-1.3296h-6.3634v-2.5177c0-.73639-.59249-1.3296-1.3312-1.3296h-8.8798zm-5.6786 11.897c-1.7775 0-3.2704 1.4889-3.2704 3.274v27.647c0 1.7775 1.4928 3.2704 3.2704 3.2704h20.783c1.7775 0 3.2704-1.4928 3.2704-3.2704v-27.647c0-1.7852-1.4928-3.274-3.2704-3.274h-20.783zm1.839 3.4895h1.1696c.73869 0 1.3389.60018 1.3389 1.3466v24.247c0 .74638-.60018 1.3389-1.3389 1.3389h-1.1696c-.73869 0-1.3389-.59249-1.3389-1.3389v-24.247c0-.74638.60018-1.3466 1.3389-1.3466zm7.6948 0h1.1696c.73869 0 1.3389.60018 1.3389 1.3466v24.247c0 .74638-.60018 1.3389-1.3389 1.3389h-1.1696c-.73869 0-1.3389-.59249-1.3389-1.3389v-24.247c0-.74638.60018-1.3466 1.3389-1.3466zm7.6948 0h1.1696c.73869 0 1.3389.60018 1.3389 1.3466v24.247c0 .74638-.60018 1.3389-1.3389 1.3389h-1.1696c-.73869 0-1.3389-.59249-1.3389-1.3389v-24.247c0-.74638.60018-1.3466 1.3389-1.3466z"></path>
          </svg>
          <span class="screen-reader-only">delete {todo.name}</span>
        </button>
      </li>

    {/each}
  </ul>
  <div class="empty-state">
    <p>Either you've done everything already or there are still things to add to your list. Add your first todo {`\u2193`}</p>
  </div>
  <form>
    <label for="add-todo" class="screen-reader-only">Add a todo item</label>
    <input bind:value={userInput} id="add-todo" type="text" placeholder="E.g. Adopt an owl" aria-invalid={userInput === '' ? true : false}>
    <button on:click|preventDefault|stopPropagation={addedFeedback} type="submit" disabled={userInput === '' ? true : false}>Add</button>
  </form>
  <div bind:this={status} class="screen-reader-only" role="status" aria-live="polite" ></div>
</Section>

<style>
  .empty-state, ul:empty {
    display: none;
  }

  ul:empty + .empty-state {
    display: block
  }

  li {
    display: flex;
    align-items: center;
    margin-top: 1rem;
  }

  li label {
    margin-right: auto;
  }

  li button {
    background: transparent;
    margin-left: 0.5rem;
    color: #000;
  }

  li button svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .tick {
    display: inline-block;
    vertical-align: middle;
    border-radius: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    border: 0.125rem solid;
    margin-right: 0.25rem;
  }

  .tick svg {
    display: none;
    width: 100%;
    height: 100%;
    padding: 0.125rem;
  }

  :checked + .tick svg {
    display: inline-block;
  }

  :checked ~ .text {
    text-decoration: line-through;
  }

  form {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  input,
  [type="submit"] {
    border: 0.125rem solid;
    border-radius: 0.25rem;
    line-height: 1;
    font-size: inherit;
  }

  [type="text"] {
    flex: 3;
    margin-right: 0.25rem;
    padding: 0.25rem;
  }

  [type="submit"] {
    background: #000;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border: 2px solid #000;
  }

  [type="submit"]:disabled {
    opacity: 0.33;  
  }
</style>