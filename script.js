// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function isTaskDue(dueDate) {
    if (!dueDate) return false;
    const now = new Date();
    const taskDate = new Date(dueDate);
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round((taskDate - now) / oneDay);
    
    return diffDays <= 1; // Due within 24 hours
}

function isTaskOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

// Check for due tasks and show notifications
function checkDueTasks() {
    tasks.forEach(task => {
        if (task.dueDate && !task.completed) {
            const dueIn = new Date(task.dueDate) - new Date();
            // If due in less than 1 hour
            if (dueIn > 0 && dueIn < 60 * 60 * 1000) {
                showNotification(`Task due soon: ${task.text}`, {
                    body: `Due at ${formatDate(task.dueDate)}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828270.png'
                });
            }
        }
    });
}

// Show browser notification
function showNotification(title, options = {}) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, options);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('taskDueDate');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    // Set minimum date to today
    const today = new Date().toISOString().slice(0, 16);
    dueDateInput.min = today;

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Check for due tasks every 5 minutes
    checkDueTasks();
    setInterval(checkDueTasks, 5 * 60 * 1000);

    // Display tasks based on current filter
    function displayTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true; // 'all' filter
        });

        filteredTasks.forEach((task, index) => {
            const originalIndex = tasks.findIndex(t => t.id === task.id);
            const taskClass = [
                'task-item',
                task.completed ? 'completed' : '',
                isTaskOverdue(task.dueDate) ? 'overdue' : '',
                !task.completed && isTaskDue(task.dueDate) ? 'due-soon' : ''
            ].filter(Boolean).join(' ');
            
            const li = document.createElement('li');
            li.className = taskClass;
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text" contenteditable="true">${task.text}</span>
                    ${task.dueDate ? `<span class="due-date">Due: ${formatDate(task.dueDate)}</span>` : ''}
                </div>
                <button class="delete-btn">✕</button>
            `;
            
            // Toggle task completion
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = checkbox.checked;
                    li.classList.toggle('completed', checkbox.checked);
                    saveTasks();
                    if (currentFilter !== 'all') {
                        displayTasks();
                    }
                }
            });

            // Delete task
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tasks = tasks.filter(t => t.id !== task.id);
                displayTasks();
                saveTasks();
            });

            // Edit task text
            const taskText = li.querySelector('.task-text');
            setupTaskEditListeners(taskText, task.id);

            taskList.appendChild(li);
        });
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Add new task
    function addTask() {
        const text = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        
        if (text !== '') {
            tasks.push({ 
                id: Date.now().toString(),
                text, 
                completed: false,
                dueDate: dueDate || null,
                createdAt: new Date().toISOString()
            });
            
            taskInput.value = '';
            dueDateInput.value = '';
            saveTasks();
            displayTasks();
            
            // If due date is set, schedule a notification
            if (dueDate) {
                const timeUntilDue = new Date(dueDate) - new Date();
                if (timeUntilDue > 0) {
                    const notificationTime = Math.min(timeUntilDue - (60 * 60 * 1000), timeUntilDue - 1000); // 1 hour before or 1 second before if less than 1 hour
                    if (notificationTime > 0) {
                        setTimeout(() => {
                            showNotification(`Task due soon: ${text}`, {
                                body: `Due at ${formatDate(dueDate)}`,
                                icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828270.png'
                            });
                        }, notificationTime);
                    }
                }
            }
        }
    }

    // Edit task text
    function setupTaskEditListeners(taskTextElement, taskId) {
        taskTextElement.addEventListener('blur', () => {
            const taskIndex = tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].text = taskTextElement.textContent.trim();
                saveTasks();
            }
        });

        taskTextElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                taskTextElement.blur();
            }
        });
    }

    // Filter tasks
    function setFilter(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        displayTasks();
    }

    // Event listeners
    addBtn.addEventListener('click', addTask);
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTask();
        }
    };
    
    taskInput.addEventListener('keypress', handleKeyPress);
    dueDateInput.addEventListener('keypress', handleKeyPress);
    
    // Request notification permission on user interaction
    document.addEventListener('click', () => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, { once: true });

    // Filter button click handlers
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            setFilter(button.dataset.filter);
        });
    });

    // Initial display with 'all' filter
    setFilter('all');
});
