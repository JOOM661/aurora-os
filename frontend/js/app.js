// Main Application Script for Aurora-X OS

class AuroraOS {
    constructor() {
        this.windows = [];
        this.zIndex = 100;
        this.currentUser = null;
        this.websockets = {};
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Initialize desktop
        this.initDesktop();
        
        // Connect WebSockets
        this.connectWebSockets();
        
        // Start system monitor
        this.startSystemMonitor();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            
            this.currentUser = await response.json();
            this.updateUserDisplay();
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    updateUserDisplay() {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay && this.currentUser) {
            userDisplay.textContent = `${this.currentUser.username} [${this.currentUser.role.toUpperCase()}]`;
        }
    }

    initDesktop() {
        this.initClock();
        this.initDesktopIcons();
        this.initTaskbar();
        this.initStartMenu();
    }

    initClock() {
        const updateClock = () => {
            const now = new Date();
            const clock = document.getElementById('clock');
            if (clock) {
                clock.textContent = now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    initDesktopIcons() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const app = icon.dataset.app;
                this.openApp(app);
            });
        });
    }

    initTaskbar() {
        // Taskbar functionality will be implemented here
    }

    initStartMenu() {
        const startButton = document.querySelector('.start-button');
        const startMenu = document.getElementById('startMenu');
        
        if (startButton && startMenu) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                startMenu.classList.toggle('hidden');
            });
            
            // Close menu when clicking elsewhere
            document.addEventListener('click', () => {
                startMenu.classList.add('hidden');
            });
        }
    }

    connectWebSockets() {
        // Connect to system WebSocket
        this.connectSystemWS();
        
        // Connect to telemetry WebSocket
        this.connectTelemetryWS();
        
        // Connect to radar WebSocket
        this.connectRadarWS();
    }

    connectSystemWS() {
        const ws = new WebSocket(`ws://${window.location.host}/ws/system`);
        
        ws.onopen = () => {
            console.log('System WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateSystemStatus(data);
        };
        
        ws.onerror = (error) => {
            console.error('System WebSocket error:', error);
        };
        
        ws.onclose = () => {
            setTimeout(() => this.connectSystemWS(), 3000);
        };
        
        this.websockets.system = ws;
    }

    connectTelemetryWS() {
        const ws = new WebSocket(`ws://${window.location.host}/ws/telemetry`);
        
        ws.onopen = () => {
            console.log('Telemetry WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateTelemetry(data);
        };
        
        ws.onerror = (error) => {
            console.error('Telemetry WebSocket error:', error);
        };
        
        ws.onclose = () => {
            setTimeout(() => this.connectTelemetryWS(), 3000);
        };
        
        this.websockets.telemetry = ws;
    }

    connectRadarWS() {
        const ws = new WebSocket(`ws://${window.location.host}/ws/radar`);
        
        ws.onopen = () => {
            console.log('Radar WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (window.radarApp) {
                window.radarApp.updateTargets(data.targets);
            }
        };
        
        ws.onerror = (error) => {
            console.error('Radar WebSocket error:', error);
        };
        
        ws.onclose = () => {
            setTimeout(() => this.connectRadarWS(), 3000);
        };
        
        this.websockets.radar = ws;
    }

    updateSystemStatus(data) {
        // Update system status indicators
        const cpuElement = document.getElementById('cpuUsage');
        const memoryElement = document.getElementById('memoryUsage');
        const networkElement = document.getElementById('networkUsage');
        
        if (cpuElement) cpuElement.textContent = `${data.cpu.toFixed(1)}%`;
        if (memoryElement) memoryElement.textContent = `${data.memory.toFixed(1)}%`;
        if (networkElement) networkElement.textContent = `${data.network.toFixed(1)} Mbps`;
    }

    updateTelemetry(data) {
        // Update telemetry displays
        const elements = {
            altitude: document.getElementById('telemetryAltitude'),
            speed: document.getElementById('telemetrySpeed'),
            fuel: document.getElementById('telemetryFuel'),
            temperature: document.getElementById('telemetryTemp'),
            gforce: document.getElementById('telemetryGForce'),
            latitude: document.getElementById('telemetryLat'),
            longitude: document.getElementById('telemetryLon'),
            heading: document.getElementById('telemetryHeading'),
            status: document.getElementById('telemetryStatus')
        };
        
        if (elements.altitude) elements.altitude.textContent = `${data.altitude.toFixed(0)} ft`;
        if (elements.speed) elements.speed.textContent = `Mach ${data.speed.toFixed(2)}`;
        if (elements.fuel) elements.fuel.textContent = `${data.fuel.toFixed(1)}%`;
        if (elements.temperature) elements.temperature.textContent = `${data.temperature.toFixed(0)}°C`;
        if (elements.gforce) elements.gforce.textContent = `${data.g_force.toFixed(1)} G`;
        if (elements.latitude) elements.latitude.textContent = data.latitude.toFixed(4);
        if (elements.longitude) elements.longitude.textContent = data.longitude.toFixed(4);
        if (elements.heading) elements.heading.textContent = `${data.heading.toFixed(0)}°`;
        if (elements.status) {
            elements.status.textContent = data.status;
            elements.status.className = `status-${data.status.toLowerCase()}`;
        }
        
        // Update fuel bar
        const fuelBar = document.getElementById('fuelBar');
        if (fuelBar) {
            fuelBar.style.width = `${data.fuel}%`;
            fuelBar.style.background = data.fuel > 20 ? 
                'linear-gradient(90deg, #00ff00, #ffff00)' : 
                'linear-gradient(90deg, #ff0000, #ff8800)';
        }
    }

    startSystemMonitor() {
        // Periodically check system health
        setInterval(async () => {
            try {
                const response = await fetch('/api/system/events');
                const events = await response.json();
                this.processSystemEvents(events);
            } catch (error) {
                console.error('Failed to fetch system events:', error);
            }
        }, 10000);
    }

    processSystemEvents(events) {
        // Process and display system events
        const criticalEvents = events.filter(e => e.status === 'critical');
        if (criticalEvents.length > 0) {
            this.showAlert('SYSTEM ALERT', criticalEvents[0].message, 'critical');
        }
    }

    showAlert(title, message, type = 'info') {
        const alertWindow = this.createWindow({
            title: title,
            width: 400,
            height: 200,
            content: `
                <div class="alert alert-${type}">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <button onclick="this.closest('.window').remove()" class="btn btn-primary">ACKNOWLEDGE</button>
                </div>
            `
        });
        
        // Make window modal
        alertWindow.style.zIndex = 9999;
    }

    openApp(appName) {
        switch(appName) {
            case 'terminal':
                this.openTerminal();
                break;
            case 'radar':
                this.openRadar();
                break;
            case 'telemetry':
                this.openTelemetry();
                break;
            case 'weapons':
                this.openWeapons();
                break;
            case 'hangar':
                this.openHangar();
                break;
            case 'logs':
                this.openLogs();
                break;
        }
    }

    openTerminal() {
        const windowId = 'terminal_' + Date.now();
        const window = this.createWindow({
            id: windowId,
            title: 'Terminal - Aurora-X Bash',
            width: 800,
            height: 500,
            content: `
                <div class="terminal-container" id="${windowId}_terminal"></div>
            `
        });
        
        // Initialize terminal
        setTimeout(() => {
            if (window.terminalApp) {
                window.terminalApp.init(`${windowId}_terminal`);
            }
        }, 100);
    }

    openRadar() {
        this.createWindow({
            title: 'Radar System',
            width: 600,
            height: 600,
            content: `
                <div class="radar-container">
                    <div class="radar-display">
                        <div class="radar-sweep"></div>
                        <canvas id="radarCanvas" width="400" height="400"></canvas>
                    </div>
                    <div class="radar-info">
                        <h3>Target Tracking</h3>
                        <div id="radarTargets"></div>
                    </div>
                </div>
            `
        });
        
        // Initialize radar
        setTimeout(() => {
            if (window.radarApp) {
                window.radarApp.init('radarCanvas');
            }
        }, 100);
    }

    openTelemetry() {
        this.createWindow({
            title: 'FX-99 NEMESIS Telemetry',
            width: 700,
            height: 500,
            content: `
                <div class="telemetry-dashboard">
                    <div class="telemetry-header">
                        <h2><i class="fas fa-jet-fighter-up"></i> FX-99 NEMESIS</h2>
                        <div class="status-display">
                            <span id="telemetryStatus" class="status-normal">NOMINAL</span>
                        </div>
                    </div>
                    <div class="telemetry-grid">
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryAltitude">35000 ft</div>
                            <div class="telemetry-label">Altitude</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetrySpeed">Mach 0.85</div>
                            <div class="telemetry-label">Air Speed</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryFuel">78.5%</div>
                            <div class="telemetry-label">Fuel Level</div>
                            <div class="fuel-bar">
                                <div class="fuel-fill" id="fuelBar" style="width: 78.5%"></div>
                            </div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryTemp">245°C</div>
                            <div class="telemetry-label">Engine Temp</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryGForce">1.2 G</div>
                            <div class="telemetry-label">G-Force</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryHeading">270°</div>
                            <div class="telemetry-label">Heading</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryLat">34.0522</div>
                            <div class="telemetry-label">Latitude</div>
                        </div>
                        <div class="telemetry-card">
                            <div class="telemetry-value" id="telemetryLon">-118.2437</div>
                            <div class="telemetry-label">Longitude</div>
                        </div>
                    </div>
                </div>
            `
        });
    }

    openWeapons() {
        this.createWindow({
            title: 'Weapons Control System',
            width: 600,
            height: 500,
            content: `
                <div class="weapons-panel">
                    <button class="weapon-button" onclick="auroraOS.fireWeapon('missile')">
                        <i class="fas fa-missile"></i>
                        <div>LAUNCH MISSILE</div>
                        <small>AGM-114 Hellfire</small>
                    </button>
                    <button class="weapon-button" onclick="auroraOS.fireWeapon('machinegun')">
                        <i class="fas fa-gun"></i>
                        <div>ACTIVATE MACHINE GUN</div>
                        <small>M61 Vulcan 20mm</small>
                    </button>
                    <button class="weapon-button" onclick="auroraOS.activateStealth()">
                        <i class="fas fa-user-ninja"></i>
                        <div>STEALTH MODE</div>
                        <small>Radar Absorbent Coating</small>
                    </button>
                    <button class="weapon-button" onclick="auroraOS.deployCountermeasures()">
                        <i class="fas fa-shield"></i>
                        <div>COUNTERMEASURES</div>
                        <small>Chaff & Flares</small>
                    </button>
                    <div class="weapons-log">
                        <h3>Weapons Log</h3>
                        <div id="weaponsLog"></div>
                    </div>
                </div>
            `
        });
    }

    openHangar() {
        this.createWindow({
            title: 'Hangar 3D - FX-99 NEMESIS',
            width: 800,
            height: 600,
            content: `
                <div class="three-container" id="hangar3d"></div>
                <div class="hangar-controls">
                    <button onclick="hangar3D.rotateLeft()"><i class="fas fa-rotate-left"></i></button>
                    <button onclick="hangar3D.rotateRight()"><i class="fas fa-rotate-right"></i></button>
                    <button onclick="hangar3D.zoomIn()"><i class="fas fa-search-plus"></i></button>
                    <button onclick="hangar3D.zoomOut()"><i class="fas fa-search-minus"></i></button>
                </div>
            `
        });
        
        // Initialize 3D hangar
        setTimeout(() => {
            if (window.hangar3D) {
                window.hangar3D.init('hangar3d');
            }
        }, 100);
    }

    openLogs() {
        this.createWindow({
            title: 'System Logs',
            width: 900,
            height: 500,
            content: `
                <div class="logs-container">
                    <div class="logs-toolbar">
                        <button onclick="auroraOS.refreshLogs()"><i class="fas fa-sync"></i> Refresh</button>
                        <button onclick="auroraOS.clearLogs()"><i class="fas fa-trash"></i> Clear</button>
                        <button onclick="auroraOS.exportLogs()"><i class="fas fa-download"></i> Export</button>
                    </div>
                    <div class="logs-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Event</th>
                                    <th>Description</th>
                                    <th>Severity</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody"></tbody>
                        </table>
                    </div>
                </div>
            `
        });
        
        this.refreshLogs();
    }

    async fireWeapon(weaponType) {
        try {
            const response = await fetch('/api/weapons/fire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    type: weaponType,
                    target: 'Unknown'
                })
            });
            
            const data = await response.json();
            
            // Show notification
            this.showAlert('WEAPONS CONTROL', data.message, 'warning');
            
            // Update weapons log
            this.updateWeaponsLog(`${weaponType} fired at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error('Weapon fire failed:', error);
        }
    }

    activateStealth() {
        this.showAlert('STEALTH MODE', 'Radar absorbent coating activated. Radar cross-section reduced to 0.0001 m².', 'info');
        this.updateWeaponsLog('Stealth mode activated');
    }

    deployCountermeasures() {
        this.showAlert('COUNTERMEASURES', 'Chaff and flares deployed. Missile lock broken.', 'info');
        this.updateWeaponsLog('Countermeasures deployed');
    }

    updateWeaponsLog(message) {
        const logElement = document.getElementById('weaponsLog');
        if (logElement) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
            logElement.prepend(entry);
        }
    }

    async refreshLogs() {
        try {
            const response = await fetch('/api/logs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    }

    displayLogs(logs) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.className = `log-severity-${log.severity}`;
            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td>${log.user}</td>
                <td>${log.event_type}</td>
                <td>${log.description}</td>
                <td><span class="badge badge-${log.severity}">${log.severity.toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    createWindow(config) {
        const windowId = config.id || 'window_' + Date.now();
        const windowElement = document.createElement('div');
        
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.style.width = config.width + 'px';
        windowElement.style.height = config.height + 'px';
        windowElement.style.left = '50px';
        windowElement.style.top = '50px';
        windowElement.style.zIndex = this.zIndex++;
        
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="${config.icon || 'fas fa-window-maximize'}"></i>
                    ${config.title}
                </div>
                <div class="window-controls">
                    <button class="window-btn window-minimize" onclick="this.closest('.window').classList.add('minimized')">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button class="window-btn window-maximize" onclick="this.closest('.window').classList.toggle('maximized')">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button class="window-btn window-close" onclick="this.closest('.window').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="window-content">
                ${config.content}
            </div>
        `;
        
        document.querySelector('.desktop').appendChild(windowElement);
        this.makeDraggable(windowElement);
        this.windows.push(windowElement);
        
        return windowElement;
    }

    makeDraggable(element) {
        const header = element.querySelector('.window-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                element.style.zIndex = auroraOS.zIndex++;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                setTranslate(currentX, currentY, element);
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}

// Initialize Aurora OS when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.auroraOS = new AuroraOS();
});
