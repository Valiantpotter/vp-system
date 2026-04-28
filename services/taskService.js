
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/tasks.json');

const getAllTasks = () => {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
};

const saveAllTasks = (tasks) => {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

const deleteTask = (id) => {
    const tasks = getAllTasks();

    const filteredTasks = tasks.filter(task => task._id !== id);

    saveAllTasks(filteredTasks);

    return { message: "Task deleted successfully" };
};
 module.exports = {
    getAllTasks,
    saveAllTasks,
    deleteTask
};
