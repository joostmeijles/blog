<script>
    import Modal from './Modal.svelte';
    import Search from './Search.svelte';

    let showModal = false;
</script>

<button on:click="{() => showModal = true}">
    🔍
</button>
 
{#if showModal}
    <Modal on:close="{() => showModal = false}">
        <Search/>
    </Modal>
{/if}
