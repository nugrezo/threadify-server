# express-api

This is the backend repo of the project. Front-end of this project is found at https://github.com/nugrezo/threadify-client

This backend server is created for starting projects with `express`. It Includes
authentication and common middlewares. The middlewares are presented below.

- app.use(replaceToken)
- app.use(auth)
- app.use(requestLogger)
- app.use(threadifyRoutes)
- app.use(userRoutes)
- app.use(commentRoutes)
- app.use(likesRoutes)
- app.use(errorHandler)

## Installation

1. [Download](../../archive/master.zip) this template.
1. Rename the directory from express-api -> your-app-name.
1. Empty [`README.md`](README.md) and fill with your own content.
1. Move into the new project and `git init`.
1. Replace all instances of `'threadfy'` with your app name.
1. Install dependencies with `npm install`.
1. Ensure that you have `nodemon` installed by running `npm install -g nodemon`.
1. Ensure the API is functioning properly by running `npm run server`.
1. Once everything is working, make an initial commit.

## Technologies Used

- Express api
- Node.js
- Mongo DB Atlas
- Mongoose
- Passport
- crypto
- bcrypt
- hashedpassword

## Host

This project is hosted by render.com

## Structure

Dependencies are stored in [`package.json`](package.json).

The most important file for understanding the structure of the template is
`server.js`. This is where the actual Express `app` object is created, where
the middlewares and routes are registered, and more. To register a routefile,
follow the pattern established here with `exampleRoutes` and `userRoutes`. If
you want to add any middlewares to your app, do that here.

The `app` directory contains models and route files. Models are simply Mongoose
models. To create your own, follow the patterns established in
`app/models/example.js`. Route files are somewhat similar to controllers in
Rails, but they cover more functionality, including serialization and deciding
which HTTP verbs to accept and what to do with them.

The `config` directory holds just `db.js`, which is where you specify the name
and URL of your database.

The `lib` directory is for code that will be used in other places in the
application. The token authentication code is stored in `lib/auth.js`. The
other files in `lib` deal with error handling. `custom_errors.js` is where all
the different custom classes of errors are created. If you need some other kind
of error message, you can add it here. There are also some functions defined
here that are used elsewhere to check for errors. `lib/error_handler.js` is a
function that will be used in all your `.catch`es. It catches errors, and sets
the response status code based on what type of error got thrown.

You probably will only need to interact with files in `app/models`,
`app/routes`, and `server.js`. You'll need to edit `db/config.js` just once,
to change the name of your app.

## Tasks

Instead of `grunt`, this template uses `npm` as a task runner. This is more
conventional for modern Express apps, and it's handy because we'll definitely
use `npm` anyway. These are the commands available:

| Command                | Effect                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run server`       | Starts a development server with `nodemon` that automatically refreshes when you change something.          |
| `npm test`             | Runs automated tests.                                                                                       |
| `npm run debug-server` | Starts the server in debug mode, which will print lots of extra info about what's happening inside the app. |

## API

Use this as the basis for your own API documentation. Add a new third-level
heading for your custom entities, and follow the pattern provided for the
built-in user authentication documentation.

Scripts are included in [`curl-scripts`](curl-scripts) to test built-in actions.
Add your own scripts to test your custom API.

### Authentication

| Verb   | URI Pattern           | #Action          |
| ------ | --------------------- | ---------------- |
| POST   | `/sign-up`            | `users#signup`   |
| POST   | `/sign-in`            | `users#signin`   |
| PATCH  | `/change-password/`   | `users#changepw` |
| DELETE | `/sign-out/`          | `users#signout`  |
| POST   | `/users/id`           | `users#userinfo` |
| PATCH  | `/change-email/id`    | `users#userinfo` |
| PATCH  | `/change-username/id` | `users#userinfo` |

### Application Routes

| Verb   | URI Pattern           | #Action           |
| ------ | --------------------- | ----------------- |
| POST   | `/threads`            | `thread#crate`    |
| GET    | `/threads`            | `thread#showall`  |
| DELETE | `/threads/id/`        | `threads#delete`  |
| PATCH  | `/threads/id/`        | `threads#update`  |
| GET    | `/threads/id/`        | `threads#show  `  |
| POST   | `/threads/id/comment` | `threads#comment` |
| POST   | `/threads/id/like`    | `threads#like  `  |

#### POST /sign-up

Request:

```sh
curl --include --request POST http://localhost:4741/sign-up \
  --header "Content-Type: application/json" \
  --data '{
    "credentials": {
      "email": "an@example.email",
      "password": "an example password",
      "password_confirmation": "an example password"
    }
  }'
```

```sh
curl-scripts/sign-up.sh
```

Response:

```md
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
"user": {
"id": 1,
"email": "an@example.email"
}
}
```

#### POST /sign-in

Request:

```sh
curl --include --request POST http://localhost:4741/sign-in \
  --header "Content-Type: application/json" \
  --data '{
    "credentials": {
      "email": "an@example.email",
      "password": "an example password"
    }
  }'
```

```sh
curl-scripts/sign-in.sh
```

Response:

```md
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
"user": {
"id": 1,
"email": "an@example.email",
"token": "33ad6372f795694b333ec5f329ebeaaa"
}
}
```

#### PATCH /change-password/

Request:

```sh
curl --include --request PATCH http://localhost:4741/change-password/ \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "passwords": {
      "old": "an example password",
      "new": "super sekrit"
    }
  }'
```

```sh
TOKEN=33ad6372f795694b333ec5f329ebeaaa curl-scripts/change-password.sh
```

Response:

```md
HTTP/1.1 204 No Content
```

#### DELETE /sign-out/

Request:

```sh
curl --include --request DELETE http://localhost:4741/sign-out/ \
  --header "Authorization: Bearer $TOKEN"
```

```sh
TOKEN=33ad6372f795694b333ec5f329ebeaaa curl-scripts/sign-out.sh
```

Response:

```md
HTTP/1.1 204 No Content
```

#### POST /threads

Request:

```sh
curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "thread": {
      "text": "'"${TEXT}"'"
    }
  }'
```

```sh
TOKEN="33ad6372f795694b333ec5f329ebeaaa" TEXT="sample text" curl-scripts/threads/create.sh
```

Example request:

TOKEN="a58e50a154929d4ab55deca015366b0d" TEXT="Today the weather is amazing" curl-scripts/threads/create.sh

Response:

```md
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"thread":{"text":"Today the weather is amazing","username":"mehmet","owner":"65ea5c4a9d1fe3d9e5f46083","\_id":"65ef8544e1bd9d3837852bb0","likes":[],"comments":[],"createdAt":"2024-03-11T22:27:16.855Z","updatedAt":"2024-03-11T22:27:16.855Z","\_\_v":0}}
```

## [License](LICENSE)

1. All content is licensed under a JOZ license.
