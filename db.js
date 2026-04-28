

const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://vpadmin:vp123456@cluster0.t9fi2e1.mongodb.net/vpdb?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("vpdb");
        console.log("CONNECTED TO MONGODB");
    }
    return db;
}

function getDB() {
    return db;
}

module.exports = {
    connectDB,
    getDB
};
