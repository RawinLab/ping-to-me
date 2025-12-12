#!/bin/bash

##############################################################################
# UAT Test: RBAC-004 - VIEWER Cannot Access Org Settings
##############################################################################
# Test: Verify VIEWER can view but not modify organization settings
# Expected: GET returns 200, PUT returns 403 Forbidden
##############################################################################

# set -e removed - we handle errors explicitly

# Configuration
API_URL="http://localhost:3011"
ORG_ID="e2e00000-0000-0000-0001-000000000001"
VIEWER_EMAIL="e2e-viewer@pingtome.test"
VIEWER_PASSWORD="TestPassword123!"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Cleanup function
cleanup() {
    rm -f /tmp/rbac-004-*.json
}
trap cleanup EXIT

# Helper functions
print_header() {
    echo -e "\n${BLUE}=====================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_failure() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Create JSON payloads
create_login_payload() {
    cat > /tmp/rbac-004-login.json <<EOF
{
  "email": "$VIEWER_EMAIL",
  "password": "$VIEWER_PASSWORD"
}
EOF
}

create_org_update_payload() {
    cat > /tmp/rbac-004-org-update.json <<EOF
{
  "name": "Updated Organization Name",
  "description": "This should not be allowed"
}
EOF
}

##############################################################################
# Main Test Execution
##############################################################################

print_header "RBAC-004: VIEWER Cannot Access Org Settings"

echo "Test Configuration:"
echo "  API URL: $API_URL"
echo "  Organization ID: $ORG_ID"
echo "  VIEWER Email: $VIEWER_EMAIL"
echo ""

##############################################################################
# Step 1: Login as VIEWER and get access token
##############################################################################

print_test "Step 1: Login as VIEWER user"
create_login_payload

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d @/tmp/rbac-004-login.json)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

    if [ -n "$ACCESS_TOKEN" ]; then
        print_success "VIEWER login successful (HTTP $HTTP_CODE)"
        print_info "Access token obtained: ${ACCESS_TOKEN:0:20}..."
    else
        print_failure "Login returned $HTTP_CODE but no access token found"
        echo "Response: $RESPONSE_BODY"
        exit 1
    fi
else
    print_failure "VIEWER login failed (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

##############################################################################
# Step 2: GET /organizations/{orgId} - Should return 200 (can view)
##############################################################################

print_test "Step 2: GET organization details (should succeed)"

GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$API_URL/organizations/$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$GET_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    ORG_NAME=$(echo "$RESPONSE_BODY" | grep -o '"name":"[^"]*' | sed 's/"name":"//' | head -n1)
    print_success "VIEWER can view organization (HTTP 200)"
    print_info "Organization name: $ORG_NAME"

    # Save original org data for verification
    echo "$RESPONSE_BODY" > /tmp/rbac-004-original-org.json
else
    print_failure "VIEWER cannot view organization (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
    echo "Expected: HTTP 200"
fi

##############################################################################
# Step 3: PUT /organizations/{orgId} - Should return 403 Forbidden
##############################################################################

print_test "Step 3: PUT organization (should return 403 Forbidden)"
create_org_update_payload

PUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "$API_URL/organizations/$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/rbac-004-org-update.json)

HTTP_CODE=$(echo "$PUT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PUT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ]; then
    print_success "VIEWER cannot modify organization (HTTP 403 Forbidden)"

    # Check for proper error message
    if echo "$RESPONSE_BODY" | grep -q "Forbidden\|forbidden\|permission"; then
        print_info "Proper error message returned"
    fi

    echo "Response: $RESPONSE_BODY"
else
    print_failure "Expected 403 Forbidden, got HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "SECURITY ISSUE: VIEWER should not be able to modify organization!"
fi

##############################################################################
# Step 4: Verify organization was not modified
##############################################################################

print_test "Step 4: Verify organization data remains unchanged"

VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$API_URL/organizations/$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    CURRENT_NAME=$(echo "$RESPONSE_BODY" | grep -o '"name":"[^"]*' | sed 's/"name":"//' | head -n1)

    if [ "$CURRENT_NAME" != "Updated Organization Name" ]; then
        print_success "Organization data unchanged (name: $CURRENT_NAME)"
    else
        print_failure "Organization was modified despite 403 response!"
        echo "Current name: $CURRENT_NAME"
        echo "This indicates a security vulnerability!"
    fi
else
    print_info "Could not verify organization state (HTTP $HTTP_CODE)"
fi

##############################################################################
# Additional Security Tests
##############################################################################

print_header "Additional VIEWER Permission Tests"

##############################################################################
# Test 5: Try to update organization settings
##############################################################################

print_test "Step 5: PATCH organization settings (should return 403)"

cat > /tmp/rbac-004-settings.json <<EOF
{
  "requireTwoFactor": true,
  "allowedIpAddresses": ["192.168.1.1"]
}
EOF

SETTINGS_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "$API_URL/organizations/$ORG_ID/settings" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/rbac-004-settings.json)

HTTP_CODE=$(echo "$SETTINGS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SETTINGS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
    print_success "VIEWER cannot modify organization settings (HTTP $HTTP_CODE)"
else
    print_failure "VIEWER should not be able to modify settings (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

##############################################################################
# Test 6: Try to delete organization
##############################################################################

print_test "Step 6: DELETE organization (should return 403)"

DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
  "$API_URL/organizations/$ORG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ] || [ "$HTTP_CODE" -eq 404 ]; then
    print_success "VIEWER cannot delete organization (HTTP $HTTP_CODE)"
else
    print_failure "VIEWER should not be able to delete organization (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

##############################################################################
# Test Summary
##############################################################################

print_header "Test Summary"

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}=====================================================================${NC}"
    echo -e "${GREEN}ALL TESTS PASSED - RBAC-004 VERIFIED${NC}"
    echo -e "${GREEN}=====================================================================${NC}"
    echo ""
    echo "VIEWER role correctly:"
    echo "  ✓ Can view organization details"
    echo "  ✓ Cannot modify organization settings"
    echo "  ✓ Cannot update organization data"
    echo "  ✓ Cannot delete organization"
    echo "  ✓ Receives 403 Forbidden for write operations"
    exit 0
else
    echo -e "${RED}=====================================================================${NC}"
    echo -e "${RED}TESTS FAILED - RBAC VIOLATIONS DETECTED${NC}"
    echo -e "${RED}=====================================================================${NC}"
    echo ""
    echo "Please review the failed tests above."
    echo "VIEWER role should have read-only access to organizations."
    exit 1
fi
