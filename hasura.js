function GetQuery(query) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "https://praxe-forum.hasura.app/v1/graphql",
            headers: {
                "Content-Type": "application/json",
                "Hasura-Client-Name": "hasura-console",
                "x-hasura-admin-secret": "j0kFhQGqGIGEkob641HrG6DIXij8tcHsQJmwZ0RmLpuvMJ7XlQjNJoHO6mtE2mp0"
            },
            type: "POST",
            data: JSON.stringify({ query: query }),
            success(data) {
                resolve(data);
            }
        });
    });
}
var tables_contents = {
    "messages": `user_id
                sent
                reply_id
                replies
                post_id
                message
                id`,
    "users": `username
                password
                last_name
                id
                first_name
                created
                login_key`,
    "posts": `user_id
                title
                text
                id
                group_id
                created`,
    "groups": `user_id
                posts
                id
                members
                created
                name`
};
function GetBy(table, by, what) {
    return GetQuery(`
        query {
            ${table}(where: {${by}: {_eq: ${what}}}) {
                ${tables_contents[table]}
            }
        }
    `);
}
function SearchBy(table, by, what) {
    return GetQuery(`
        query {
            ${table}(where: {${by}: {_like: "%${what}%"}}) {
                ${tables_contents[table]}
            }
        }
    `);
}