# backend/models.py

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # Commander, Pilot, Engineer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    event = Column(String)
    user_id = Column(Integer)
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    severity = Column(String)  # info, warning, error, critical
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WeaponsActivity(Base):
    __tablename__ = "weapons_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    weapon_type = Column(String)
    action = Column(String)  # launch, activate, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    ip_address = Column(String)
    success = Column(Boolean)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
