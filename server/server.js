const jsonServer = require("json-server");
const fs = require("fs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

// JSON Serverで使用するJSONファイルを設定
const server = jsonServer.create();
const router = jsonServer.router("./data/data.json");
// JSONリクエスト対応
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

// 署名
const JWT_SECRET = "jwt_json_server";
// 有効時間
const EXPIRATION = "1h";
// Cookie
// const KEY = "token";

// データの操作
const db = JSON.parse(fs.readFileSync("./data/data.json", "UTF-8"));
// 記事の検索
const getBlog = (id) => db.blogs.find((blog) => blog.id === Number(id));

// ログイン認証なしのルーター
server.post("/auth/login", (req, resp) => {
  const { email, password } = req.body;
  // ログイン検証
  if (
    db.users.findIndex(
      (user) => user.email === email && user.password === password
    ) === -1
  ) {
    resp.status(401).json("Unauthorized");
    return;
  }

  // ログイン後、アクセストークンの生成
  const access_token = jwt.sign({ email, password }, JWT_SECRET, {
    expiresIn: EXPIRATION,
  });

  resp.status(200).json({ access_token });
  // .cookie(KEY, access_token, {
  //   httpOnly: true,
  //   secure: true,
  // })
  // .json();
});

server.get("/blogs", (req, resp) => {
  const blogs = db.blogs;
  resp.status(200).json({ blogs });
});

server.get("/blog/:id", (req, resp) => {
  const id = req.params.id;
  const blog = getBlog(id);
  resp.status(200).json({ blog });
});

// 認証が必要なルーター
server.use((req, resp, next) => {
  // 認証形式チェック
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
    // req.headers.cookie === undefined ||
    // !req.headers.cookie.startsWith(KEY)
  ) {
    resp.status(401).json("Unauthorized");
    return;
  }

  // 認証チェック
  try {
    var decode = jwt.verify(
      req.headers.authorization.split(" ")[1],
      //   req.headers.cookie.split(KEY + "=")[1],
      JWT_SECRET
    );
    next();
  } catch (e) {
    resp.status(401).json("Unauthorized");
  }
});

// JSON Serverを起動する
server.use(router);
server.use(helmet);
server.listen(33000, () => {
  console.log("JSON Server Start");
});
