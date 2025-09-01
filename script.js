document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

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
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text" contenteditable="true">${task.text}</span>
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
        if (text !== '') {
            tasks.push({ 
                id: Date.now().toString(),
                text, 
                completed: false 
            });
            taskInput.value = '';
            saveTasks();
            displayTasks();
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
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Filter button click handlers
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            setFilter(button.dataset.filter);
        });
    });

    // Initial display with 'all' filter
    setFilter('all');
});
