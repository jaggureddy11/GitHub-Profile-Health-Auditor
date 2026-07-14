import os
import redis
from dotenv import load_dotenv

# Load env variables from parent folder .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

from rq import Worker, Queue

# Ensure backend directory is in python path
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

listen = ["scans"]

conn = redis.from_url(REDIS_URL)

def run_worker():
    # Setup queues with direct connection reference
    queues = [Queue(name, connection=conn) for name in listen]
    worker = Worker(queues, connection=conn)
    print("Starting RQ worker listening on 'scans' queue...")
    worker.work()

if __name__ == "__main__":
    run_worker()
