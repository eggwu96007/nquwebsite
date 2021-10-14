export function layout(title, content) {
  return `
  <html>
  <head>
  
    <title>${title}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=2.0, user-scalable=yes" />
    <style>
    
    body {
        font-family: Arial, Helvetica, sans-serif;
        padding: 100px;
        font: 16px Helvetica, Arial;
      }
  
      h1 {
        font-size: 2em;
      }

      h2 {
        font-size: 1.2em;
      }
  
      #posts {
        margin: 0;
        padding: 0;
      }
  
      #posts li {
        margin: 10px 0;
        padding: 0;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
        list-style: none;
      }
  
      #posts li:last-child {
        border-bottom: none;
      }
  
      textarea {
        width: 500px;
        height: 300px;
      }
  
      input[type=text],input[type=password],
      textarea {
        border: 1px solid #eee;
        border-radius: 2px;
        padding: 15px;
        font-size: .8em;
      }
  
      input[type=text],input[type=password] {
        width: 500px;
      }

      header{
        font-size: 50px;
        font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
         background-color:cyan;
         margin-top: -80px;
         text-align: center;
         height:70px;
      }
     
      article{
        width:auto;
        height:auto;
      }
      
    main
    {
      
      height:300px;
      width:300px;
    }
    
    </style>
  </head>
 
  ${content}
 
  </html>
  `
}
//alert('${args.status}')
export function loginUi(args={})  {
  //console.log('loginUI')
  var alertScript
  if (args.status != null) {
    console.log('空白')
    console.log('loginUI:alertScript args=', args)
    alertScript = `<p>帳號或密碼有誤<p>`
  } else {
    console.log('沒有空白')
    console.log('loginUI:no alert')
    alertScript = ''
  }
  console.log('loginUI:beforeLayout')
  return layout('Login', `
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=2.0, user-scalable=yes" />
  <body>

  <h1>登入</h1>
  
  <form action="/login" method="post">
    <p><input type="text" placeholder="社團帳號"  name="username" style="width:auto;"></p>
    <p><input type="password" placeholder="密碼" name="password" style = "width:auto;"></p>
    
    <p><input type="submit" value="登入"></p>
  </form>
 <p>${alertScript}</p>
  </body>
  </head>
  </html>

  `)
}

export function signupUi(args={}) {
  console.log('signupUI')
  var alertScript
  if (args.status != null) {
    console.log('signupUI:alertScript args=', args)
    alertScript = `<script>
    alert('${args.status}')
    </script>`
  } else {
    console.log('signupUI:no alert')
    alertScript = ''
  }
  return layout('Signup',` 
  <h1>Signup</h1>
  <form action="/signup" method="post">
    <p><input type="text" placeholder="帳號" name="username" style="width:auto;"></p>
    <p><input type="password" placeholder="密碼" name="password" style="width:auto;"></p>
    <p><input type="text" placeholder="社團名稱" name="email" style="width:auto;"></p>
    <p><input type="submit" value="登入"  ></p>
  </form>
  ${alertScript}
  `
  
  )
}

export function success() {
  return layout('Success', `
  <h1>Success!</h1>
  You may <a href="/">read all Post</a> again !
  `)
}

export function fail() {
  return layout('Fail', `
  <h1>Fail!</h1>
  You may <a href="/">read all Post</a> or <a href="JavaScript:window.history.back()">go back</a> !
  `)
}

export function list(posts, user) {
  console.log('listing: user=', user)
  let list = []
  
  for (let post of posts) {
    
    list.push(`
    <li style="border-color: crimson">
    </li>
    <li style="border-color: crimson"><h2>${ post.title } -- by ${post.username}and${post.email}<a href="/delpost/${post.id}">刪除貼文</a><a href="/editpost/${post.id}">編輯貼文</a></h2>
    
      <p>${post.body}</p>
      <p>${post.file}</p>
      <img width="500" heigh="700" src="images/${post.file}"/>
      <p><a href="/post/${post.id}">Read post</a></p></li>
    `)
  }
  let content = `
  <body>
  <article>
  <p style="border: crimson;font-size: 30px; border-top: 100px; ">${(user==null)?'':'歡迎 '+user.username+'hi'+user.email}<a href="/post/new">創立貼文</a></p>
  <ul id="posts">
    ${list.join('\n')}
  </ul>
  </article>
  </body>
  `
  return layout('Posts', content)
}

export function view(posts, user) {
  console.log('listing: user=', user)
  let list = []
  
  for (let post of posts) {
    
    list.push(`
    <li style="border-color: crimson">
    </li>
    <li style="border-color: crimson"><h2>${ post.title } -- by ${post.email}</h2>
    
      <p>${post.body}</p>
      <p>${post.file}</p>
      <img width="500" heigh="700" src="images/${post.file}"/>
      <p><a href="/post/${post.id}">Read post</a></p></li>
    `)
  }
  let content = `
  <body>
  <article>
  
  <ul id="posts">
    ${list.join('\n')}
  </ul>
  </article>
  </body>
  `
  return layout('Posts', content)
}


export function newPost() {
  
  return layout('New Post',
 
  `    
  <body>
    <h1>新貼文</h1>
    <p>Create a new post.</p>
    <form action="/post" enctype="multipart/form-data" method="post" >
      <p><input type="text" placeholder="Title" name="title"></p>
      <p><textarea placeholder="Contents" name="body"></textarea></p>
      <div>活動海報: <input type="file" name="file"/></div>
      <p><input type="submit" value="Create"></p>
     
    </form>
    
  </body>


  `
  )
}




export function editpostui(post) {
  return layout(post.title, `
 
<body>
  <h1>編輯中${post.id}</h1>
  <p>Create a new post.</p>
  <form action="/${post.id}" enctype="multipart/form-data" method="post">
  <p><input type="text" placeholder="Title" name="title" value="${post.title}"></p>
  <p><textarea placeholder="Contents" name="body" rows="6" cols="40">${post.body}</textarea></p>
    <p><input type="submit" value="Create"></p>
    <img src="" alt="" name="image">
  <input type="file" name="file" id="imgfile">
  <input type='button' id='btnLoad' value='Upload'  />
  <canvas id="canvas"></canvas>
  </form>
  

  </body>
  `)
}


export function show(post) {
  return layout(post.title, `
  <html>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=2.0, user-scalable=yes" />
  <body>

    <h1>${post.title} -- by ${post.email}</h1>
    <p>${post.body}</p>

    
  </body>
  </head>
  </html>
  `)
}
