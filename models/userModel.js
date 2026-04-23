

const { ObjectId } = require("mongodb");

function createUserModel(db) {
    const collection = db.collection("users");

    return {
        collection,

        async createUser(user) {
            return await collection.insertOne(user);
        },

        async findByEmail(email) {
            return await collection.findOne({ email });
        },

        async findById(id) {
            return await collection.findOne({ _id: new ObjectId(id) });
        }
    };
}

module.exports = createUserModel;
