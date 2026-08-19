"""
RQ worker entrypoint. Run this as its own long-running process, separate
from the API server: `python -m app.workers.worker_main`
"""

import sys
from rq import Worker, SimpleWorker

from app.core.queue import queue, redis_conn

if __name__ == "__main__":
    # Windows doesn't support os.fork(), which is required by standard Worker.
    # We use SimpleWorker on Windows for local development.
    worker_class = SimpleWorker if sys.platform == "win32" else Worker
    worker = worker_class([queue], connection=redis_conn)
    worker.work()