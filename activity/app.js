import { Application, Router,send } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import * as render from './render.js'
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Session } from "https://deno.land/x/session@1.1.0/mod.ts";
import { multiParser} from 'https://deno.land/x/multiparser@v2.1.0/mod.ts'
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const db = new DB("blog.db");
db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT, username TEXT,  body TEXT, file TEXT,email TEXT)");
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)");
/*
const userMap = {
  ccc: { username:'ccc', password: '123' },
  snoopy: { username:'snoopy', password: '321' }
}
*/

const router = new Router();

router.get('/', list)
  //.post('/upload', upload)
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/post/new', add)
  .get('/post/:id', show)
  .post('/post', create)
  .get('/delpost/:id',delpost)
  .get('/editpost/:id',editpostui)
  .post('/:id',editpost)
  .get('/onlyview',view)
  

const app = new Application();

const session = new Session({ framework: "oak" });
await session.init();
app.use(session.use()(session));
app.use(router.routes());
app.use(router.allowedMethods());
app.use(oakCors());


app.use(async (ctx) => {
  console.log('path=', ctx.request.url.pathname)
  if (ctx.request.url.pathname.startsWith("/images")) {
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
  for (const [id, username, title, body,file,email] of sqlcmd(sql)) {
    list.push({id, username, title, body,file,email})
    
  }
  console.log('??????????????????????postQuery: list=', list)
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
/*???????????????*/
async function signupUi(ctx) {
  ctx.response.body = await render.signupUi();
}



async function signup(ctx) {
  const body = ctx.request.body()
  console.log('dangerous')
  if (body.type === "form") {
    var user = await parseFormBody(body)
    var dbUsers = userQuery(`SELECT id, username, password ,email FROM users WHERE username='${user.username}'`)
    if (dbUsers.length === 0) {
      sqlcmd("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [user.username, user.password, user.email]);
      ctx.response.body = render.loginUi({status:'????????????????????????????????????'})
    } else
    ctx.response.body = render.signupUi({status:'??????????????????'})
  }
}

async function loginUi(ctx) {
  
  ctx.response.body = await render.loginUi();
}



async function login(ctx) {
  const body = ctx.request.body()
  if (body.type === "form") {
    var user = await parseFormBody(body)
    var dbUsers = userQuery(`SELECT id, username,password,email FROM users WHERE username='${user.username}'`) // userMap[user.username]
    var dbUser = dbUsers[0]
    
    console.log('??????:??????',dbUser)
    if (dbUser != null && dbUser.password === user.password ) {
      ctx.state.session.set('user', user)
      console.log('session.user=', await ctx.state.session.get('user'))
      ctx.response.redirect('/');
    }

    else if(user.username==''&&user.password=='')
    {
      ctx.response.body = render.loginUi({status:'?????????????????????'})
    } 

    else {
      ctx.response.body = render.loginUi({status:'?????????????????????'})
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
  let posts = postQuery(`SELECT id,username, title, body ,file,email FROM posts ORDER BY ${orderby} ${op}`)
  console.log('????????????list:posts=', posts)
  ctx.response.body = await render.list(posts, await ctx.state.session.get('user'));
}

async function view(ctx) {
    let orderby = ctx.request.url.searchParams.get('orderby')
    orderby = orderby || 'id'
    let op = ctx.request.url.searchParams.get('op')
    op = op || 'ASC'
    let posts = postQuery(`SELECT id,username, title, body ,file,email FROM posts ORDER BY ${orderby} ${op}`)
    console.log('list:posts=', posts)
  ctx.response.body = await render.view(posts, await ctx.state.session.get('user'));
}



async function add(ctx) {
  var user = await ctx.state.session.get('user')
  if (user != null) {
    ctx.response.body = await render.newPost();
  } else {
    ctx.response.body = render.fail()
  }
}

async function delpost(ctx) {
  const pid = ctx.params.id;
  console.log('?????????')
  console.log('?????????=',pid)
  postQuery(`DELETE FROM posts WHERE id='${pid}'`)
  ctx.response.redirect('/');
}


async function editpostui(ctx) {
  const pid = ctx.params.id;
  console.log('????????????????????????',pid)
  let posts = postQuery(`SELECT id, username,title, body,file ,email FROM posts WHERE id=${pid}`)
  let post = posts[0]
  console.log('show:post=', post)
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.response.body = await render.editpostui(post);

}
async function editpost(ctx) {
  const path = ctx.request.url.pathname;
  if (path == '/upload') {
    const form = await multiParser(ctx.request.serverRequest)
    console.log('GG')
    if (form) {
    
      const image = form.files.image 
      await Deno.writeFile(`images/${image.filename}`, image.content);
      console.log(image.filename)
    }
    else
    ctx.response.body = '{"status": "ok"}';
  }
  const pid = ctx.params.id;
  const body = ctx.request.body()
  if (body.type === "form") {
    var post = await parseFormBody(body)
    console.log('create:post=', post)
    var user = await ctx.state.session.get('user')
    if (user != null) {
      console.log('user=', user)
      sqlcmd(`UPDATE posts SET "title"='${post.title}',"body"='${post.body}',"file"='${post.file}' WHERE id='${pid}';`)
    } 
    else {
      ctx.throw(404, 'not login yet!');
    }
    ctx.response.redirect('/');
  }
}


async function create(ctx) {
  const body = ctx.request.body()
  const form = await multiParser(ctx.request.serverRequest)
    if (form) {
      var filename = form.files.file.filename
      let content = form.files.file.content
      await Deno.writeFile(`./images/${filename}`, content);

    }
    var user = await ctx.state.session.get('user')
    if (user != null) {
      console.log('user=', user)
<<<<<<< HEAD
      console.log('????????????',user.email)
      sqlcmd("INSERT INTO posts (username, title, body,file,email) VALUES (?, ?, ?,?,?)", [user.username, post.title, post.body,post.file,user.email]);
=======
      sqlcmd("INSERT INTO posts (username, title, body,file) VALUES (?, ?, ?,?)", [user.username, form.fields.title, form.fields.body,filename]);
>>>>>>> 9626196e23a54eae446cc9e8cfc7dfd44c8eaa28
    } 
    else {
      ctx.throw(404, 'not login yet!');
    }
    ctx.response.redirect('/');
  //}


}

async function show(ctx) {
  const pid = ctx.params.id;
  let posts = postQuery(`SELECT id, username, title, body,file,email FROM posts WHERE id=${pid}`)
  let post = posts[0]
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.response.body = await render.show(post);
}


/*async function upload(ctx) {
  console.log('upload() start')
  const form = await multiParser(ctx.request.serverRequest)
  console.log('form=', form)
  if (form) {
    console.log(form)
    var filename = form.files.singleImg.filename
    let content = form.files.singleImg.content
    await Deno.writeFile(`./images/${filename}`, content);
    console.log("??????",filename)
    ctx.response.body = await render.newPost();
  }
}*/
console.log('Server run at http://127.0.0.1:8000/login')
await app.listen({ port: 8000 });
