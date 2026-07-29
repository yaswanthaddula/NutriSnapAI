import os
import csv
import pytest
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

@pytest.fixture(scope="session")
def driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

def pytest_sessionstart(session):
    reports_dir = os.path.join(session.config.rootdir, '..', 'reports', 'selenium')
    os.makedirs(reports_dir, exist_ok=True)
    report_path = os.path.join(reports_dir, 'Selenium_Test_Report.csv')
    with open(report_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Test Name', 'Status', 'Duration', 'Timestamp'])
    session.results = {'passed': 0, 'failed': 0, 'skipped': 0, 'error': 0}

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call":
        reports_dir = os.path.join(item.session.config.rootdir, '..', 'reports', 'selenium')
        report_path = os.path.join(reports_dir, 'Selenium_Test_Report.csv')
        with open(report_path, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([item.nodeid, report.outcome, report.duration, datetime.now().isoformat()])
        
        if report.outcome in item.session.results:
            item.session.results[report.outcome] += 1
        else:
            item.session.results['error'] += 1

def pytest_sessionfinish(session, exitstatus):
    reports_dir = os.path.join(session.config.rootdir, '..', 'reports', 'selenium')
    summary_path = os.path.join(reports_dir, 'Selenium_Test_Summary.csv')
    with open(summary_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Total Tests', 'Passed', 'Failed', 'Skipped', 'Errors'])
        total = sum(session.results.values())
        writer.writerow([
            total,
            session.results.get('passed', 0),
            session.results.get('failed', 0),
            session.results.get('skipped', 0),
            session.results.get('error', 0)
        ])
