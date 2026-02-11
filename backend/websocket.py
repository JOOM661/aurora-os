from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import json
import random
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.terminal_sessions: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.terminal_sessions:
            del self.terminal_sessions[client_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)
    
    async def send_json(self, data: dict, websocket: WebSocket):
        await websocket.send_json(data)

class SimulationManager:
    def __init__(self):
        self.radar_targets = []
        self.telemetry_data = {
            "altitude": 35000,
            "speed": 0.85,
            "fuel": 78.5,
            "temperature": 245,
            "g_force": 1.2,
            "latitude": 34.0522,
            "longitude": -118.2437,
            "heading": 270,
            "status": "NOMINAL"
        }
        self.generate_radar_targets()
    
    def generate_radar_targets(self):
        self.radar_targets = []
        # Generate allies
        for i in range(3):
            self.radar_targets.append({
                "id": f"ally_{i}",
                "x": random.uniform(-60, 60),
                "y": random.uniform(-60, 60),
                "type": "ally",
                "distance": random.randint(50, 200),
                "bearing": random.randint(0, 360)
            })
        # Generate enemies
        for i in range(2):
            self.radar_targets.append({
                "id": f"enemy_{i}",
                "x": random.uniform(-80, 80),
                "y": random.uniform(-80, 80),
                "type": "enemy",
                "distance": random.randint(100, 300),
                "bearing": random.randint(0, 360)
            })
    
    def update_radar(self):
        for target in self.radar_targets:
            # Move targets slightly
            target["x"] += random.uniform(-2, 2)
            target["y"] += random.uniform(-2, 2)
            target["distance"] += random.uniform(-5, 5)
            target["bearing"] = (target["bearing"] + random.uniform(-2, 2)) % 360
    
    def update_telemetry(self):
        # Simulate changing telemetry data
        self.telemetry_data["altitude"] += random.uniform(-100, 100)
        self.telemetry_data["speed"] += random.uniform(-0.01, 0.01)
        self.telemetry_data["fuel"] -= random.uniform(0.1, 0.3)
        self.telemetry_data["temperature"] += random.uniform(-2, 2)
        self.telemetry_data["g_force"] = 1.0 + abs(random.uniform(-0.2, 0.2))
        self.telemetry_data["latitude"] += random.uniform(-0.001, 0.001)
        self.telemetry_data["longitude"] += random.uniform(-0.001, 0.001)
        self.telemetry_data["heading"] = (self.telemetry_data["heading"] + random.uniform(-1, 1)) % 360
        
        # Keep values in realistic ranges
        self.telemetry_data["altitude"] = max(10000, min(50000, self.telemetry_data["altitude"]))
        self.telemetry_data["speed"] = max(0.5, min(2.0, self.telemetry_data["speed"]))
        self.telemetry_data["fuel"] = max(0, min(100, self.telemetry_data["fuel"]))
        self.telemetry_data["temperature"] = max(100, min(1000, self.telemetry_data["temperature"]))
    
    def get_radar_data(self):
        self.update_radar()
        return {
            "targets": self.radar_targets,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_telemetry_data(self):
        self.update_telemetry()
        return self.telemetry_data

manager = ConnectionManager()
simulation = SimulationManager()
