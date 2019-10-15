<script>
import { onMount } from 'svelte';
import algoliasearch from 'algoliasearch/lite';

let searchClient;
let index;

let query = '';
let hits = [];

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
	:global(em) {
		font-weight: bold;
	}
	section {
		border: 1px solid black;
	}
</style>

<div>
	<input type="text" bind:value={query} on:keyup={search}>
</div>
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