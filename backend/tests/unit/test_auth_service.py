import pytest
from app.core.security import hash_password, verify_password

def test_hash_and_verify_password():
    password = "my_secure_password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_password_longer_than_72_characters():
    # bcrypt limit is 72 bytes. The code should truncate and still verify correctly without error.
    long_password = "a" * 100
    hashed = hash_password(long_password)
    
    assert hashed != long_password
    assert verify_password(long_password, hashed) is True
    assert verify_password("a" * 72, hashed) is True  # Truncated password should match
    assert verify_password("a" * 71, hashed) is False
