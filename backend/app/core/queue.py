"""
Redis Queue (RQ) setup — the job broker used by both the API (to enqueue
jobs) and the worker process (to consume them).
"""

import redis
from rq import Queue

from app.config import get_settings

settings = get_settings()

redis_conn = redis.from_url(settings.redis_url)
queue = Queue("default", connection=redis_conn)