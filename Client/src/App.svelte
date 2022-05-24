<script>
	import CrudGroup from "./CRUDGroup.svelte";
</script>


<div>
	<span>Uživatelé</span>
	<CrudGroup name="Users"/>
	<br>
	<span>Zprávy</span>
	<CrudGroup name="Messages"/>
	<br>
	<span>Příspěvky</span>
	<CrudGroup name="Posts"/>
	<br>
	<span>Skupiny</span>
	<CrudGroup name="Groups"/>
</div>
