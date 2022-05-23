const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.listen(PORT);
const fetch = require("node-fetch");
const req = require("express/lib/request");
const res = require("express/lib/response");

const execute = async (query, variables) => {
  const fetchResponse = await fetch(
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
  );
  const data = await fetchResponse.json();
  return data;
};


app.post('/Query', async (req, res) => {
  const action = req.body.action.name;
  const variables = req.body.input;
  console.log(action);
  console.log(variables);
  let data, errors;
  if (action == "CreateMessage") {
    ({ data, errors } = await execute(`
    mutation IncrementMessages($post_id: Int!) {
      update_forum_posts(where: {id: {_eq: $post_id}}, _inc: {message_count: 1}) {
        affected_rows
      }
    }
    `, { "post_id": variables.post_id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ data, errors } = await execute(`
    mutation CreateMessage($content: String!, $post_id: Int!, $user_id: Int!, $reply_id: Int = null) {
      insert_forum_messages_one(object: {content: $content, post_id: $post_id, user_id: $user_id, reply_id: $reply_id}) {
        id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_forum_messages_one
    })
  }
  else if (action == "DeleteMessage") {
    ({ data, errors } = await execute(`
    mutation DeleteMessage($id: Int!) {
      delete_forum_messages_by_pk(id: $id) {
        user_id
        reply_id
        replies
        post_id
        created
        content
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ _, errors } = await execute(`
    mutation DecrementMessages($id: Int!) {
      update_forum_posts_by_pk(pk_columns: {id: $id}, _inc: {message_count: -1}) {
        message_count
      }
    }    
    `, {"id": data.delete_forum_messages_by_pk.post_id}));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.delete_forum_messages_by_pk
    })
  }
  else if (action == "UpdateMessage") {
    ({ data, errors } = await execute(`
    mutation UpdateMessage($id: Int!, $content: String!) {
      update_forum_messages_by_pk(pk_columns: {id: $id}, _set: {content: $content}) {
        user_id
        reply_id
        replies
        post_id
        created
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
});