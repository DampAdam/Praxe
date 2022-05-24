class Hasura {
    static Execute(query, variables) {
        fetch(
            "https://praxe-forum.hasura.app/v1/graphql",
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Hasura-Client-Name": "hasura-console",
                    "x-hasura-admin-secret": "j0kFhQGqGIGEkob641HrG6DIXij8tcHsQJmwZ0RmLpuvMJ7XlQjNJoHO6mtE2mp0"
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            }
        ).then(response => response.json()).then(data => console.log(data));
    }
}
Hasura.Messages = {
    CreateMessage: function (content, post_id, user_id, reply_id = null) {
        if (reply_id == "") {
            reply_id = null;
        }
        Hasura.Execute(`
    mutation($content: String!, $post_id: Int!, $user_id: Int!, $reply_id: Int = null) {
        CreateMessage(content: $content, post_id: $post_id, user_id: $user_id, reply_id: $reply_id) {
            id
        }
    }
    `, {
            content,
            post_id,
            user_id,
            reply_id
        });
    },
    DeleteMessage: function (id) {
        Hasura.Execute(`
    mutation($id: Int!) {
        DeleteMessage(id: $id) {
            content
            created
            post_id
            replies
            reply_id
            user_id
        }
    }
    `, { id });
    },
    UpdateMessage: function (id, content) {
        if (content == "") return;
        Hasura.Execute(`
    mutation($id: Int!, $content: String!) {
        UpdateMessage(id: $id, content: $content) {
            created
            post_id
            replies
            reply_id
            user_id
        }
    }          
    `, { id, content });
    }
};
Hasura.Posts = {
    CreatePost: function (title, content, user_id, group_id) {
        Hasura.Execute(`
    mutation($title: String!, $content: String!, $user_id: Int!, $group_id: Int!) {
        CreatePost(title: $title, content: $content, user_id: $user_id, group_id: $group_id) {
            id
        }
    }
    `, { title, content, user_id, group_id });
    },
    DeletePost: function (id) {
        Hasura.Execute(`
    
    `);
    },
    UpdatePost: function (id, title = null, content = null) {
        if ((title == null || title == "") && (content == null || content == "")) return;
        if (title == "") title = null;
        if (content == "") content = null;
        Hasura.Execute(`
    
    `);
    }
};
Hasura.Groups = {
    CreateGroup: function (name, description, user_id) {
        Hasura.Execute(`
    
    `);
    },
    DeleteGroup: function (id) {
        Hasura.Execute(`
    
    `);
    },
    UpdateGroup: function (id, name = null, description = null, user_id = null) {
        if ((name == null || name == "") && (description == null || description == "") && (user_id == null || user_id == "")) return;
        if (name == "") name = null;
        if (description == "") description = null;
        if (user_id == "") user_id = null;
        Hasura.Execute(`
    
    `);
    }
};
Hasura.Users = {
    CreateUser: function (first_name, last_name, username, email, password, bio = null) {
        if (bio == "") bio = null;
        Hasura.Execute(`
    
    `);
    },
    DeleteUser: function (id) {
        Hasura.Execute(`
    
    `);
    },
    UpdateUser: function (id, first_name = null, last_name = null, username = null, email = null, password = null, bio = null) {
        if ((first_name == null || first_name == "") && (last_name == null || last_name == "") && (username == null || username == "") && (email == null || email == "") && (password == null || password == "")) return;
        if (first_name == "") first_name = null;
        if (last_name == "") last_name = null;
        if (username == "") username = null;
        if (email == "") email = null;
        if (password == "") password = null;
        if (bio == "") bio = null;
        Hasura.Execute(`
    
    `);
    }
};

export { Hasura };