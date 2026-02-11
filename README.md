# AURORA-X WEB OPERATING SYSTEM

Um sistema operacional web avançado com interface militar futurista, simulando um ambiente real de controle de caça FX-99 NEMESIS.

## 🚀 Características Principais

- **Sistema de Autenticação Militar**: JWT com roles (Commander, Pilot, Engineer)
- **Desktop Completo**: Interface com ícones, janelas arrastáveis e taskbar
- **Terminal Bash Simulado**: Comandos Linux completos (simulados)
- **Radar em Tempo Real**: Detecção de alvos aliados/inimigos
- **Telemetria do Caça**: Dados de voo atualizados via WebSocket
- **Controle de Armamentos**: Sistema simulado de disparo
- **Hangar 3D**: Modelo interativo do caça FX-99
- **Sistema de Logs**: Registro completo de todas as atividades
- **Segurança Robusta**: Middleware JWT, CORS, sanitização

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.12** + **FastAPI**
- **SQLite/PostgreSQL** com SQLAlchemy
- **WebSockets** para comunicação em tempo real
- **JWT Authentication** com bcrypt
- **Pydantic** para validação

### Frontend
- **HTML5** + **CSS3** moderno
- **JavaScript ES6+**
- **xterm.js** para terminal realista
- **Three.js** para gráficos 3D
- **Canvas API** para radar

## 📁 Estrutura do Projeto
