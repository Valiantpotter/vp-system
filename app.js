


require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ROOT */
app.get("/", (req, res) => {
    res.json({ status: "API running" });
});

/* MODELS */
const User = mongoose.model("User", {
    email: String,
    password: String
});

const Workspace = mongoose.model("Workspace", {
    name: String,
    userId: String
});

const Task = mongoose.model("Task", {
    title: String,
    completed: { type: Boolean, default: false },
    userId: String,
    workspaceId: String,
    labels: [String],
    order: { type: Number, default: 0 }
});

/* AUTH */
function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token provided" });

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Malformed token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

/* REGISTER */
app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: "User exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ email, password: hashed });

        res.json({ message: "User created", userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* LOGIN */
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "User not found" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* WORKSPACES */
app.post("/workspaces", auth, async (req, res) => {
    const ws = await Workspace.create({
        name: req.body.name,
        userId: req.user.id
    });

    res.json(ws);
});

app.get("/workspaces", auth, async (req, res) => {
    const ws = await Workspace.find({ userId: req.user.id });
    res.json(ws);
});

app.get("/tasks", auth, async (req, res) => {
    const tasks = await Task.find({ userId: req.user.id }).sort({ order: 1 });
    res.json(tasks);
});

/* TASKS - GET (WORKSPACE BASED) */
app.get("/tasks/:workspaceId", auth, async (req, res) => {
    const tasks = await Task.find({
        userId: req.user.id,
        workspaceId: req.params.workspaceId
    }).sort({ order: 1 });

    res.json(tasks);
});

/* CREATE TASK */
app.post("/tasks", auth, async (req, res) => {
    const { title, workspaceId, labels } = req.body;

    const count = await Task.countDocuments({
        userId: req.user.id,
        workspaceId
    });

    const task = await Task.create({
        title,
        userId: req.user.id,
        workspaceId,
        labels: labels || [],
        order: count
    });

    io.emit("task-create", task);
    res.json(task);
});

/* TOGGLE */
app.put("/tasks/:id", auth, async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Not found" });

    task.completed = !task.completed;
    await task.save();

    io.emit("task-update", task);
    res.json(task);
});

/* EDIT */
app.patch("/tasks/:id", auth, async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Not found" });

    task.title = req.body.title;
    await task.save();

    io.emit("task-update", task);
    res.json(task);
});

/* DELETE */
app.delete("/tasks/:id", auth, async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);

    io.emit("task-delete", req.params.id);
    res.json({ success: true });
});

/* REORDER */
app.put("/tasks/reorder", auth, async (req, res) => {
    const { tasks } = req.body;

    for (let i = 0; i < tasks.length; i++) {
        await Task.findByIdAndUpdate(tasks[i]._id, {
            order: i
        });
    }

    res.json({ success: true });
});

/* SOCKET */
io.on("connection", (socket) => {
    console.log("User connected");
});

/* CONNECT DB */
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("MongoDB connected");

    server.listen(PORT, () => {
        console.log("Server running on port " + PORT);
    });
})
.catch(err => console.log(err));
