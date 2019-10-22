<script>
import { onMount } from 'svelte';
import algoliasearch from 'algoliasearch/lite';

let searchClient;
let index;

let query = '';
let hits = [];

import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

onMount(() => {
	searchClient = algoliasearch(
		'050Q9I7JU4',
		'd39a178000a6d0adb751524350c881fe'
	);

	index = searchClient.initIndex('joost.meijles.com');

	// Warm up search
	index.search({ query }).then(console.log)
});

// Fires on each keyup in form
async function search() {
	if (query == '') {
		hits = [];
		return;
	}

    const result = await index.search({ query, 
        facetFilters: [ 'kind:page' ]
    });
	hits = result.hits;
}
</script>

<style>
	input {
		border-style: none none solid none;
		border-color: blue;
		width: 60%;
		margin-bottom: 1em;
	}
	input:focus {
		outline: none;
	}
	:global(em) {
		font-weight: bold;
	}
</style>

<input type="text" placeholder="Type to search..." bind:value={query} on:keyup={(search)} />
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
				<span class="icon is-small">
					<i class="fa fa-angle-double-right"></i>
				</span>
			</a>
		</div>
	</article>
{/each}
</section>