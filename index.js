const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const postCollection = client.db("ovigo").collection("posts");

    // create a user
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    // find a single user
    app.get("/findUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // create a new community
    app.post("/allCommunities", async (req, res) => {
      const communityInfo = req.body;
      const result = await communityCollection.insertOne(communityInfo);
      res.send(result);
    });

    // get data of all communities
    app.get("/allCommunities", async (req, res) => {
      const result = await communityCollection.find().toArray();
      res.send(result);
    });

    // user community data for specific user
    app.get("/userCommunity", async (req, res) => {
      let query = {};
      if (req.query.userEmail) {
        query = { adminEmail: req.query.userEmail };
      } else {
        return res.status(400).json({
          success: false,
          message: "User doesn't have a community",
        });
      }
      const result = await communityCollection.find(query).toArray();
      res.send(result);
    });

    // joined communities list - finding user data
    app.get("/joinedCommunities", async (req, res) => {
      let query = {};
      if (req.query.userEmail) {
        query = { email: req.query.userEmail };
      } else {
        return res.status(400).json({
          success: false,
          message: "User never joined a community.",
        });
      }
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //   single community details
    app.get("/allCommunities/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await communityCollection.findOne(query);
      res.send(result);
    });

    // join a community
    app.patch("/joinCommunity/:id", async (req, res) => {
      const id = req.params.id;
      const memberEmail = req.body.userEmail;
      const community = await communityCollection.findOne({
        _id: new ObjectId(id),
      });
      if (community.members.includes(memberEmail)) {
        return res.status(400).json({
          success: false,
          message: "Member already exists in the community.",
        });
      }
      const query = { _id: new ObjectId(id) };
      const update = { $push: { members: memberEmail } };

      const result = await communityCollection.updateOne(query, update);
      res.send(result);
    }),
      app.patch("/updateUser/:id", async (req, res) => {
        const communityID = req.params.id;
        const email = req.body.userEmail;
        const user = await userCollection.findOne({
          email: email,
        });
        if (user?.communities?.includes(communityID)) {
          return res.status(400).json({
            success: false,
            message: "Member already exists in the community.",
          });
        }
        const query = { email: email };
        const updateUser = { $push: { communities: communityID } };
        const result = await userCollection.updateOne(query, updateUser);
        res.send(result);
      });

    // leave community
    app.patch("/leaveCommunity/:id", async (req, res) => {
      const id = req.params.id;
      const memberEmail = req.body.email;

      const community = await communityCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!community.members.includes(memberEmail)) {
        return res.status(400).json({
          success: false,
          message: "Member does not exist in the community.",
        });
      }

      const query = { _id: new ObjectId(id) };
      const update = { $pull: { members: memberEmail } };

      const result = await communityCollection.updateOne(query, update);

      // remove community from user's list of communities
      const updateUserQuery = { email: memberEmail };
      const updateUserUpdate = { $pull: { communities: id } };
      await userCollection.updateOne(updateUserQuery, updateUserUpdate);

      res.send(result);
    });

    // post in community
    app.post("/post-in-community", async (req, res) => {
      const newPost = req.body;
      console.log(newPost);
      const result = await postCollection.insertOne(newPost);
      res.send(result);
    });

    // post of specific id
    app.get("/view-posts/:communityID", async (req, res) => {
      const communityID = req.params.communityID;
      const query = { communityID: communityID };
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    // all posts
    app.get("/all-posts", async (req, res) => {
      const result = await postCollection.find().toArray();
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
