<script>
    function GetParams(func) {
        let str = func.toString();
        str = str
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/(.)*/g, "")
            .replace(/{[\s\S]*}/, "")
            .replace(/=>/g, "")
            .trim();
        let start = str.indexOf("(") + 1;
        let end = str.length - 1;
        let result = str.substring(start, end).split(", ");
        let params = [];
        result.forEach((element) => {
            element = element.replace(/=[\s\S]*/g, "").trim();
            if (element.length > 0) params.push(element);
        });
        return params;
    }
    function Translate(str, dict) {
        for (let word in dict) {
            str = str.replaceAll(word, dict[word]);
        }
        return str;
    }
    export let hasuraFunction;
    export let hasuraName;
    let names = GetParams(hasuraFunction);
    let text = Translate(hasuraName, {
        "create": "Přidat",
        "update": "Editovat",
        "delete": "Odebrat",
        "message": "Zprávu",
        "group": "Skupinu",
        "user": "Uživatele",
        "post": "Příspěvek"
    });
    let className = hasuraName.replace(" ", "-");
</script>

<div>
    {#each names as name}
        <input
            placeholder={name
                .split("_")
                .map(function (n) {
                    return n.charAt(0).toUpperCase() + n.slice(1);
                })
                .join(" ")}
            class={className}
            type="text"
        />
    {/each}
    <button
        on:click={() => {
            hasuraFunction(
                ...[].slice
                    .call(document.getElementsByClassName(className))
                    .map((e) => e.value)
            );
        }}
    >
        {text}
    </button>
</div>
