import { Application, Router,send } from "https://deno.land/x/oak/mod.ts";
import * as render from './render.js'
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Session } from "https://deno.land/x/session@1.1.0/mod.ts";

const db = new DB("blog.db");
db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT, username TEXT,  body TEXT)");
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)");
/*
const userMap = {
  ccc: { username:'ccc', password: '123' },
  snoopy: { username:'snoopy', password: '321' }
}
*/

const router = new Router();

router.get('/', list)
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/post/new', add)
  .get('/post/:id', show)
  .post('/post', create)
  .get('/delpost/:id',delpost)


const app = new Application();

const session = new Session({ framework: "oak" });
await session.init();
app.use(session.use()(session));
app.use(router.routes());
app.use(router.allowedMethods());


app.use(async (ctx) => {
  console.log('path=', ctx.request.url.pathname)
  if (ctx.request.url.pathname.startsWith("/public/")) {
    console.log('pass:', ctx.request.url.pathname)
    await send(ctx, ctx.request.url.pathname, {
      root: Deno.cwd(),
      index: "index.html",
    });  
  }
});

function sqlcmd(sql, arg1) {
  console.log('sql:', sql)
  try {
    var results = db.query(sql, arg1)
    console.log('sqlcmd: results=', results)
    return results
  } catch (error) {
    console.log('sqlcmd error: ', error)
    throw error
  }
}

function postQuery(sql) {
  let list = []
  for (const [id, username, title, body] of sqlcmd(sql)) {
    list.push({id, username, title, body})
    
  }
  console.log('postQuery: list=', list)
  return list
}



function userQuery(sql) {
  let list = []
  for (const [id, username, password, email] of sqlcmd(sql)) {
    list.push({id, username, password, email})
  }
  console.log('userQuery: list=', list)
  return list
}

async function parseFormBody(body) {
  const pairs = await body.value
  const obj = {}
  for (const [key, value] of pairs) {
    obj[key] = value
  }
  return obj
}

async function signupUi(ctx) {
  ctx.response.body = await render.signupUi();
}

async function signup(ctx) {
  const body = ctx.request.body()
  console.log('dangerous')
  if (body.type === "form") {
    var user = await parseFormBody(body)
    var dbUsers = userQuery(`SELECT id, username, password, email FROM users WHERE username='${user.username}'`)
    if (dbUsers.length === 0) {
      sqlcmd("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [user.username, user.password, user.email]);
      ctx.response.body = render.loginUi({status:'帳號創立成功，請重新登入'})
    } else
    ctx.response.body = render.signupUi({status:'帳號已被創立'})
    console.log('ggggg')
      //ctx.response.body = render.fail()
  }
}

async function loginUi(ctx) {
  ctx.response.body = await render.loginUi();
}

async function login(ctx) {
  const body = ctx.request.body()
  if (body.type === "form") {
    var user = await parseFormBody(body)
    var dbUsers = userQuery(`SELECT id, username, password, email FROM users WHERE username='${user.username}'`) // userMap[user.username]
    var dbUser = dbUsers[0]
    
    console.log('看戲:帳號',dbUser)
    if (dbUser != null && dbUser.password === user.password ) {
      ctx.state.session.set('user', user)
      console.log('session.user=', await ctx.state.session.get('user'))
      ctx.response.redirect('/');
    }

    else if(user.username==''&&user.password=='')
    {
      ctx.response.body = render.loginUi({status:'請輸入帳號密碼'})
    } 

    else {
      ctx.response.body = render.loginUi({status:'帳號或密碼錯誤'})
      //ctx.response.body = render.fail()
    }
  }
}

async function logout(ctx) {
   ctx.state.session.set('user', null)
   ctx.response.redirect('/login')
}

async function list(ctx) {
  let orderby = ctx.request.url.searchParams.get('orderby')
  orderby = orderby || 'id'
  let op = ctx.request.url.searchParams.get('op')
  op = op || 'ASC'
  let posts = postQuery(`SELECT id,username, title, body FROM posts ORDER BY ${orderby} ${op}`)
  console.log('list:posts=', posts)
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user'));
  /*ctx.response.body = await render.list(posts);*/
}


/*
async function list(ctx) {
  let posts = postQuery("SELECT id, username, title, body FROM posts")
  console.log('list:posts=', posts)
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user'));
}
*/
async function add(ctx) {
  var user = await ctx.state.session.get('user')
  if (user != null) {
    ctx.response.body = await render.newPost();
  } else {
    ctx.response.body = render.fail()
  }
}

async function delpost(ctx) {
  //sqlcmd(`DELETE FROM posts WHERE username='${eggwu96007}'`) // userMap[user.username] 
  //const delid=;
  const pid = ctx.params.id;
  console.log('第一個')
  console.log('第一個=',pid)
  postQuery(`DELETE FROM posts WHERE id='${pid}'`)
  ctx.response.redirect('/');
  
}

async function show(ctx) {
  const pid = ctx.params.id;
  console.log('要確定餒',pid)
  let posts = postQuery(`SELECT id, username, title, body FROM posts WHERE id=${pid}`)
  
  let post = posts[0]
  console.log('show:post=', post)//
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.response.body = await render.show(post);
}

async function create(ctx) {
  const body = ctx.request.body()
  if (body.type === "form") {
    var post = await parseFormBody(body)
    console.log('create:post=', post)
    var user = await ctx.state.session.get('user')
    if (user != null) {
      console.log('user=', user)
      sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", [user.username, post.title, post.body]);  
    } 
    else {
      ctx.throw(404, 'not login yet!');
    }
    ctx.response.redirect('/');
  }
}

console.log('Server run at http://127.0.0.1:8000/login')
await app.listen({ port: 8000 });