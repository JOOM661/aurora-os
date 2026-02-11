// Terminal Application with xterm.js

class TerminalApp {
    constructor() {
        this.term = null;
        this.socket = null;
        this.sessionId = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentCommand = '';
    }

    init(containerId) {
        // Initialize xterm.js terminal
        this.term = new Terminal({
            theme: {
                background: '#000000',
                foreground: '#00ff00',
                cursor: '#00ff00',
                selection: 'rgba(0, 255, 0, 0.3)',
                black: '#000000',
                red: '#ff0000',
                green: '#00ff00',
                yellow: '#ffff00',
                blue: '#0000ff',
                magenta: '#ff00ff',
                cyan: '#00ffff',
                white: '#ffffff'
            },
            fontSize: 14,
            fontFamily: 'Courier New, monospace',
            cursorBlink: true,
            cursorStyle: 'block',
            allowTransparency: true,
            convertEol: true
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        this.term.loadAddon(fitAddon);
        
        // Open terminal in container
        this.term.open(document.getElementById(containerId));
        fitAddon.fit();
        
        // Initialize session
        this.sessionId = 'terminal_' + Date.now();
        
        // Connect to WebSocket
        this.connectWebSocket();
        
        // Setup terminal input handling
        this.setupTerminal();
        
        // Show initial message
        this.showWelcomeMessage();
    }

    connectWebSocket() {
        this.socket = new WebSocket(`ws://${window.location.host}/ws/terminal/${this.sessionId}`);
        
        this.socket.onopen = () => {
            this.term.writeln('\r\n\x1b[32mConnected to Aurora-X Terminal\x1b[0m');
            this.writePrompt();
        };
        
        this.socket.onmessage = (event) => {
            this.term.write(event.data);
        };
        
        this.socket.onerror = (error) => {
            this.term.writeln('\r\n\x1b[31mWebSocket error. Reconnecting...\x1b[0m');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.socket.onclose = () => {
            this.term.writeln('\r\n\x1b[33mConnection closed\x1b[0m');
        };
    }

    setupTerminal() {
        this.term.onKey(({ key, domEvent }) => {
            const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
            
            if (domEvent.keyCode === 13) { // Enter
                this.handleEnter();
            } else if (domEvent.keyCode === 8) { // Backspace
                this.handleBackspace();
            } else if (domEvent.keyCode === 9) { // Tab
                this.handleTab();
            } else if (domEvent.keyCode === 38) { // Up arrow
                this.handleArrowUp();
            } else if (domEvent.keyCode === 40) { // Down arrow
                this.handleArrowDown();
            } else if (printable) {
                this.handlePrintable(key);
            }
        });
        
        this.term.onData((data) => {
            // Handle special keys that aren't captured by onKey
            if (data === '\x03') { // Ctrl+C
                this.term.write('^C\r\n');
                this.writePrompt();
            }
        });
    }

    handleEnter() {
        const command = this.currentCommand.trim();
        
        if (command) {
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
            
            // Send command to server
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(command);
            }
            
            this.currentCommand = '';
        } else {
            this.term.write('\r\n');
            this.writePrompt();
        }
    }

    handleBackspace() {
        if (this.currentCommand.length > 0) {
            this.currentCommand = this.currentCommand.slice(0, -1);
            this.term.write('\b \b');
        }
    }

    handleTab() {
        // Simple tab completion
        const commands = [
            'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo', 'rm',
            'cp', 'mv', 'grep', 'find', 'ps', 'top', 'kill', 'ifconfig',
            'ping', 'curl', 'sudo', 'whoami', 'date', 'uname', 'history',
            'clear', 'help'
        ];
        
        const matches = commands.filter(cmd => 
            cmd.startsWith(this.currentCommand)
        );
        
        if (matches.length === 1) {
            const completion = matches[0].slice(this.currentCommand.length);
            this.currentCommand = matches[0];
            this.term.write(completion);
        } else if (matches.length > 1) {
            this.term.write('\r\n');
            matches.forEach(cmd => this.term.write(cmd + '  '));
            this.term.write('\r\n');
            this.writePrompt();
            this.term.write(this.currentCommand);
        }
    }

    handleArrowUp() {
        if (this.commandHistory.length > 0) {
            if (this.historyIndex > 0) {
                this.historyIndex--;
            }
            
            // Clear current line
            this.term.write('\r\x1b[K');
            this.currentCommand = this.commandHistory[this.historyIndex] || '';
            this.writePrompt();
            this.term.write(this.currentCommand);
        }
    }

    handleArrowDown() {
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            this.currentCommand = this.commandHistory[this.historyIndex];
        } else {
            this.historyIndex = this.commandHistory.length;
            this.currentCommand = '';
        }
        
        this.term.write('\r\x1b[K');
        this.writePrompt();
        this.term.write(this.currentCommand);
    }

    handlePrintable(key) {
        this.currentCommand += key;
        this.term.write(key);
    }

    writePrompt() {
        this.term.write('\r\n\x1b[32mcommander@aurora-x:~$\x1b[0m ');
    }

    showWelcomeMessage() {
        const welcomeMessage = `
\x1b[36m
   ___    _   _   ____   ____   ___    __  __
  / _ \\  | | | | |  _ \\ |  _ \\ / _ \\  |  \\/  |
 | | | | | | | | | |_) || |_) | | | | | \\  / |
 | |_| | | |_| | |  _ < |  _ < | |_| | | |\\/| |
  \\___/   \\___/  |_| \\_\\|_| \\_\\ \\___/  |_|  |_|
\x1b[0m

\x1b[33mAurora-X Web Operating System v3.9\x1b[0m
\x1b[37mMilitary Grade Terminal Interface\x1b[0m

Type 'help' for available commands
`;
        
        this.term.writeln(welcomeMessage);
        this.writePrompt();
    }

    executeLocalCommand(command) {
        // Handle some commands locally for better responsiveness
        switch(command.trim()) {
            case 'clear':
                this.term.clear();
                this.writePrompt();
                return true;
            case 'help':
                this.showHelp();
                this.writePrompt();
                return true;
        }
        return false;
    }

    showHelp() {
        const helpText = `
\x1b[36mAvailable Commands:\x1b[0m

\x1b[32mFile Operations:\x1b[0m
  ls [dir]        - List directory contents
  cd [dir]        - Change directory
  pwd             - Print working directory
  mkdir <dir>     - Create directory
  touch <file>    - Create file
  cat <file>      - Display file contents
  rm <file>       - Remove file
  cp <src> <dst>  - Copy file
  mv <src> <dst>  - Move/rename file

\x1b[32mSystem:\x1b[0m
  ps              - Display processes
  top             - System monitor
  kill <pid>      - Terminate process
  ifconfig        - Network interfaces
  ping <host>     - Network test

\x1b[32mInformation:\x1b[0m
  whoami          - Current user
  date            - System date/time
  uname           - System information
  history         - Command history
  help            - This help message

\x1b[32mUtilities:\x1b[0m
  grep <pat> <file> - Search text
  find <path> <name> - Find files
  curl <url>      - Transfer data
  sudo <cmd>      - Execute as superuser
  clear           - Clear screen
`;
        
        this.term.writeln(helpText);
    }
}

// Export to global scope
window.terminalApp = new TerminalApp();
