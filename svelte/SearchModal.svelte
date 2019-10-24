<script>
    import Modal from './Modal.svelte';
    import Search from './Search.svelte';

    let showModal = false;
</script>

<style>
    button, button:focus, button:hover {
        border: none;
        background: none;
    }

    img {
        height: 64px;
        width: 64px;
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
