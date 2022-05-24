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
      update_forum_posts_by_pk(pk_columns: {id: $post_id}, _inc: {message_count: 1}) {
        message_count
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
  else if (action == "CreatePost") {
    ({ _, errors } = await execute(`
    mutation IncrementPosts($group_id: Int!) {
      update_forum_groups_by_pk(pk_columns: {id: $group_id}, _inc: {posts: 1}) {
        posts
      }
    }    
    `, { "group_id": variables.group_id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ data, errors } = await execute(`
    mutation CreatePost($content: String!, $group_id: Int!, $title: String!, $user_id: Int!) {
      insert_forum_posts_one(object: {content: $content, group_id: $group_id, title: $title, user_id: $user_id}) {
        id
        created
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_forum_posts_one
    })
  }
  else if (action == "DeletePost") {
    ({ data, errors } = await execute(`
    mutation DeletePost($id: Int!) {
      delete_forum_posts_by_pk(id: $id) {
        user_id
        title
        message_count
        created
        content
        group_id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ _, errors } = await execute(`
    mutation DecrementPosts($group_id: Int!) {
      update_forum_groups_by_pk(pk_columns: {id: $group_id}, _inc: {posts: -1}) {
        posts
      }
    }    
    `, { "group_id": data.delete_forum_posts_by_pk.group_id }));
    return res.json({
      ...data.delete_forum_posts_by_pk
    })
  }
  else if (action == "UpdatePost") {
    if (variables.content == null && variables.title == null) return;
    ({ data, errors } = await execute(`
    mutation UpdatePost($id: Int!, $content: String = null, $title: String = null) {
      update_forum_posts_by_pk(pk_columns: {id: $id}, _set: {content: $content, title: $title}) {
        content
        title
        message_count
        group_id
        created
        user_id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_posts_by_pk
    })
  }
  else if (action == "CreateGroup") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
  else if (action == "DeleteGroup") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
  else if (action == "UpdateGroup") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
  else if (action == "CreateUser") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
  else if (action == "DeleteUser") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
  else if (action == "UpdateUser") {
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_messages_by_pk
    })
  }
});