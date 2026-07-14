import os
import redis
from rq import Worker, Queue, Connection

# Ensure backend directory is in python path
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

listen = ["scans"]

conn = redis.from_url(REDIS_URL)

def run_worker():
    with Connection(conn):
        worker = Worker(map(Queue, listen))
        print("Starting RQ worker listening on 'scans' queue...")
        worker.work()

if __name__ == "__main__":
    run_worker()
