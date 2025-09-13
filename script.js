// Global state
let robots = [];
let currentRobot = 'team';
let timerInterval = null;
let timerSeconds = 120;
let timerRunning = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    bindEvents();
    loadData();
    updateDashboard();
    setupMobileMenu();
});

function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    mobileToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Close sidebar when clicking nav items on mobile
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });
}

function initializeApp() {
    // Set current date for performance input
    document.getElementById('performance-date').valueAsDate = new Date();
    
    // Load robots from localStorage
    const savedRobots = localStorage.getItem('robots');
    if (savedRobots) {
        robots = JSON.parse(savedRobots);
        updateRobotSelects();
    } else {
        // Create default robots for demonstration
        robots = [
            {
                id: 'robot1',
                name: 'Atlas MK-I',
                category: 'Autônomo',
                description: 'Robô principal para competições de navegação autônoma',
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                performance: {},
                tasks: [],
                notes: ''
            },
            {
                id: 'robot2',
                name: 'Titan Pro',
                category: 'Combate',
                description: 'Robô especializado em competições de combate',
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                performance: {},
                tasks: [],
                notes: ''
            }
        ];
        saveData();
        updateRobotSelects();
    }
}

function bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
        });
    });
    
    // Modal events
    document.getElementById('add-robot-btn').addEventListener('click', openModal);
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Robot select changes
    document.getElementById('swot-robot-select').addEventListener('change', function() {
        currentRobot = this.value;
        loadSWOT();
    });
    
    document.getElementById('performance-robot-select').addEventListener('change', function() {
        currentRobot = this.value;
        loadPerformance();
    });
    
    document.getElementById('tasks-robot-select').addEventListener('change', function() {
        currentRobot = this.value;
        loadTasks();
    });
    
    document.getElementById('notes-robot-select').addEventListener('change', function() {
        currentRobot = this.value;
        loadNotes();
    });
    
    // SWOT text change events
    ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(type => {
        document.getElementById(`${type}-text`).addEventListener('input', function() {
            saveSWOT();
        });
    });
    
    // Notes change event
    document.getElementById('notes-textarea').addEventListener('input', function() {
        saveNotes();
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query) {
            showToast(`Buscando por: ${query}`, 'info');
        }
    });
    
    // Task enter key
    document.getElementById('new-task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // SWOT inputs enter key
    ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(type => {
        document.getElementById(`${type}-input`).addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addSWOTItem(type);
            }
        });
    });
}

function switchPage(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Update pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard Geral',
        robots: 'Gerenciamento de Robôs',
        swot: 'Análise SWOT',
        performance: 'Análise de Performance',
        tasks: 'Gerenciamento de Tarefas',
        timer: 'Temporizador de Competição',
        notes: 'Anotações da Equipe',
        export: 'Exportar Dados'
    };
    document.getElementById('page-title').textContent = titles[page] || page;
    
    // Load page-specific data
    switch(page) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'robots':
            loadRobots();
            break;
        case 'swot':
            loadSWOT();
            break;
        case 'performance':
            loadPerformance();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'notes':
            loadNotes();
            break;
    }
}

// Robot Management
function openModal() {
    document.getElementById('robot-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('robot-modal').style.display = 'none';
    // Clear form
    document.getElementById('robot-name').value = '';
    document.getElementById('robot-category').value = '';
    document.getElementById('robot-description').value = '';
}

function addRobot() {
    const name = document.getElementById('robot-name').value.trim();
    const category = document.getElementById('robot-category').value.trim();
    const description = document.getElementById('robot-description').value.trim();
    
    if (!name) {
        showToast('Nome do robô é obrigatório', 'error');
        return;
    }
    
    const robot = {
        id: `robot_${Date.now()}`,
        name,
        category: category || 'Geral',
        description,
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        performance: {},
        tasks: [],
        notes: ''
    };
    
    robots.push(robot);
    saveData();
    updateRobotSelects();
    closeModal();
    showToast(`Robô ${name} criado com sucesso!`, 'success');
    loadRobots();
    
    // Add activity
    addActivity(`Novo robô criado: ${name}`, 'success');
}

function deleteRobot(robotId) {
    if (confirm('Tem certeza que deseja deletar este robô? Todos os dados serão perdidos.')) {
        const robotIndex = robots.findIndex(r => r.id === robotId);
        if (robotIndex !== -1) {
            const robotName = robots[robotIndex].name;
            robots.splice(robotIndex, 1);
            saveData();
            updateRobotSelects();
            loadRobots();
            showToast(`Robô ${robotName} deletado`, 'success');
            addActivity(`Robô deletado: ${robotName}`, 'error');
        }
    }
}

function updateRobotSelects() {
    const selects = ['swot-robot-select', 'performance-robot-select', 'tasks-robot-select', 'notes-robot-select'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        // Keep first option (team)
        const teamOption = select.children[0];
        select.innerHTML = '';
        select.appendChild(teamOption);
        
        robots.forEach(robot => {
            const option = document.createElement('option');
            option.value = robot.id;
            option.textContent = robot.name;
            select.appendChild(option);
        });
    });
}

// Dashboard
function updateDashboard() {
    updateKPIs();
    updateCharts();
    loadRecentActivity();
}

function updateKPIs() {
    document.getElementById('total-robots').textContent = robots.length;
    
    let totalTests = 0;
    let totalSuccesses = 0;
    let totalFailures = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    
    robots.forEach(robot => {
        Object.values(robot.performance).forEach(perf => {
            totalTests++;
            totalSuccesses += perf.successes || 0;
            totalFailures += perf.failures || 0;
        });
        
        robot.tasks.forEach(task => {
            if (task.completed) completedTasks++;
            else pendingTasks++;
        });
    });
    
    document.getElementById('total-tests').textContent = totalTests;
    document.getElementById('total-successes').textContent = totalSuccesses;
    document.getElementById('total-failures').textContent = totalFailures;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
}

function updateCharts() {
    drawTeamPerformanceChart();
    drawRobotsComparisonChart();
}

function drawTeamPerformanceChart() {
    const canvas = document.getElementById('team-performance-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Collect all performance data
    const allDates = new Set();
    robots.forEach(robot => {
        Object.keys(robot.performance).forEach(date => allDates.add(date));
    });
    
    const dates = Array.from(allDates).sort().slice(-10); // Last 10 dates
    
    if (dates.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado de performance disponível', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Prepare data
    const successData = [];
    const failureData = [];
    
    dates.forEach(date => {
        let daySuccesses = 0;
        let dayFailures = 0;
        
        robots.forEach(robot => {
            if (robot.performance[date]) {
                daySuccesses += robot.performance[date].successes || 0;
                dayFailures += robot.performance[date].failures || 0;
            }
        });
        
        successData.push(daySuccesses);
        failureData.push(dayFailures);
    });
    
    drawBarChart(ctx, canvas, dates, successData, failureData, 'Sucessos', 'Falhas', '#16a34a', '#dc2626');
}

function drawRobotsComparisonChart() {
    const canvas = document.getElementById('robots-comparison-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (robots.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum robô cadastrado', canvas.width/2, canvas.height/2);
        return;
    }
    
    // Calculate total successes and failures per robot
    const robotNames = [];
    const successData = [];
    const failureData = [];
    
    robots.forEach(robot => {
        robotNames.push(robot.name);
        
        let totalSuccesses = 0;
        let totalFailures = 0;
        
        Object.values(robot.performance).forEach(perf => {
            totalSuccesses += perf.successes || 0;
            totalFailures += perf.failures || 0;
        });
        
        successData.push(totalSuccesses);
        failureData.push(totalFailures);
    });
    
    drawBarChart(ctx, canvas, robotNames, successData, failureData, 'Sucessos', 'Falhas', '#2563eb', '#ea580c');
}

function drawBarChart(ctx, canvas, labels, data1, data2, label1, label2, color1, color2) {
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(...data1, ...data2, 1);
    const barWidth = chartWidth / (labels.length * 2 + 1);
    const barSpacing = barWidth * 0.2;
    
    // Draw axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Draw bars and labels
    labels.forEach((label, index) => {
        const x = padding + (index * 2 + 1) * barWidth;
        
        // Success bar
        const height1 = (data1[index] / maxValue) * chartHeight;
        ctx.fillStyle = color1;
        ctx.fillRect(x, padding + chartHeight - height1, barWidth - barSpacing, height1);
        
        // Failure bar
        const height2 = (data2[index] / maxValue) * chartHeight;
        ctx.fillStyle = color2;
        ctx.fillRect(x + barWidth, padding + chartHeight - height2, barWidth - barSpacing, height2);
        
        // Label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth, padding + chartHeight + 20);
        
        // Values on bars
        if (height1 > 20) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(data1[index], x + (barWidth - barSpacing)/2, padding + chartHeight - height1 + 15);
        }
        
        if (height2 > 20) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(data2[index], x + barWidth + (barWidth - barSpacing)/2, padding + chartHeight - height2 + 15);
        }
    });
    
    // Legend
    ctx.fillStyle = color1;
    ctx.fillRect(padding, 20, 15, 15);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label1, padding + 20, 32);
    
    ctx.fillStyle = color2;
    ctx.fillRect(padding + 80, 20, 15, 15);
    ctx.fillText(label2, padding + 105, 32);
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * i);
        const y = padding + chartHeight - (i * chartHeight / 5);
        ctx.fillText(value.toString(), padding - 10, y + 4);
    }
}

// Robots Page
function loadRobots() {
    const container = document.getElementById('robots-grid');
    container.innerHTML = '';
    
    robots.forEach(robot => {
        const totalSuccesses = Object.values(robot.performance).reduce((sum, perf) => sum + (perf.successes || 0), 0);
        const totalFailures = Object.values(robot.performance).reduce((sum, perf) => sum + (perf.failures || 0), 0);
        const completedTasks = robot.tasks.filter(task => task.completed).length;
        const totalTasks = robot.tasks.length;
        
        const robotCard = document.createElement('div');
        robotCard.className = 'robot-card';
        robotCard.innerHTML = `
            <div class="robot-header">
                <div class="robot-name">${robot.name}</div>
                <div class="robot-category">${robot.category}</div>
            </div>
            <p style="color: #64748b; margin-bottom: 1rem;">${robot.description}</p>
            <div class="robot-stats">
                <div class="robot-stat">
                    <div class="robot-stat-value">${totalSuccesses}</div>
                    <div class="robot-stat-label">Sucessos</div>
                </div>
                <div class="robot-stat">
                    <div class="robot-stat-value">${totalFailures}</div>
                    <div class="robot-stat-label">Falhas</div>
                </div>
                <div class="robot-stat">
                    <div class="robot-stat-value">${completedTasks}/${totalTasks}</div>
                    <div class="robot-stat-label">Tarefas</div>
                </div>
                <div class="robot-stat">
                    <div class="robot-stat-value">${Object.keys(robot.performance).length}</div>
                    <div class="robot-stat-label">Testes</div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
                <button onclick="viewRobotDetails('${robot.id}')" class="btn-primary">Ver Detalhes</button>
                <button onclick="deleteRobot('${robot.id}')" class="btn-error">Deletar</button>
            </div>
        `;
        container.appendChild(robotCard);
    });
}

function viewRobotDetails(robotId) {
    currentRobot = robotId;
    switchPage('swot');
    document.getElementById('swot-robot-select').value = robotId;
    loadSWOT();
}

// SWOT Analysis
function loadSWOT() {
    const data = getCurrentRobotData();
    
    if (data && data.swot) {
        ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(type => {
            const textarea = document.getElementById(`${type}-text`);
            textarea.value = data.swot[type].join('\n');
        });
    } else {
        // Team SWOT - aggregate from all robots
        ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(type => {
            const textarea = document.getElementById(`${type}-text`);
            const allItems = robots.flatMap(robot => robot.swot[type]);
            textarea.value = allItems.join('\n');
        });
    }
}

function saveSWOT() {
    const data = getCurrentRobotData();
    
    if (data) {
        ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(type => {
            const textarea = document.getElementById(`${type}-text`);
            const items = textarea.value.split('\n').filter(item => item.trim() !== '');
            data.swot[type] = items;
        });
        saveData();
    }
}

function addSWOTItem(type) {
    const input = document.getElementById(`${type}-input`);
    const item = input.value.trim();
    
    if (!item) return;
    
    const data = getCurrentRobotData();
    if (data) {
        data.swot[type].push(item);
        saveData();
        loadSWOT();
        input.value = '';
        showToast(`Item adicionado em ${type}`, 'success');
    }
}

// Performance
function loadPerformance() {
    const data = getCurrentRobotData();
    updatePerformanceChart();
    updatePerformanceTable();
}

function addPerformanceData() {
    const date = document.getElementById('performance-date').value;
    const successes = parseInt(document.getElementById('performance-successes').value) || 0;
    const failures = parseInt(document.getElementById('performance-failures').value) || 0;
    
    if (!date) {
        showToast('Data é obrigatória', 'error');
        return;
    }
    
    const data = getCurrentRobotData();
    if (data) {
        data.performance[date] = { successes, failures };
        saveData();
        loadPerformance();
        
        // Clear form
        document.getElementById('performance-successes').value = '';
        document.getElementById('performance-failures').value = '';
        
        showToast('Performance registrada com sucesso', 'success');
        addActivity(`Performance registrada: ${successes} sucessos, ${failures} falhas`, 'success');
        updateDashboard();
    }
}

function updatePerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = getCurrentRobotData();
    if (!data || Object.keys(data.performance).length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado de performance', canvas.width/2, canvas.height/2);
        return;
    }
    
    const dates = Object.keys(data.performance).sort().slice(-10);
    const successData = dates.map(date => data.performance[date].successes || 0);
    const failureData = dates.map(date => data.performance[date].failures || 0);
    
    drawBarChart(ctx, canvas, dates, successData, failureData, 'Sucessos', 'Falhas', '#16a34a', '#dc2626');
}

function updatePerformanceTable() {
    const container = document.getElementById('performance-history');
    const data = getCurrentRobotData();
    
    container.innerHTML = '';
    
    if (!data || Object.keys(data.performance).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum dado de performance</p>';
        return;
    }
    
    const headerRow = document.createElement('div');
    headerRow.className = 'table-row table-header';
    headerRow.innerHTML = '<div>Data</div><div>Sucessos</div><div>Falhas</div>';
    container.appendChild(headerRow);
    
    Object.keys(data.performance).sort().reverse().forEach(date => {
        const perf = data.performance[date];
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `<div>${date}</div><div>${perf.successes || 0}</div><div>${perf.failures || 0}</div>`;
        container.appendChild(row);
    });
}

// Tasks
function loadTasks() {
    const container = document.getElementById('tasks-list');
    const data = getCurrentRobotData();
    
    container.innerHTML = '';
    
    let tasks = [];
    if (data) {
        tasks = data.tasks || [];
    } else {
        // Team tasks - aggregate from all robots
        tasks = robots.flatMap(robot => robot.tasks.map(task => ({...task, robotName: robot.name})));
    }
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhuma tarefa encontrada</p>';
        return;
    }
    
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const priorityClass = task.priority || 'medium';
        
        taskItem.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask('${data ? data.id || 'team' : 'team'}', ${index})">
                <span class="task-text">${task.text}${task.robotName ? ` (${task.robotName})` : ''}</span>
                <span class="task-priority ${priorityClass}">${task.priority || 'média'}</span>
            </div>
            <div class="task-actions">
                <button class="task-delete" onclick="deleteTask('${data ? data.id || 'team' : 'team'}', ${index})">🗑️</button>
            </div>
        `;
        
        container.appendChild(taskItem);
    });
}

function addTask() {
    const input = document.getElementById('new-task-input');
    const priority = document.getElementById('task-priority').value;
    const text = input.value.trim();
    
    if (!text) return;
    
    const task = {
        text,
        priority,
        completed: false,
        createdAt: new Date().toISOString().split('T')[0]
    };
    
    const data = getCurrentRobotData();
    if (data) {
        data.tasks.push(task);
    } else {
        // Add to all robots for team tasks
        robots.forEach(robot => {
            robot.tasks.push({...task});
        });
    }
    
    saveData();
    loadTasks();
    input.value = '';
    showToast('Tarefa adicionada', 'success');
    addActivity(`Nova tarefa criada: ${text}`, 'success');
    updateDashboard();
}

function toggleTask(robotId, taskIndex) {
    if (robotId === 'team') {
        // Handle team tasks
        let globalIndex = 0;
        for (let robot of robots) {
            if (globalIndex + robot.tasks.length > taskIndex) {
                const localIndex = taskIndex - globalIndex;
                robot.tasks[localIndex].completed = !robot.tasks[localIndex].completed;
                break;
            }
            globalIndex += robot.tasks.length;
        }
    } else {
        const robot = robots.find(r => r.id === robotId);
        if (robot && robot.tasks[taskIndex]) {
            robot.tasks[taskIndex].completed = !robot.tasks[taskIndex].completed;
        }
    }
    
    saveData();
    loadTasks();
    updateDashboard();
}

function deleteTask(robotId, taskIndex) {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
        if (robotId === 'team') {
            let globalIndex = 0;
            for (let robot of robots) {
                if (globalIndex + robot.tasks.length > taskIndex) {
                    const localIndex = taskIndex - globalIndex;
                    robot.tasks.splice(localIndex, 1);
                    break;
                }
                globalIndex += robot.tasks.length;
            }
        } else {
            const robot = robots.find(r => r.id === robotId);
            if (robot && robot.tasks[taskIndex]) {
                robot.tasks.splice(taskIndex, 1);
            }
        }
        
        saveData();
        loadTasks();
        showToast('Tarefa deletada', 'success');
        updateDashboard();
    }
}

// Timer
function startTimer() {
    if (!timerRunning && timerSeconds > 0) {
        timerRunning = true;
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                timerRunning = false;
                clearInterval(timerInterval);
                showToast('Tempo esgotado!', 'error');
                addActivity('Temporizador finalizado', 'info');
            }
        }, 1000);
        showToast('Timer iniciado', 'success');
    }
}

function pauseTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    showToast('Timer pausado', 'info');
}

function resetTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerSeconds = 120;
    updateTimerDisplay();
    showToast('Timer resetado', 'info');
}

function setTimer(seconds) {
    if (!timerRunning) {
        timerSeconds = seconds;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer-display').textContent = display;
    
    // Change color based on remaining time
    const timerDisplay = document.getElementById('timer-display');
    if (timerSeconds <= 10) {
        timerDisplay.style.color = '#dc2626';
    } else if (timerSeconds <= 30) {
        timerDisplay.style.color = '#ea580c';
    } else {
        timerDisplay.style.color = '#1e293b';
    }
}

// Notes
function loadNotes() {
    const data = getCurrentRobotData();
    const textarea = document.getElementById('notes-textarea');
    
    if (data) {
        textarea.value = data.notes || '';
    } else {
        // Team notes - show all robot notes
        const allNotes = robots.map(robot => `=== ${robot.name} ===\n${robot.notes || 'Nenhuma anotação'}\n`).join('\n');
        textarea.value = allNotes;
    }
}

function saveNotes() {
    const data = getCurrentRobotData();
    if (data) {
        const textarea = document.getElementById('notes-textarea');
        data.notes = textarea.value;
        saveData();
        showToast('Anotações salvas', 'success');
    }
}

// Export
function exportData(type, format) {
    let data;
    let filename;
    
    switch(type) {
        case 'swot':
            data = robots.map(robot => ({
                name: robot.name,
                category: robot.category,
                swot: robot.swot
            }));
            filename = `swot_data.${format}`;
            break;
            
        case 'performance':
            data = robots.map(robot => ({
                name: robot.name,
                category: robot.category,
                performance: robot.performance
            }));
            filename = `performance_data.${format}`;
            break;
            
        case 'tasks':
            data = robots.map(robot => ({
                name: robot.name,
                category: robot.category,
                tasks: robot.tasks
            }));
            filename = `tasks_data.${format}`;
            break;
            
        case 'all':
            data = robots;
            filename = `complete_data.${format}`;
            break;
    }
    
    if (format === 'json') {
        downloadJSON(data, filename);
    } else {
        downloadCSV(data, filename, type);
    }
    
    showToast(`Dados exportados: ${filename}`, 'success');
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadCSV(data, filename, type) {
    let csv = '';
    
    switch(type) {
        case 'swot':
            csv = 'Robot,Category,Type,Item\n';
            data.forEach(robot => {
                ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(swotType => {
                    robot.swot[swotType].forEach(item => {
                        csv += `"${robot.name}","${robot.category}","${swotType}","${item}"\n`;
                    });
                });
            });
            break;
            
        case 'performance':
            csv = 'Robot,Category,Date,Successes,Failures\n';
            data.forEach(robot => {
                Object.keys(robot.performance).forEach(date => {
                    const perf = robot.performance[date];
                    csv += `"${robot.name}","${robot.category}","${date}","${perf.successes}","${perf.failures}"\n`;
                });
            });
            break;
            
        case 'tasks':
            csv = 'Robot,Category,Task,Priority,Status,Created\n';
            data.forEach(robot => {
                robot.tasks.forEach(task => {
                    csv += `"${robot.name}","${robot.category}","${task.text}","${task.priority}","${task.completed ? 'Completed' : 'Pending'}","${task.createdAt}"\n`;
                });
            });
            break;
            
        case 'all':
            // Complex CSV for all data
            csv = 'Robot,Category,Description,Data_Type,Content\n';
            data.forEach(robot => {
                csv += `"${robot.name}","${robot.category}","${robot.description}","info","Robot Info"\n`;
                
                // SWOT
                ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(swotType => {
                    robot.swot[swotType].forEach(item => {
                        csv += `"${robot.name}","${robot.category}","${robot.description}","swot_${swotType}","${item}"\n`;
                    });
                });
                
                // Performance
                Object.keys(robot.performance).forEach(date => {
                    const perf = robot.performance[date];
                    csv += `"${robot.name}","${robot.category}","${robot.description}","performance","${date}: ${perf.successes} successes, ${perf.failures} failures"\n`;
                });
                
                // Tasks
                robot.tasks.forEach(task => {
                    csv += `"${robot.name}","${robot.category}","${robot.description}","task","${task.text} (${task.priority}, ${task.completed ? 'completed' : 'pending'})"\n`;
                });
            });
            break;
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility Functions
function getCurrentRobotData() {
    if (currentRobot === 'team') return null;
    return robots.find(r => r.id === currentRobot);
}

function saveData() {
    localStorage.setItem('robots', JSON.stringify(robots));
    localStorage.setItem('activities', JSON.stringify(activities));
}

function loadData() {
    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
        activities = JSON.parse(savedActivities);
    }
}

// Activity Log
let activities = [];

function addActivity(message, type = 'info') {
    const activity = {
        message,
        type,
        timestamp: new Date().toLocaleString('pt-BR')
    };
    
    activities.unshift(activity);
    if (activities.length > 50) {
        activities = activities.slice(0, 50); // Keep only last 50
    }
    
    saveData();
    loadRecentActivity();
}

function loadRecentActivity() {
    const container = document.getElementById('activity-list');
    container.innerHTML = '';
    
    activities.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${activity.type}`;
        activityItem.innerHTML = `
            <div style="font-weight: 500;">${activity.message}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${activity.timestamp}</div>
        `;
        container.appendChild(activityItem);
    });
    
    if (activities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhuma atividade recente</p>';
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}