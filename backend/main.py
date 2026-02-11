from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from pathlib import Path

from . import models, auth, websocket, terminal_engine
from .database import get_db, engine
from .auth import create_access_token, authenticate_user, create_default_users, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(title="AURORA-X OPERATING SYSTEM", version="3.9.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = Path(__file__).parent.parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Initialize database
models.Base.metadata.create_all(bind=engine)

# Create default users on startup
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    auth.create_default_users(db)

# Authentication endpoints
@app.post("/api/login")
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log login attempt
    login_attempt = models.LoginAttempt(
        user_id=user.id,
        ip_address=request.client.host,
        success=True
    )
    db.add(login_attempt)
    
    # Create system log
    log = models.Log(
        user_id=user.id,
        event_type="login",
        description=f"User {username} logged in successfully",
        severity="info"
    )
    db.add(log)
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@app.get("/api/user")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        from jose import jwt
        from .auth import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name
    }

# WebSocket endpoints
@app.websocket("/ws/terminal/{session_id}")
async def websocket_terminal(websocket: WebSocket, session_id: str):
    await websocket.manager.connect(websocket, session_id)
    
    # Initialize terminal session
    terminal = terminal_engine.TerminalEngine()
    websocket.manager.terminal_sessions[session_id] = {
        "terminal": terminal,
        "websocket": websocket
    }
    
    try:
        while True:
            data = await websocket.receive_text()
            result = terminal.execute(data)
            prompt = terminal.get_prompt()
            await websocket.send_text(f"{result}\n{prompt}")
    except WebSocketDisconnect:
        websocket.manager.disconnect(session_id)

@app.websocket("/ws/radar")
async def websocket_radar(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            import asyncio
            radar_data = websocket.simulation.get_radar_data()
            await websocket.send_json(radar_data)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            import asyncio
            telemetry_data = websocket.simulation.get_telemetry_data()
            await websocket.send_json(telemetry_data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/system")
async def websocket_system(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            import asyncio
            system_data = {
                "cpu": random.uniform(10, 40),
                "memory": random.uniform(30, 70),
                "network": random.uniform(5, 50),
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(system_data)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

# API endpoints for weapons and logs
@app.post("/api/weapons/fire")
async def fire_weapon(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    weapon_type = data.get("type")
    target = data.get("target")
    
    # Log weapon activity
    weapon_activity = models.WeaponActivity(
        user_id=1,  # Would come from JWT in production
        weapon_type=weapon_type,
        action="fire",
        target=target,
        coordinates=f"{random.uniform(-90, 90):.4f}, {random.uniform(-180, 180):.4f}"
    )
    db.add(weapon_activity)
    db.commit()
    
    return {"status": "success", "message": f"{weapon_type} fired at {target}"}

@app.get("/api/logs")
async def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.Log).order_by(models.Log.created_at.desc()).limit(100).all()
    return [
        {
            "id": log.id,
            "user": log.user.username if log.user else "system",
            "event_type": log.event_type,
            "description": log.description,
            "severity": log.severity,
            "timestamp": log.created_at.isoformat()
        }
        for log in logs
    ]

@app.get("/api/system/events")
async def get_system_events(db: Session = Depends(get_db)):
    events = db.query(models.SystemEvent).order_by(models.SystemEvent.created_at.desc()).limit(50).all()
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "component": event.component,
            "message": event.message,
            "status": event.status,
            "timestamp": event.created_at.isoformat()
        }
        for event in events
    ]

# Frontend routes
@app.get("/")
async def read_root():
    return FileResponse("frontend/index.html")

@app.get("/login")
async def read_login():
    return FileResponse("frontend/login.html")

@app.get("/desktop")
async def read_desktop():
    return FileResponse("frontend/desktop.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
