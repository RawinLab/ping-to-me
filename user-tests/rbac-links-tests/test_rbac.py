#!/usr/bin/env python3
"""
RBAC Links Management Tests
Tests RBAC-030 through RBAC-033
"""

import json
import urllib.request
import urllib.error
import time
from typing import Optional, Dict, Any

API_URL = "http://localhost:3011"
ORG_ID = "e2e00000-0000-0000-0001-000000000001"

# ANSI color codes
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color

def login(email: str, password: str) -> Optional[str]:
    """Login and return access token"""
    data = json.dumps({"email": email, "password": password}).encode('utf-8')
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('accessToken')
    except urllib.error.HTTPError:
        return None

def print_result(test_id: str, status_code: int, expected: int, notes: str):
    """Print test result with color coding"""
    if status_code == expected:
        print(f"{test_id} | {GREEN}PASS{NC} ({status_code}) | {notes}")
    else:
        print(f"{test_id} | {RED}FAIL{NC} (expected {expected}, got {status_code}) | {notes}")

def create_link(token: str, title: str, url: str = None):
    """Create a link and return (status_code, link_id)"""
    if url is None:
        timestamp = int(time.time() * 1000)  # milliseconds
        url = f"https://example.com/{title.lower().replace(' ', '-')}-{timestamp}"

    data = json.dumps({
        "originalUrl": url,
        "organizationId": ORG_ID,
        "title": title
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{API_URL}/links",
        data=data,
        headers={
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    link_id = None
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            result = json.loads(response.read().decode('utf-8'))
            link_id = result.get('id')
            return status_code, link_id
    except urllib.error.HTTPError as e:
        return e.code, None

def update_link(token: str, link_id: str, title: str) -> int:
    """Update a link and return status code"""
    data = json.dumps({"title": title}).encode('utf-8')
    req = urllib.request.Request(
        f"{API_URL}/links/{link_id}",
        data=data,
        headers={
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json'
        },
        method='POST'  # API uses POST for updates, not PATCH
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status
    except urllib.error.HTTPError as e:
        return e.code

def delete_link(token: str, link_id: str) -> int:
    """Delete a link and return status code"""
    req = urllib.request.Request(
        f"{API_URL}/links/{link_id}",
        headers={'Authorization': f"Bearer {token}"},
        method='DELETE'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status
    except urllib.error.HTTPError as e:
        return e.code

def list_links(token: str) -> int:
    """List links and return status code"""
    req = urllib.request.Request(
        f"{API_URL}/links?organizationId={ORG_ID}",
        headers={'Authorization': f"Bearer {token}"},
        method='GET'
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status
    except urllib.error.HTTPError as e:
        return e.code

print("Getting authentication tokens...")
owner_token = login("e2e-owner@pingtome.test", "TestPassword123!")
admin_token = login("e2e-admin@pingtome.test", "TestPassword123!")
editor_token = login("e2e-editor@pingtome.test", "TestPassword123!")
viewer_token = login("e2e-viewer@pingtome.test", "TestPassword123!")

if not all([owner_token, admin_token, editor_token, viewer_token]):
    print("Failed to get authentication tokens!")
    exit(1)

print()
print("=" * 50)
print("RBAC LINKS MANAGEMENT ACCESS TESTS")
print("=" * 50)
print()

# RBAC-030: OWNER Full Links Access
print("RBAC-030: OWNER Full Links Access")
print("-" * 50)

status = list_links(owner_token)
print_result("RBAC-030.1", status, 200, "OWNER list links")

status, owner_link_id = create_link(owner_token, "OWNER Test Link")
print_result("RBAC-030.2", status, 201, "OWNER create link")
print(f"  DEBUG: owner_link_id = {owner_link_id}")

if owner_link_id:
    status = update_link(owner_token, owner_link_id, "Updated by OWNER")
    print_result("RBAC-030.3", status, 200, "OWNER update link")

    status = delete_link(owner_token, owner_link_id)
    print_result("RBAC-030.4", status, 200, "OWNER delete link")
else:
    print(f"RBAC-030.3 | {YELLOW}SKIP{NC} | Could not create link for update test")
    print(f"RBAC-030.4 | {YELLOW}SKIP{NC} | No link to delete")

print()

# RBAC-031: ADMIN Full Links Access
print("RBAC-031: ADMIN Full Links Access")
print("-" * 50)

status = list_links(admin_token)
print_result("RBAC-031.1", status, 200, "ADMIN list links")

status, admin_link_id = create_link(admin_token, "ADMIN Test Link")
print_result("RBAC-031.2", status, 201, "ADMIN create link")

# Create a link by OWNER to test ADMIN can update ANY link
status, other_link_id = create_link(owner_token, "Owner Link for Admin Test")

if other_link_id:
    status = update_link(admin_token, other_link_id, "Updated by ADMIN")
    print_result("RBAC-031.3", status, 200, "ADMIN update OTHER's link")

    status = delete_link(admin_token, other_link_id)
    print_result("RBAC-031.4", status, 200, "ADMIN delete OTHER's link")
else:
    print(f"RBAC-031.3 | {YELLOW}SKIP{NC} | Could not create other user's link")
    print(f"RBAC-031.4 | {YELLOW}SKIP{NC} | No other user's link to delete")

# Cleanup admin's own link
if admin_link_id:
    delete_link(admin_token, admin_link_id)

print()

# RBAC-032: EDITOR Can Create/Edit OWN Links
print("RBAC-032: EDITOR Can Create/Edit OWN Links")
print("-" * 50)

status = list_links(editor_token)
print_result("RBAC-032.1", status, 200, "EDITOR list links")

status, editor_link_id = create_link(editor_token, "EDITOR Test Link")
print_result("RBAC-032.2", status, 201, "EDITOR create link")

if editor_link_id:
    status = update_link(editor_token, editor_link_id, "Updated by EDITOR")
    print_result("RBAC-032.3", status, 200, "EDITOR update OWN link")
else:
    print(f"RBAC-032.3 | {YELLOW}SKIP{NC} | Could not create link for update test")

# Create a link by OWNER to test EDITOR cannot update OTHER's link
status, other_link_id2 = create_link(owner_token, "Owner Link for Editor Test")

if other_link_id2:
    status = update_link(editor_token, other_link_id2, "Attempted update by EDITOR")
    print_result("RBAC-032.4", status, 403, "EDITOR update OTHER's link (should fail)")
else:
    print(f"RBAC-032.4 | {YELLOW}SKIP{NC} | Could not create other user's link")

if editor_link_id:
    status = delete_link(editor_token, editor_link_id)
    print_result("RBAC-032.5", status, 200, "EDITOR delete OWN link")
else:
    print(f"RBAC-032.5 | {YELLOW}SKIP{NC} | No link to delete")

if other_link_id2:
    status = delete_link(editor_token, other_link_id2)
    print_result("RBAC-032.6", status, 403, "EDITOR delete OTHER's link (should fail)")
    # Cleanup
    delete_link(owner_token, other_link_id2)
else:
    print(f"RBAC-032.6 | {YELLOW}SKIP{NC} | No other user's link to delete")

print()

# RBAC-033: VIEWER Read-Only Links
print("RBAC-033: VIEWER Read-Only Links")
print("-" * 50)

status = list_links(viewer_token)
print_result("RBAC-033.1", status, 200, "VIEWER list links")

status, _ = create_link(viewer_token, "VIEWER Test Link")
print_result("RBAC-033.2", status, 403, "VIEWER create link (should fail)")

# Create a link to test update/delete
status, test_link_id = create_link(owner_token, "Test Link for Viewer")

if test_link_id:
    status = update_link(viewer_token, test_link_id, "Attempted update by VIEWER")
    print_result("RBAC-033.3", status, 403, "VIEWER update link (should fail)")

    status = delete_link(viewer_token, test_link_id)
    print_result("RBAC-033.4", status, 403, "VIEWER delete link (should fail)")
    # Cleanup
    delete_link(owner_token, test_link_id)
else:
    print(f"RBAC-033.3 | {YELLOW}SKIP{NC} | Could not create link for update test")
    print(f"RBAC-033.4 | {YELLOW}SKIP{NC} | No link to delete")

print()
print("=" * 50)
print("Tests Complete")
print("=" * 50)
