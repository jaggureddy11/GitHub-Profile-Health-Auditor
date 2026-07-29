import os
# Fix macOS Python 3.13 fork crash (SIGABRT on child side of fork pre-exec)
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

import redis
from dotenv import load_dotenv

# Load env variables from parent folder .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

from rq import Worker, Queue

# Ensure backend directory is in python path
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

raw_redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

def sanitize_redis_url(url: str) -> str:
    url = url.strip()
    if "-u " in url:
        url = url.split("-u ")[-1].strip()
    elif "--url " in url:
        url = url.split("--url ")[-1].strip()
    if "upstash.io" in url and url.startswith("redis://"):
        url = url.replace("redis://", "rediss://", 1)
    return url

REDIS_URL = sanitize_redis_url(raw_redis_url)

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
