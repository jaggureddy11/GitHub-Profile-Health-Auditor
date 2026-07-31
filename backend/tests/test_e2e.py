import os
import time
import socket
import subprocess
from playwright.sync_api import sync_playwright

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def test_e2e_register_and_dashboard():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

    backend_proc = None
    frontend_proc = None

    if not is_port_in_use(8000):
        backend_proc = subprocess.Popen(
            ["python3", "-m", "uvicorn", "main:app", "--port", "8000"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

    if not is_port_in_use(3000):
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev", "--", "--port", "3000"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

    time.sleep(3)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1280, 'height': 800})
            page = context.new_page()

            page.goto("http://localhost:3000", timeout=15000)

            assert "GitHub Profile Auditor" in page.content()
            assert "Audit Your GitHub" in page.content()

            # Test Privacy Policy Page Navigation
            page.click("button:has-text('Privacy')")
            page.wait_for_selector("text=What We Do With Your Data", timeout=10000)
            assert "Scanning Pipeline Security" in page.content()

            # Test Navigation Back
            page.click("text=Go Back")
            page.wait_for_selector("text=Audit Your GitHub", timeout=10000)

            browser.close()
    finally:
        if backend_proc:
            backend_proc.terminate()
            backend_proc.wait()
        if frontend_proc:
            frontend_proc.terminate()
            frontend_proc.wait()
