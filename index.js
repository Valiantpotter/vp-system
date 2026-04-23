


const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 3000;

const mainRoutes = require("./routes/main");

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
const uri = "mongodb+srv://vpadmin:vp123456@cluster0.t9fi2e1.mongodb.net/vpdb?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db;

// Connect to MongoDB first, then start server
async function startServer() {
    try {
        await client.connect();
        db = client.db("vpdb");

        console.log("Connected to MongoDB");

        // make db available globally
        global.db = db;

        // Routes (ONLY after DB is ready)
        app.use("/", mainRoutes);

        app.listen(PORT, () => {
            console.log(`API running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

startServer();
