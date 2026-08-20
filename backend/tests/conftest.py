import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.db import SessionLocal

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c