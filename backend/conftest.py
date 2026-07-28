import pytest
from main import in_memory_limiter, app, redis_conn

@pytest.fixture(autouse=True)
def reset_rate_limiter_and_overrides():
    in_memory_limiter._requests.clear()
    app.dependency_overrides.clear()
    if redis_conn:
        try:
            keys = redis_conn.keys("rate_limit:ip:*")
            if keys:
                redis_conn.delete(*keys)
        except Exception:
            pass
    yield
    in_memory_limiter._requests.clear()
    app.dependency_overrides.clear()
    if redis_conn:
        try:
            keys = redis_conn.keys("rate_limit:ip:*")
            if keys:
                redis_conn.delete(*keys)
        except Exception:
            pass
