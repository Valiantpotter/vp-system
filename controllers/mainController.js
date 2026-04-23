

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

console.log("MAIN CONTROLLER LOADED");

/* ---------------- DB SETUP ---------------- */
const uri =
  "mongodb+srv://vpadmin:vp123456@cluster0.t9fi2e1.mongodb.net/vpdb?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db;

/* ---------------- CONNECT DB ---------------- */
async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("vpdb");
        console.log("DB connected");
    }
    return db;
}

/* ---------------- HOME ---------------- */
exports.home = (req, res) => {
    res.json({
        status: "ok",
        message: "VP API is running"
    });
};

/* ---------------- STATUS ---------------- */
exports.status = (req, res) => {
    res.json({ status: "ok" });
};

/* ---------------- PROFILE ---------------- */
exports.profile = (req, res) => {
    res.json({
        name: "VP System",
        version: "1.0",
        status: "active"
    });
};

/* ---------------- GET TASKS ---------------- */
exports.getTasks = async (req, res) => {
    try {
        await connectDB();
        const collection = db.collection("tasks");

const tasks = await collection.find({ userId: req.user.id }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------------- CREATE TASK ---------------- */
exports.createTask = async (req, res) => {
    try {
        await connectDB();
        const collection = db.collection("tasks");

        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ error: "title is required" });
        }

const task = {
    title,
    status: "pending",
    userId: req.user.id,
    createdAt: new Date(),
    updatedAt: null
};

        const result = await collection.insertOne(task);

        res.status(201).json({
            _id: result.insertedId,
            ...task
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------------- UPDATE TASK ---------------- */
exports.updateTask = async (req, res) => {
    try {
console.log(">>> UPDATE TASK HIT <<<");
console.log("UPDATE TASK EXECUTED");
        const collection = db.collection("tasks");

        const id = req.params.id;

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "completed",
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({
            message: "updated",
            matched: result.matchedCount,
            modified: result.modifiedCount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ---------------- DELETE TASK ---------------- */
exports.deleteTask = async (req, res) => {
    try {
        await connectDB();
        const collection = db.collection("tasks");

        const id = req.params.id;

        const result = await collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({
            message: "Task deleted successfully",
            result
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------------- TOGGLE TASK ---------------- */
exports.toggleTask = async (req, res) => {
    try {
        await connectDB();
        const collection = db.collection("tasks");

        const id = req.params.id;

        const task = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const newStatus =
            task.status === "pending" ? "completed" : "pending";

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: newStatus,
                    updatedAt: new Date()
                }
            }
        );

        res.json({
            message: "Task toggled",
            status: newStatus
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------------- STATS ---------------- */
exports.getStats = async (req, res) => {
    try {
        await connectDB();
        const collection = db.collection("tasks");

        const total = await collection.countDocuments();
        const completed = await collection.countDocuments({ status: "completed" });
        const pending = await collection.countDocuments({ status: "pending" });

        res.json({
            total,
            completed,
            pending
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------------- REGISTER ---------------- */
exports.register = async (req, res) => {
    try {
        const db = global.db;
        const collection = db.collection("users");

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const existingUser = await collection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        await collection.insertOne(newUser);

        res.json({
            message: "User created successfully"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ---------------- LOGIN ---------------- */
exports.login = async (req, res) => {
    try {
        const db = global.db;
        const collection = db.collection("users");

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const user = await collection.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            "secret_key_123",
            { expiresIn: "1d" }
        );

        return res.json({
            message: "Login successful",
            token
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
