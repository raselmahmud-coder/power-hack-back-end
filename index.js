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
//  auth verify function using Json web token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  //   console.log(req?.headers, "headers");
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access request" });
  }
  const token = authHeader.split(" ")[1];
  // console.log("token",token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // console.log("error", err);
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      //   console.log("deCoded", decoded);
      req.decoded = decoded;
      next();
    }
  });
}
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `${process.env.URI}`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

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
  app.post("/registration", verifyJWT, async (req, res) => {
    const addUser = req.body;
    await userCollection.insertOne(addUser);
    // console.log("user", addUser);
    res.send({ response: "success", status: 200 });
  });
  // update data
  app.put("/update-billing/:id", verifyJWT, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, paidAmount } = req.body;
    const query = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: { name, email, phone, paidAmount },
    };
    const result = await billingsCollection.updateOne(
      query,
      updateDoc,
      options
    );
    console.log("udpate", result);
    res.send({ response: "success", status: 200 });
  });
  // delete data
  app.delete("/delete-billing/:id", verifyJWT, async (req, res) => {
    const { id } = req.params;
    const query = { _id: ObjectId(id) };

    const result = await billingsCollection.deleteOne(query);
    console.log("udpate", result);
    res.send({ response: "success", status: 200 });
  });
  // get all info
  app.get("/billing-list", async (req, res) => {
    const header = req.headers;
    //   console.log("header",header);
    const query = {};
    const limit = parseInt(1);
    const offset = parseInt(limit + 9);

    if (header.date) {
      const result = await await billingsCollection
        .find(query)
        .skip(header.date)
        .toArray();
    }
    const result = await await billingsCollection.find(query).toArray();
    console.log("result", result);
    const countCollection = await billingsCollection.countDocuments();

    const totalPages = Math.ceil(countCollection / limit);
    const currentPage = Math.ceil(countCollection % offset);
    console.log(currentPage, "current page", totalPages, "total");
    res.send({ response: result, totalPages, currentPage });
  });

  // post a bill info
  app.post("/add-billing", verifyJWT, async (req, res) => {
    const addBilling = req.body;
    const result = await billingsCollection.insertOne(addBilling);

    if (result) {
      res.send({ response: "success", status: 200 });
      console.log("billing", addBilling);
    }
  });
}
run().catch(console.dir);
