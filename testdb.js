
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://vpadmin:vp123456@cluster0.t9fi2e1.mongodb.net/vpdb?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("CONNECTED OK");
  } catch (e) {
    console.log("FAILED:", e);
  } finally {
    await client.close();
  }
}

run();
