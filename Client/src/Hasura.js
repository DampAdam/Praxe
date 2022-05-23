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
Hasura.Messages = function() {
};
Hasura.Messages.CreateMessage = function(content, post_id, user_id, reply_id = null) {
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
};
Hasura.Messages.DeleteMessage = function(id) {
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
};
Hasura.Messages.UpdateMessage = function(id, content) {
    Hasura.Execute(`
    mutation MyMutation($id: Int!, $content: String!) {
        UpdateMessage(id: $id, content: $content) {
            created
            post_id
            replies
            reply_id
            user_id
        }
    }          
    `, { id, content });
};
Hasura.Users = function() {
};
Hasura.Users.CreateUser = function() {
    Hasura.Execute(`
    
    `);
};
Hasura.Users.DeleteUser = function() {

};
Hasura.Users.UpdateUser = function() {

};

export { Hasura };