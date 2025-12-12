#!/bin/bash

# RBAC Links Management Tests
# Tests RBAC-030 through RBAC-033

API_URL="http://localhost:3011"
ORG_ID="e2e00000-0000-0000-0001-000000000001"
TEST_DIR="/Users/earn/Projects/rawinlab/pingtome/user-tests/rbac-links-tests"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    local test_id=$1
    local status_code=$2
    local expected=$3
    local notes=$4

    if [ "$status_code" -eq "$expected" ]; then
        echo -e "${test_id} | ${GREEN}PASS${NC} (${status_code}) | ${notes}"
    else
        echo -e "${test_id} | ${RED}FAIL${NC} (expected ${expected}, got ${status_code}) | ${notes}"
    fi
}

# Login and get tokens
echo "Getting authentication tokens..."
OWNER_TOKEN=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" --data-binary "@$TEST_DIR/owner-login.json" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")
ADMIN_TOKEN=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" --data-binary "@$TEST_DIR/admin-login.json" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")
EDITOR_TOKEN=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" --data-binary "@$TEST_DIR/editor-login.json" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")
VIEWER_TOKEN=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" --data-binary "@$TEST_DIR/viewer-login.json" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")

echo ""
echo "=========================================="
echo "RBAC LINKS MANAGEMENT ACCESS TESTS"
echo "=========================================="
echo ""

# RBAC-030: OWNER Full Links Access
echo "RBAC-030: OWNER Full Links Access"
echo "------------------------------------------"

# Test 1: List links
STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/links?organizationId=$ORG_ID" -H "Authorization: Bearer $OWNER_TOKEN")
print_result "RBAC-030.1" "$STATUS" "200" "OWNER list links"

# Test 2: Create link
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/owner-test\",\"organizationId\":\"$ORG_ID\",\"title\":\"OWNER Test Link\"}")
STATUS=$(echo "$RESPONSE" | tail -n 1)
OWNER_LINK_ID=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
print_result "RBAC-030.2" "$STATUS" "201" "OWNER create link"

# Test 3: Update link
if [ -n "$OWNER_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PATCH "$API_URL/links/$OWNER_LINK_ID" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d '{"title":"Updated by OWNER"}')
    print_result "RBAC-030.3" "$STATUS" "200" "OWNER update link"
else
    echo -e "RBAC-030.3 | ${YELLOW}SKIP${NC} | Could not create link for update test"
fi

# Test 4: Delete link
if [ -n "$OWNER_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "$API_URL/links/$OWNER_LINK_ID" -H "Authorization: Bearer $OWNER_TOKEN")
    print_result "RBAC-030.4" "$STATUS" "200" "OWNER delete link"
else
    echo -e "RBAC-030.4 | ${YELLOW}SKIP${NC} | No link to delete"
fi

echo ""

# RBAC-031: ADMIN Full Links Access
echo "RBAC-031: ADMIN Full Links Access"
echo "------------------------------------------"

# Test 1: List links
STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/links?organizationId=$ORG_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
print_result "RBAC-031.1" "$STATUS" "200" "ADMIN list links"

# Test 2: Create link
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/admin-test\",\"organizationId\":\"$ORG_ID\",\"title\":\"ADMIN Test Link\"}")
STATUS=$(echo "$RESPONSE" | tail -n 1)
ADMIN_LINK_ID=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
print_result "RBAC-031.2" "$STATUS" "201" "ADMIN create link"

# Create a link by OWNER to test ADMIN can update ANY link
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/owner-link-for-admin\",\"organizationId\":\"$ORG_ID\",\"title\":\"Owner Link for Admin Test\"}")
OTHER_LINK_ID=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# Test 3: Update ANY link (ADMIN has * permission)
if [ -n "$OTHER_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PATCH "$API_URL/links/$OTHER_LINK_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"title":"Updated by ADMIN"}')
    print_result "RBAC-031.3" "$STATUS" "200" "ADMIN update OTHER's link"
else
    echo -e "RBAC-031.3 | ${YELLOW}SKIP${NC} | Could not create other user's link"
fi

# Test 4: Delete ANY link (ADMIN has * permission)
if [ -n "$OTHER_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "$API_URL/links/$OTHER_LINK_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
    print_result "RBAC-031.4" "$STATUS" "200" "ADMIN delete OTHER's link"
else
    echo -e "RBAC-031.4 | ${YELLOW}SKIP${NC} | No other user's link to delete"
fi

# Cleanup admin's own link
if [ -n "$ADMIN_LINK_ID" ]; then
    curl -s -o /dev/null -X DELETE "$API_URL/links/$ADMIN_LINK_ID" -H "Authorization: Bearer $ADMIN_TOKEN"
fi

echo ""

# RBAC-032: EDITOR Can Create/Edit OWN Links
echo "RBAC-032: EDITOR Can Create/Edit OWN Links"
echo "------------------------------------------"

# Test 1: List links
STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/links?organizationId=$ORG_ID" -H "Authorization: Bearer $EDITOR_TOKEN")
print_result "RBAC-032.1" "$STATUS" "200" "EDITOR list links"

# Test 2: Create link
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $EDITOR_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/editor-test\",\"organizationId\":\"$ORG_ID\",\"title\":\"EDITOR Test Link\"}")
STATUS=$(echo "$RESPONSE" | tail -n 1)
EDITOR_LINK_ID=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
print_result "RBAC-032.2" "$STATUS" "201" "EDITOR create link"

# Test 3: Update OWN link
if [ -n "$EDITOR_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PATCH "$API_URL/links/$EDITOR_LINK_ID" -H "Authorization: Bearer $EDITOR_TOKEN" -H "Content-Type: application/json" -d '{"title":"Updated by EDITOR"}')
    print_result "RBAC-032.3" "$STATUS" "200" "EDITOR update OWN link"
else
    echo -e "RBAC-032.3 | ${YELLOW}SKIP${NC} | Could not create link for update test"
fi

# Create a link by OWNER to test EDITOR cannot update OTHER's link
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/owner-link-for-editor\",\"organizationId\":\"$ORG_ID\",\"title\":\"Owner Link for Editor Test\"}")
OTHER_LINK_ID2=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# Test 4: Update OTHER's link - Should fail (403)
if [ -n "$OTHER_LINK_ID2" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PATCH "$API_URL/links/$OTHER_LINK_ID2" -H "Authorization: Bearer $EDITOR_TOKEN" -H "Content-Type: application/json" -d '{"title":"Attempted update by EDITOR"}')
    print_result "RBAC-032.4" "$STATUS" "403" "EDITOR update OTHER's link (should fail)"
else
    echo -e "RBAC-032.4 | ${YELLOW}SKIP${NC} | Could not create other user's link"
fi

# Test 5: Delete OWN link
if [ -n "$EDITOR_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "$API_URL/links/$EDITOR_LINK_ID" -H "Authorization: Bearer $EDITOR_TOKEN")
    print_result "RBAC-032.5" "$STATUS" "200" "EDITOR delete OWN link"
else
    echo -e "RBAC-032.5 | ${YELLOW}SKIP${NC} | No link to delete"
fi

# Test 6: Delete OTHER's link - Should fail (403)
if [ -n "$OTHER_LINK_ID2" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "$API_URL/links/$OTHER_LINK_ID2" -H "Authorization: Bearer $EDITOR_TOKEN")
    print_result "RBAC-032.6" "$STATUS" "403" "EDITOR delete OTHER's link (should fail)"
    # Cleanup
    curl -s -o /dev/null -X DELETE "$API_URL/links/$OTHER_LINK_ID2" -H "Authorization: Bearer $OWNER_TOKEN"
else
    echo -e "RBAC-032.6 | ${YELLOW}SKIP${NC} | No other user's link to delete"
fi

echo ""

# RBAC-033: VIEWER Read-Only Links
echo "RBAC-033: VIEWER Read-Only Links"
echo "------------------------------------------"

# Test 1: List links - Should succeed
STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_URL/links?organizationId=$ORG_ID" -H "Authorization: Bearer $VIEWER_TOKEN")
print_result "RBAC-033.1" "$STATUS" "200" "VIEWER list links"

# Test 2: Create link - Should fail (403)
STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_URL/links" -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/viewer-test\",\"organizationId\":\"$ORG_ID\",\"title\":\"VIEWER Test Link\"}")
print_result "RBAC-033.2" "$STATUS" "403" "VIEWER create link (should fail)"

# Create a link to test update/delete
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/links" -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" -d "{\"originalUrl\":\"https://example.com/test-link\",\"organizationId\":\"$ORG_ID\",\"title\":\"Test Link for Viewer\"}")
TEST_LINK_ID=$(echo "$RESPONSE" | sed '$d' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# Test 3: Update link - Should fail (403)
if [ -n "$TEST_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PATCH "$API_URL/links/$TEST_LINK_ID" -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" -d '{"title":"Attempted update by VIEWER"}')
    print_result "RBAC-033.3" "$STATUS" "403" "VIEWER update link (should fail)"
else
    echo -e "RBAC-033.3 | ${YELLOW}SKIP${NC} | Could not create link for update test"
fi

# Test 4: Delete link - Should fail (403)
if [ -n "$TEST_LINK_ID" ]; then
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "$API_URL/links/$TEST_LINK_ID" -H "Authorization: Bearer $VIEWER_TOKEN")
    print_result "RBAC-033.4" "$STATUS" "403" "VIEWER delete link (should fail)"
    # Cleanup
    curl -s -o /dev/null -X DELETE "$API_URL/links/$TEST_LINK_ID" -H "Authorization: Bearer $OWNER_TOKEN"
else
    echo -e "RBAC-033.4 | ${YELLOW}SKIP${NC} | No link to delete"
fi

echo ""
echo "=========================================="
echo "Tests Complete"
echo "=========================================="
