    const statusElement = document.getElementById('status');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const batteryLevelElement = document.getElementById('battery-level');
    const btnEnableNotifications = document.getElementById('btnEnableNotifications');
    const installButton = document.getElementById('installButton');
    let deferredPrompt;

    if ('getBattery' in navigator) {
        navigator.getBattery()
            .then((battery) => {
                console.log('Battery Level:', battery.level);
                updateBatteryLevel(battery.level);

                battery.addEventListener('levelchange', () => {
                    console.log('Battery Level Changed:', battery.level);
                    updateBatteryLevel(battery.level);
                });
            })
            .catch((error) => {
                console.error('Error accessing Battery API:', error);
            });
    } else {
        console.warn('Battery API not supported');
    }

    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            addTask(taskText);
            taskInput.value = '';
        } else {
            console.log('Task text is empty. Not adding a new task.');
        }
    });

    taskList.addEventListener('click', (event) => {
        const target = event.target;

        if (target.tagName === 'INPUT' && target.type === 'checkbox') {
            const taskItem = target.closest('li');
            toggleTaskCompletion(taskItem);
        }

        if (target.tagName === 'BUTTON' && target.classList.contains('remove-task')) {
            const taskItem = target.closest('li');
            removeTask(taskItem);
        }
    });


    function removeTask(taskItem) {
        const taskId = taskItem.dataset.id;
        console.log('Removing task with ID:', taskId);

        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const updatedTasks = tasks.filter(task => task.timestamp !== parseInt(taskId));
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        taskItem.remove();
    }

    function toggleTaskCompletion(taskItem) {
        const taskId = taskItem.dataset.id;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const updatedTasks = tasks.map(task => {
            if (task.timestamp === parseInt(taskId)) {
                task.completed = !task.completed;
            }
            return task;
        });
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        updateTaskDisplay(taskItem);
    }

    function updateTaskDisplay(taskItem) {
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        const isCompleted = checkbox.checked;
        taskItem.classList.toggle('completed', isCompleted);
    }

    displayTasks();

    navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('taskSync')
            .then(() => {
                console.log('Task sync registered');
            })
            .catch((error) => {
                console.error('Task sync registration failed:', error);
            });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data === 'taskSync') {
            syncTasks();
        }
    });

    function addTask(taskText) {
        const task = {
            text: taskText,
            completed: false,
            timestamp: new Date().getTime()
        };

        saveTaskLocally(task);

        displayTask(task);

        triggerSync('taskSync');
    }

    function saveTaskLocally(task) {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function displayTasks() {
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            taskList.innerHTML = '';
            tasks.forEach(displayTask);
        } catch (error) {
            console.error('Error displaying tasks:', error);
        }
    }

    function displayTask(task) {
        const taskItem = document.createElement('li');
        taskItem.dataset.id = task.timestamp;
        taskItem.innerHTML = `
            <span>${task.text}</span>
            <button class="remove-task">Done!</button>
        `;
        taskList.appendChild(taskItem);
    }

    function triggerSync(tag) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register(tag);
        });
    }

    async function syncTasks() {
        try {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            console.log('Syncing tasks with the server:', tasks);
        } catch (error) {
            console.error('Error syncing tasks:', error);
        }
    }

    function updateBatteryLevel(level) {
        batteryLevelElement.textContent = `Battery Level: ${Math.floor(level * 100)}%`;
    }

    statusElement.textContent = 'Ready!';
