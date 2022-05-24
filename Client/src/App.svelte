<script>
	import CrudGroup from "./CRUDGroup.svelte";
</script>


<div>
	<h3>Uživatelé</h3>
	<CrudGroup name="Users"/>
	<br>
	<h3>Zprávy</h3>
	<CrudGroup name="Messages"/>
	<br>
	<h3>Příspěvky</h3>
	<CrudGroup name="Posts"/>
	<br>
	<h3>Skupiny</h3>
	<CrudGroup name="Groups"/>
</div>
