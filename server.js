const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const fse = require('fs-extra');
const httpPort = 80;

const app = express();
app.use(express.json());

const TASKS_FILE_PATH = path.join(__dirname, "tasks.json");


app.use((req, res, next) => {
    console.log(new Date().toLocaleString() + " " + req.url);
    next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const webpush = require('web-push');

const SUBS_FILENAME = 'subscriptions.json';
let subscriptions = [];

try {
    const subscriptionsData = fs.readFileSync(SUBS_FILENAME, 'utf8');
    const parsedSubscriptions = JSON.parse(subscriptionsData);

    if (Array.isArray(parsedSubscriptions)) {
        subscriptions = parsedSubscriptions;
    } else {
        console.error("Invalid subscriptions data. Using empty array.");
    }
} catch (error) {
    console.error(error);
}

app.post("/saveSubscription", function(req, res) {
    console.log(req.body);
    let sub = req.body.sub;
    subscriptions.push(sub);
    fs.writeFileSync(SUBS_FILENAME, JSON.stringify(subscriptions));
    res.json({
        success: true
    });
});

const taskFilePath = path.join(__dirname, "task-manager-pwa", "tasks.json");

app.post("/savetask", function (req, res) {
    try {
        const tasks = loadTasks();

        const newTask = {
            id: generateUniqueId(),
            title: req.body.title,
            description: req.body.description,
        };

        tasks.push(newTask);

        saveTasks(tasks);

        res.json({ success: true, id: newTask.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal Server Error'
            }
        });
    }
});

function loadTasks() {
    try {
        const tasksData = fs.readFileSync(taskFilePath, 'utf8');
        return JSON.parse(tasksData) || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function saveTasks(tasks) {
    try {
        fs.writeFileSync(taskFilePath, JSON.stringify(tasks, null, 2));
    } catch (error) {
        console.error(error);
    }
}

function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
}

app.get("/getTasks", function (req, res) {
    try {
        const tasksData = fs.readFileSync(TASKS_FILE_PATH, 'utf8');
        const tasks = JSON.parse(tasksData);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
});

app.listen(httpPort, function () {
    console.log(`HTTP listening on port: ${httpPort}`);
});

