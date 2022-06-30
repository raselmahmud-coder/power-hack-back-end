require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("power hacks server running");
});
app.listen(port, () => {
  console.log(`power hacks app listening on port ${port}`);
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `${process.env.URI}`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
    // console.log("error", err);
    // console.log("decoded", decoded);
  });
}
async function run() {
  client.connect((err) => {
    if (err) {
      console.log("database error", err);
    }
    console.log("connected");
  });
  const billingsCollection = client.db("power_hacks").collection("billings");
  const userCollection = client.db("power_hacks").collection("users");
  // user get or login
  app.get("/login", async (req, res) => {
    const { email, password } = req.headers;
    console.log(email, "got it", password);
    // const user = req.body;
    const filter = { email: email };
    const found = await userCollection.findOne(filter);
    //   console.log(found);
    if (found.email === email && found.password === password) {
      console.log("info true");
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ response: "success", status: 200, token });
    } else {
      res.send({ response: "not found user", status: 400 });
    }
  });
  // user creation
  app.post("/registration", async (req, res) => {
    const addUser = req.body;
    await userCollection.insertOne(addUser);
    console.log("user", addUser);
    res.send({ response: "success", status: 200 });
  });

  // get all info
  app.get("/billing-list", async (req, res) => {
    const header = req.headers;
    const query = {};
    const options = {
      sort: { title: 1 },
      projection: { _id: 0, title: 1, imdb: 1 },
    };
    const cursor = await billingsCollection.find(query).toArray();
    /* if ((await cursor.count()) === 0) {
            console.log("No documents found!");
        } */
    // console.log(cursor);
    res.send(cursor);
  });

  // post a bill info
  app.post("/add-billing", async (req, res) => {
    const addBilling = req.body;
    // const result = await billingsCollection.insertOne(addBilling);

    // if (result) {
    // }
    res.send({ response: "success", status: 200 });
    // console.log("billing",addBilling);
  });
}
run().catch(console.dir);
