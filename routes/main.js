

const express = require('express');
const router = express.Router();

const mainController = require('../controllers/mainController');
const auth = require('../middleware/auth');

/* -------- BASIC ROUTES -------- */
router.get('/', mainController.home);
router.get('/status', mainController.status);
router.get('/profile', mainController.profile);

/* -------- AUTH ROUTES -------- */
router.post('/auth/register', mainController.register);
router.post('/auth/login', mainController.login);

/* -------- TASK ROUTES (PROTECTED) -------- */
router.get('/tasks', auth, mainController.getTasks);
router.post('/tasks', auth, mainController.createTask);
router.put('/tasks/:id', auth, mainController.updateTask);
router.delete('/tasks/:id', auth, mainController.deleteTask);
router.patch('/tasks/:id/toggle', auth, mainController.toggleTask);

/* -------- RESET ROUTE -------- */
router.get('/reset', mainController.resetTasks);

/* -------- DEBUG ROUTE -------- */
router.get('/debug/users', async (req, res) => {
    try {
        const db = global.db;

        if (!db) {
            return res.status(500).json({ error: "Database not initialized" });
        }

        const users = await db.collection("users").find().toArray();
        res.json(users);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
