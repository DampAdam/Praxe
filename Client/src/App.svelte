<script>
	import { Hasura } from "./Hasura";
</script>

<div>
	<div>
		<div>
			<input placeholder="Content" id="content" type="text" />
			<button
				on:click={() => {
					Hasura.Messages.CreateMessage(
						document.getElementById("content").value,
						4,
						3
					);
				}}
			>
				Poslat zprávu
			</button>
		</div>
		<div>
			<input placeholder="Id" id="id" type="text" />
			<button
				on:click={() => {
					Hasura.Messages.DeleteMessage(document.getElementById("id").value);
				}}
			>
				Odebrat zprávu
			</button>
		</div>
		<div>
			<input placeholder="Id" id="id-edit" type="text" />
			<input placeholder="Content" id="content-edit" type="text" />
			<button
				on:click={() => {
					Hasura.Messages.UpdateMessage(
						document.getElementById("id-edit").value,
						document.getElementById("content-edit").value
					);
				}}
			>
				Editovat zprávu
			</button>
		</div>
	</div>
	<div>
		<div>
			<input placeholder="Content" id="content" type="text" />
			<button
				on:click={() => {
					Hasura.CreateMessage(
						document.getElementById("content").value,
						4,
						3
					);
				}}
			>
				Poslat zprávu
			</button>
		</div>
		<div>
			<input placeholder="Id" id="id" type="text" />
			<button
				on:click={() => {
					Hasura.DeleteMessage(document.getElementById("id").value);
				}}
			>
				Odebrat zprávu
			</button>
		</div>
		<div>
			<input placeholder="Id" id="id-edit" type="text" />
			<input placeholder="Content" id="content-edit" type="text" />
			<button
				on:click={() => {
					Hasura.EditMessage(
						document.getElementById("id-edit").value,
						document.getElementById("content-edit").value
					);
				}}
			>
				Editovat zprávu
			</button>
		</div>
	</div>
</div>
