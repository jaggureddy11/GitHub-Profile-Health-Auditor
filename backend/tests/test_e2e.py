import os
import socket
import subprocess
import time
import pytest
from playwright.sync_api import sync_playwright

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

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

    test_email = f"e2e-user-{int(time.time())}@example.com"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page.goto("http://localhost:3000", timeout=15000)

            assert "GitHub Profile Auditor" in page.content()
            assert "Audit Your GitHub" in page.content()

            page.click("text=Create Free Account")

            page.fill("input[placeholder='octocat@github.com']", test_email)
            page.fill("input[placeholder='••••••••']", "password123")

            page.click("button:has-text('Register Account')")

            page.wait_for_selector("text=New Repository Scan", timeout=15000)
            assert "New Repository Scan" in page.content()

            page.click("button:has-text('Privacy')")
            page.wait_for_selector("text=What We Do With Your Data", timeout=10000)
            assert "Scanning Pipeline Security" in page.content()

            page.click("text=Go Back")
            page.wait_for_selector("text=New Repository Scan", timeout=10000)

            browser.close()
    finally:
        if backend_proc:
            backend_proc.terminate()
            backend_proc.wait()
        if frontend_proc:
            frontend_proc.terminate()
            frontend_proc.wait()
