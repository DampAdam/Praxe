const express = require("express");
require("dotenv").config();
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
        "x-hasura-admin-secret": process.env.HASURA_SECRET_KEY
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
    ({ data, errors } = await execute(`
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
    if (Object.keys(variables).length == 0) return;
    let s = [];
    if (variables.content != null) {
      s.push(`content: "${variables.content}"`);
    }
    if (variables.title != null) {
      s.push(`title: "${variables.title}"`);
    }
    ({ data, errors } = await execute(`
    mutation UpdatePost($id: Int!) {
      update_forum_posts_by_pk(pk_columns: {id: $id}, _set: {${s.join(", ")}}) {
        content
        title
        message_count
        group_id
        created
        user_id
      }
    }
    `, { "id": variables.id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_posts_by_pk
    })
  }
  else if (action == "CreateGroup") {
    if (variables.description == null) {
      delete variables.description;
    }
    ({ data, errors } = await execute(`
    mutation CreateGroup($name: String!, $user_id: Int!, $description: String = "Error 404. Bio not found.") {
      insert_forum_groups_one(object: {name: $name, user_id: $user_id, description: $description}) {
        id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_forum_groups_one
    })
  }
  else if (action == "DeleteGroup") {
    ({ data, errors } = await execute(`
    mutation DeleteGroup($id: Int!) {
      delete_forum_groups_by_pk(id: $id) {
        name
        description
        user_id
        members
        posts
        created
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.delete_forum_groups_by_pk
    })
  }
  else if (action == "UpdateGroup") {
    if (Object.keys(variables).length == 0) return;
    let s = [];
    if (variables.name != null) {
      s.push(`name: "${variables.name}"`);
    }
    if (variables.user_id != null) {
      s.push(`user_id: ${variables.user_id}`);
    }
    if (variables.description != null) {
      s.push(`description: "${variables.description}"`);
    }
    ({ data, errors } = await execute(`
    mutation UpdateGroup($id: Int!, $name: String = null, $user_id: Int = null, $description: String = null) {
      update_forum_groups_by_pk(pk_columns: {id: $id}, _set: {${s.join(", ")}}) {
        id
        name
        description
        user_id
        members
        posts
        created
      }
    }
    `, { "id": variables.id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_groups_by_pk
    })
  }
  else if (action == "CreateUser") {
    if (variables.bio == null) {
      delete variables.bio;
    }
    ({ data, errors } = await execute(`
    mutation CreateUser($first_name: String!, $last_name: String!, $username: String!, $email: String!, $password: String!, $bio: String = "Error 404. Bio not found.", $login_key: String = null) {
      insert_forum_users_one(object: {first_name: $first_name, last_name: $last_name, username: $username, email: $email, password: $password, bio: $bio, login_key: $login_key}) {
        id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_forum_users_one
    })
  }
  else if (action == "DeleteUser") {
    ({ data, errors } = await execute(`
    query GetGroups($id: Int!) {
      forum_users_groups(where: {user_id: {_eq: $id}}) {
        group_id
      }
    }    
    `, variables));
    data.delete_forum_users_groups.returning.forEach(group => {
      execute(`
      mutation DecrementMembers($id: Int!) {
        update_forum_groups_by_pk(pk_columns: {id: $id}, _inc: {members: -1}) {
          members
        }
      }      
      `, { "id": group.id });
    });
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ data, errors } = await execute(`
    mutation DeleteUser($id: Int!) {
      delete_forum_users_by_pk(id: $id) {
        first_name
        last_name
        username
        email
        password
        bio
        login_key
        created
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.delete_forum_users_by_pk
    })
  }
  else if (action == "UpdateUser") {
    if (Object.keys(variables).length == 0) return;
    let s = [];
    if (variables.first_name != null) {
      s.push(`first_name: "${variables.first_name}"`);
    }
    if (variables.last_name != null) {
      s.push(`last_name: "${variables.last_name}"`);
    }
    if (variables.username != null) {
      s.push(`username: "${variables.username}"`);
    }
    if (variables.email != null) {
      s.push(`email: "${variables.email}"`);
    }
    if (variables.password != null) {
      s.push(`password: "${variables.password}"`);
    }
    if (variables.bio != null) {
      s.push(`bio: "${variables.bio}"`);
    }
    ({ data, errors } = await execute(`
    mutation UpdateUser($id: Int!, $first_name: String = null, $last_name: String = null, $username: String = null, $email: String = null, $password: String = null, $bio: String = null) {
      update_forum_users_by_pk(pk_columns: {id: $id}, _set: {${s.join(", ")}}) {
        first_name
        last_name
        username
        email
        password
        bio
        login_key
        created
      }
    }
    `, { "id": variables.id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.update_forum_users_by_pk
    })
  }
  else if (action == "JoinGroup") {
    ({ _, errors } = await execute(`
    mutation IncrementMembers($id: Int!) {
      update_forum_groups_by_pk(pk_columns: {id: $id}, _inc: {members: 1}) {
        members
      }
    }    
    `, { "id": variables.group_id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({ data, errors } = await execute(`
    mutation JoinGroup($user_id: Int!, $group_id: Int!) {
      insert_forum_users_groups_one(object: {user_id: $user_id, group_id: $group_id}) {
        id
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.insert_forum_users_groups_one
    })
  }
  else if (action == "LeaveGroup") {
    ({ _, errors } = await execute(`
    mutation IncrementMembers($id: Int!) {
      update_forum_groups_by_pk(pk_columns: {id: $id}, _inc: {members: -1}) {
        members
      }
    }    
    `, { "id": variables.group_id }));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    ({data, errors} = await execute(`
    mutation LeaveGroup($user_id: Int!, $group_id: Int!) {
      delete_forum_users_groups(where: {user_id: {_eq: $user_id}, group_id: {_eq: $group_id}}) {
        affected_rows
      }
    }
    `, variables));
    if (errors) {
      return res.status(400).json(errors[0])
    }
    return res.json({
      ...data.delete_forum_users_groups
    })
  }
});