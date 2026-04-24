


const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

// Use Render dynamic port
const PORT = process.env.PORT || 3000;

const mainRoutes = require("./routes/main");

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection string
const uri = "mongodb+srv://vpadmin:vp123456@cluster0.t9fi2e1.mongodb.net/vpdb?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db;

// Connect to MongoDB first, then start server
async function startServer() {
    try {
        await client.connect();
        db = client.db("vpdb");

        console.log("Connected to MongoDB");

        // Make DB globally available
        global.db = db;

        // Load routes after DB is ready
        app.use("/", mainRoutes);

        // Start server on correct port (Render safe)
        app.listen(PORT, () => {
            console.log(`API running on port ${PORT}`);
        });

    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

startServer();
