mars
====

## Deploying To Heroku

1. create an app (`heroku apps:create my_todo_app`, for example)
2. set environment variables on heroku for the app:
  1. `heroku config:add MONGOHQ\_URL=mongodb://user:pwd@host:port/db` (you can use mongohq addon to get a mongo db instance)
  2. `heroku config:add ENV=heroku`
  3. `heroku config:add HTTPHOST=my_todo_app.herokuapp.com` (or whatever you use)
  4. `heroku config:add GPLUS\_DOMAIN=yourcompanydomain.com` (or change heroku.js to configure auth)
1. push everything under the superfluous directory (in particular the Procfile) to your heroku git repo. If you have git subtree, use: `git subtree push --prefix superfluous heroku master`

