<script>
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import SortArrow from '$lib/toolbox/table/SortArrow.svelte'
  import { onMount } from 'svelte'

  /**
   * @type {{ headers: string[], rows: string[][]}}
  */
  export let tableData = {
    headers: ["Name", "Breed", "Nickname", "Age", "Calling Card"],
    rows: [
      ["Bowser", "tuxedo", "bedtime boi", "6", "needy"],
      ["Peaches", "brown tabby", "secret peach", "6(?)", "ninja"],
      ["Joey", "yelloboi", "blondbuddy", "3", "amish"],
      ["Doja", "grey tabby", "fat bebe", "4", "piggyprincess"]
    ]
  }
  /**
   * @type {boolean}
   * 'true' will cause the first item in each tableData 'rows' array to become a row header
  */
  export let rowHeaders = true
  /**
   * @type {string}
   * a caption (visible title) to appear above the table
  */
  export let caption = ''
  /**
   * @type {boolean}
   * toggles the availability of column sorting functionality
  */
  export let sortable = true

  let tableContainer
  let theClientWidth
  $: theScrollWidth = null

  onMount(() => {
    theScrollWidth = tableContainer.scrollWidth
  })

  let sortedBy
  $: sortDir = null
  let ascending

  const sortRowsByIndex = (rows, sortedIndex, sortedDirection) =>
  rows.slice(0).sort((a, b) => {
    if (sortedDirection === 'ascending') {
      return a[sortedIndex] > b[sortedIndex]
        ? 1
        : a[sortedIndex] < b[sortedIndex]
        ? -1
        : 0;
    } else {
      return a[sortedIndex] < b[sortedIndex]
        ? 1
        : a[sortedIndex] > b[sortedIndex]
        ? -1
        : 0;
    }
  });

  const sortBy = i => {
    ascending = sortDir === 'ascending'
    if (i === sortedBy) {
      sortDir = !ascending ? 'ascending' : 'descending'
    } else {
      sortDir = 'ascending'
    }
    sortedBy = i
  }

  $: sortedRows = sortRowsByIndex(tableData.rows, sortedBy, sortDir)

</script>


<div 
  bind:clientWidth={theClientWidth} 
  bind:this={tableContainer} 
  tabindex={theScrollWidth > theClientWidth ? 0 : null}
  class="table-container" 
  role="group" 
  aria-labelledby="table-caption"
>
  <table>
    <caption>
      <HeadingTag message={caption} />
      {#if theScrollWidth > theClientWidth}
        <small>(scroll to see more)</small>
      {/if}
    </caption>
    <tr>
      {#each tableData.headers as header, i}
        <th
          role="columnheader"
          scope="col" 
          key={i}
          aria-sort={sortedBy === i ? sortDir : null}
        >
          {header}
          {#if sortable}
            <button on:click={() => sortBy(i)}>
              <SortArrow sortDir={sortDir} isCurrent={sortedBy === i} />
              <span class="screen-reader-only">
                {`sort by ${header} in ${sortDir !== 'ascending' ? 'ascending' : 'descending'} order`}
              </span>
            </button>
          {/if}
        </th>
      {/each}
    </tr>
    {#each sortedRows as row, i}
      <tr key={i}>
        {@html row.map((cell, i) => 
          (rowHeaders && i < 1) ? (
            `<th scope="row" key=${i}>${cell}</th>`
          ) : (
          `<td key=${i}>${cell}</td>`
          )
        ).join('')}
      </tr>
    {/each}
  </table>
</div>
<div class="lists-container">
  <HeadingTag message={caption} />
  {#each sortedRows as row, i}
    <div key={i}>
      <HeadingTag message={row[0]} />
      <dl>
        {@html tableData.headers.map((header, i) =>
          (i > 0) ? (
            `<dt>${header}</dt>
            <dd>${row[i]}</dd>`
          ) : null
        ).join('')}
      </dl>
    </div>
  {/each}
</div>


<style>

  button {
    background: #fff;
    color: #000;
    border: 0;
    padding: .125rem .5rem;
    border-radius: .25rem;
    vertical-align: middle;
    margin-left: .333rem;
  }

  button:focus {
    box-shadow: 0 0 0 4px #1e90ff;
    outline: none;
  }

  div :global([role="columnheader"] svg) {
    stroke: currentColor;
    stroke-width: 20;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    width: .5rem;
    height: 1.5em;
  }

  .table-container {
    overflow-x: auto;
    text-align: left;
    display: none;
  }

  .lists-container {
    display: block;
  }

  table {
    border-collapse: collapse;
  }

  div :global(th),
  div :global(td) {
    padding: 0.25rem 0.5rem;
    border: 2px solid;
  }

  th[scope="col"],
  div :global(th[scope="row"]) {
    color: #fff;
    background: #000;
  }

  /* header component is dynamic and context-aware, but the downside is not being sure which tag we need to target in parent components */
  div:global(.lists-container > * > h2), 
  div:global(.lists-container > * > h3), 
  div:global(.lists-container > * > h4), 
  div:global(.lists-container > * > h5), 
  div:global(.lists-container > * > h6) {
    background: #000;
    color: #fff;
    padding: 0.5rem;
  }

  div dl {
    display: flex;
    flex-wrap: wrap;
  }

  div :global(dl > *) {
    flex: 0 0 50%;
  }

  div :global(dt), div :global(th) {
    font-weight: 700;
  }

  @media (min-width: 400px) {
    .table-container {
      display: block;
    }

    .lists-container {
      display: none;
    }
  }
</style>