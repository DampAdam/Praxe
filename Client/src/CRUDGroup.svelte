<script>
    import Crud from "./CRUD.svelte";
    import { Hasura } from "./Hasura";
    export let name;
</script>

{#each Object.entries(Hasura[name]) as [funcName, func]}
    <Crud hasuraName="{funcName.split(/(?=[A-Z])/).map((e)=>e.toLowerCase()).join(" ")}" hasuraFunction="{func}"/>
{/each}