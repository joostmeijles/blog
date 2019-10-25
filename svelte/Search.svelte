<script>
import { onMount, createEventDispatcher } from 'svelte';
import algoliasearch from 'algoliasearch/lite';

let searchClient;
let index;

let query = '';
let hits = [];

const dispatch = createEventDispatcher();

onMount(() => {
    searchClient = algoliasearch(
        '050Q9I7JU4',
        'd39a178000a6d0adb751524350c881fe'
    );

    index = searchClient.initIndex('joost.meijles.com');

    // Warm up search
    index.search({ query });
});

// Fires on each keyup in form
async function handle(key) {
    if (key.keyCode == 27) {
        dispatch("close");
        return;
    }

    search();
}

async function search() {
    if (query == '') {
        hits = [];
        return;
    }

    const result = await index.search({ 
        query, 
        facetFilters: [ 'kind:page' ],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>'
    });
    
    hits = result.hits;
}

function init(element) {
    element.focus();
}
</script>

<style>
    input {
        border-style: none none solid none;
        border-color: #2077b2;
        width: 60%;
        margin-bottom: 1em;
    }
    input:focus {
        outline: none;
    }
    :global(mark) {
        background-color: yellow;
    }
</style>

<input type="text" placeholder="Type to search..." bind:value={query} on:keyup={(k) => handle(k)} use:init />
<section>
{#each hits as hit}
    <article>
        <h1 class="title">
            <a href={hit.permalink}>{hit.title}</a>
        </h1>
        <div class="content summary">
            <p contenteditable bind:innerHTML={hit._highlightResult.summary.value}></p>
            <a class="button is-link" href={hit.permalink} >
                Read more
            </a>
        </div>
    </article>
{/each}
</section>