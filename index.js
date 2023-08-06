const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zilkyvq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // collections
    const userCollection = client.db("ovigo").collection("users");
    const communityCollection = client.db("ovigo").collection("communities");

    // create a user
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existingUser = await userCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    // create a new community
    app.post("/allCommunities", async (req, res) => {
      const communityInfo = req.body;
      //   console.log(communityInfo);
      const result = await communityCollection.insertOne(communityInfo);
      res.send(result);
    });

    // get data of all communities
    app.get("/allCommunities", async (req, res) => {
      const result = await communityCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The server is running");
});

app.listen(port, (req, res) => {
  console.log(`The server is running on port: ${port}`);
});
