import os
import subprocess
import time
import pytest
from playwright.sync_api import sync_playwright

@pytest.fixture(scope="module", autouse=True)
def cleanup_e2e_user():
    # Helper to clean up E2E test user in DB before and after E2E tests
    from database import SessionLocal
    import models
    db = SessionLocal()
    try:
        # Delete scan data and user for e2e-user
        user = db.query(models.User).filter(models.User.email == "e2e-user@example.com").first()
        if user:
            db.delete(user)
            db.commit()
    except Exception:
        pass
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "e2e-user@example.com").first()
        if user:
            db.delete(user)
            db.commit()
    except Exception:
        pass
    finally:
        db.close()

def test_e2e_register_and_dashboard():
    # Define absolute paths for cwd
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

    # 1. Start FastAPI backend server on port 8000
    backend_proc = subprocess.Popen(
        ["python3", "-m", "uvicorn", "main:app", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # 2. Start Vite React frontend server on port 3000
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", "3000"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Wait for servers to spin up
    time.sleep(5)

    try:
        with sync_playwright() as p:
            # Launch headless browser
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            # Navigate to the Landing Page
            page.goto("http://localhost:3000", timeout=10000)

            # Assert Landing Page details are visible
            assert "GitHub Profile Auditor" in page.content()
            assert "Audit Your GitHub" in page.content()

            # Click Create Free Account
            page.click("text=Create Free Account")

            # Fill in Registration Details
            page.fill("input[placeholder='octocat@github.com']", "e2e-user@example.com")
            page.fill("input[placeholder='••••••••']", "password123")
            
            # Submit Registration form
            page.click("button:has-text('Register Account')")

            # Wait for Dashboard view to load
            page.wait_for_selector("text=New Repository Scan", timeout=10000)
            assert "New Repository Scan" in page.content()

            # Verify navigation to Data Privacy page works
            page.click("button:has-text('Privacy')")
            page.wait_for_selector("text=What We Do With Your Data", timeout=5000)
            assert "Scanning Pipeline Security" in page.content()

            # Click Go Back
            page.click("text=Go Back")
            page.wait_for_selector("text=New Repository Scan", timeout=5000)

            browser.close()
    finally:
        # Terminate background processes
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
