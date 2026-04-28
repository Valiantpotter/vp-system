



require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

/* ROOT ROUTE */
app.get("/", (req, res) => {
    res.json({ status: "API running" });
});

/* CONNECT DB */
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/* MODELS */
const User = mongoose.model("User", {
    email: String,
    password: String
});

const Task = mongoose.model("Task", {
    title: String,
    completed: { type: Boolean, default: false },
    userId: String
});

/* AUTH MIDDLEWARE */
function auth(req, res, next) {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

/* REGISTER (multi-user system starts here) */
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ email, password: hashed });

    res.json(user);
});

/* LOGIN */
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET
    );

    res.json({ token });
});

/* TASKS (user isolated) */
app.get("/tasks", auth, async (req, res) => {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
});

app.post("/tasks", auth, async (req, res) => {
    const task = await Task.create({
        title: req.body.title,
        userId: req.user.id
    });

    res.json(task);
});

app.put("/tasks/:id", auth, async (req, res) => {
    const task = await Task.findById(req.params.id);
    task.completed = !task.completed;
    await task.save();
    res.json(task);
});

app.patch("/tasks/:id", auth, async (req, res) => {
    const task = await Task.findById(req.params.id);
    task.title = req.body.title;
    await task.save();
    res.json(task);
});

app.delete("/tasks/:id", auth, async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
