<script>
    import Modal from './Modal.svelte';
    import Search from './Search.svelte';

    let showModal = false;
</script>

<style>
    button, button:focus, button:hover {
        border: none;
        background: none;
        padding: 0px;
    }

    img {
        height: 24px;
        width: 24px;
        padding: 0px;
        margin: 0px;
    }
</style>

<button on:click={() => showModal = true}>
    <img src="/magnifying-glass.png" alt="Search" />
</button>
 
{#if showModal}
    <Modal on:close={() => showModal = false}>
        <Search on:close={() => showModal = false}/>
    </Modal>
{/if}
