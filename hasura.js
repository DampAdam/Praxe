class Hasura {
    static PromiseWithLog(promise) {
        promise.then((value)=>{console.log(value);});
    }
    static GetQuery(query) {
        console.log(query);
        return new Promise(function (resolve) {
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
    static tables_contents = {
        "users": `id
                    first_name
                    last_name
                    username
                    email
                    password
                    bio
                    login_key
                    created`,
        "messages": `id
                        user_id
                        post_id
                        content
                        replies
                        reply_id
                        sent`,
        "posts": `id
                    user_id
                    group_id
                    title
                    content
                    message_count
                    created`,
        "groups": `id
                    user_id
                    name
                    description
                    members
                    posts
                    created`
    };
    static GetBy(table, by, what) {
        return this.GetQuery(`
            query {
                forum_${table}(where: {${by}: {_eq: ${typeof(what)=="string"?`"${what}"`:what}}}) {
                    ${this.tables_contents[table]}
                }
            }
        `);
    }
    static SearchBy(table, by, what) {
        return this.GetQuery(`
            query {
                ${table}(where: {${by}: {_like: "%${what}%"}}) {
                    ${this.tables_contents[table]}
                }
            }
        `);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static HashBcrypt(input) {
        return input;
    } //TODO: zprovoznit tuto funkci
    static symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890/(),.-*?:_!";
    static GetLoginKey() {
        let key = "";
        for (let i=0;i<31;i++) {
            key += this.symbols[Math.floor(Math.random()*74)];
        }
        return this.HashBcrypt(key);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static CreateUser(first_name, last_name, username, email, password, bio = null, login_key = false) {
        return this.GetQuery(`
            mutation {
                insert_forum_users(objects: {first_name: "${first_name}", last_name: "${last_name}", username: "${username}", email: "${email}", password: "${this.HashBcrypt(password)}"${bio==null?"":`, bio: "${bio}"`}${login_key?`login_key: "${this.GetLoginKey()}"`:""}}) {
                    returning {
                        id
                        login_key
                    }
                }
            }
        `);
    }
    static DeleteUser(id) {
        return this.GetQuery(`
            mutation {
                delete_forum_users(where: {id: {_eq: ${id}}}) {
                    returning {
                        ${this.tables_contents["users"]}
                    }
                }
            }
        `); //TODO: deincrementovat pocet z joinutych skupin + odstranit zaznam z users_groups (vytvořit users_groups)
    }
    static EditUser(id, first_name = null, last_name = null, username = null, password = null, bio = null) {
        if (first_name == null && last_name == null && username == null && password == null && bio == null) return;
        let info = [];
        if (first_name != null) {
            info.push(`first_name: "${first_name}"`);
        }
        if (last_name != null) {
            info.push(`last_name: "${last_name}"`);
        }
        if (username != null) {
            info.push(`username: "${username}"`);
        }
        if (password != null) {
            info.push(`password: "${this.HashBcrypt(password)}"`);
        }
        if (bio != null) {
            info.push(`bio: "${bio}"`);
        }
        return this.GetQuery(`
            mutation {
                update_forum_users(where: {id: {_eq: ${id}}}, _set: {${info.join(", ")}}) {
                    returning {
                        login_key
                        created
                    }
                }
            }
        `);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static CreateMessage(content, user_id, post_id, reply_id = null) {
        this.GetQuery(`
            mutation {
                update_forum_posts(where: {id: {_eq: ${post_id}}}, _inc: {message_count: 1}) {
                    returning {
                        message_count
                    }
                }
            }
        `);
        return this.GetQuery(`
            mutation {
                insert_forum_messages(objects: {content: "${content}", user_id: "${user_id}", post_id: ${post_id}${reply_id==null?"":`, reply_id: ${reply_id}`}}) {
                    returning {
                        id
                    }
                }
            }
        `);
    }
    static DeleteMessage(id) {
        return this.GetQuery(`
            mutation {
                delete_forum_messages(where: {id: {_eq: ${id}}}) {
                    returning {
                        ${this.tables_contents["messages"]}
                    }
                }
            }
        `);
    }
    static EditMessage(id, content = null) {
        if (content == null) return;
        return this.GetQuery(`
            mutation {
                update_forum_messages(where: {id: {_eq: ${id}}}, _set: {content: "${content}"}) {
                    returning {
                        user_id
                        post_id
                        created
                        reply_id
                        replies
                    }
                }
            }
        `);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static CreatePost(title, content, user_id, group_id) {
        this.GetQuery(`
            mutation {
                update_forum_groups(where: {id: {_eq: ${group_id}}}, _inc: {posts: 1}) {
                    returning {
                        posts
                    }
                }
            }
        `);
        return this.GetQuery(`
            mutation {
                insert_forum_posts(objects: {title: "${title}", content: "${content}", user_id: ${user_id}, group_id: ${group_id}}) {
                    returning {
                        id
                    }
                }
            }
        `);
    }
    static DeletePost(id) {
        return this.GetQuery(`
            mutation {
                delete_forum_posts(where: {id: {_eq: ${id}}}) {
                    returning {
                        ${this.tables_contents["posts"]}
                    }
                }
            }
        `).then((value)=>{
            console.log(value);
            this.GetQuery(`
                mutation {
                    update_forum_groups(where: {id: {_eq: ${value.data.delete_forum_posts.returning[0].group_id}}}, _inc: {posts: -1}) {
                        returning {
                            posts
                        }
                    }
                }
            `);
        });
    }
    static EditPost(id, title = null, content = null) {
        if (title == null && content == null) return;
        let info = [];
        if (title != null) {
            info.push(`title: "${title}"`);
        }
        if (content != null) {
            info.push(`content: "${content}"`);
        }
        return this.GetQuery(`
            mutation {
                update_forum_posts(where: {id: {_eq: ${id}}}, _set: {${info.join(", ")}}) {
                    returning {
                        id
                        group_id
                        message_count
                        user_id
                        created
                    }
                }
            }
        `);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static CreateGroup(name, user_id, description = null) {
        return this.GetQuery(`
            mutation {
                insert_forum_groups(objects: {name: "${name}", user_id: ${user_id}${description==null?"":`, description: "${description}"`}}) {
                    returning {
                        id
                    }
                }
            }           
        `);
    }
    static DeleteGroup(id) {
        return this.GetQuery(`
            mutation {
                delete_forum_groups(where: {id: {_eq: ${id}}}) {
                    returning {
                        ${this.tables_contents["groups"]}
                    }
                }
            }
        `); //TODO: odstranit všechny záznamy s group_id v users_groups + odstranit všechny posts s group_id + odstranit všechny messages s post_id, která mají group_id
    }
    static EditGroup(id, name = null, description = null, user_id = null) {
        if (name == null && description == null && user_id == null) return;
        let info = [];
        if (name != null) {
            info.push(`name: "${name}"`);
        }
        if (description != null) {
            info.push(`description: "${description}"`);
        }
        if (user_id != null) {
            info.push(`user_id: ${user_id}`);
        }
        return this.GetQuery(`
            mutation {
                update_forum_groups(where: {id: {_eq: ${id}}}, _set: {${info.join(", ")}}) {
                    returning {
                        posts
                        created
                        members
                    }
                }
            }
        `);
    }
    //////////////////////////////////////////////////////////////////////////////////////
    static JoinGroup(user_id, group_id) {

    } //TODO: přidat do users_groups tabulky + increment members
    static LeftGroup(user_id, group_id) {

    } //TODO: checknout jestli je user_id v group_id, jestli jo, tak odebrat z users_groups + deincrement members
    //////////////////////////////////////////////////////////////////////////////////////
}