<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<style>
	.modal-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.3);
		z-index: 5;
	}

	.modal {
		position: absolute;
		left: 20px;
		top: 5px;
		width: 95%;
		overflow: auto;
		padding: 1em;
		border-radius: 0.2em;
		background: white;
		z-index: 10;
	}

	button {
		float: right;
		border: none;
		background: none;
		font-weight: 900;
	}
</style>

<div class='modal-background' on:click='{() => dispatch("close")}' />

<div class='modal'>
	<button on:click='{() => dispatch("close")}'>X</button>
	<slot></slot>
</div>
