# Manual Test Execution Checklist: DEV-020 & DEV-021

**Project:** PingTO.Me - URL Shortener Platform
**Features:** API Key Scopes
**Test Cases:** DEV-020, DEV-021
**Status:** Ready for Manual Execution
**Date:** December 12, 2025

---

## Pre-Test Setup

### Environment Verification
- [ ] Web app running on `http://localhost:3010`
- [ ] API running on `http://localhost:3011`
- [ ] Database populated with test data
- [ ] Test user account created: `e2e-owner@pingtome.test`
- [ ] Test user password: `TestPassword123!`
- [ ] Browser developer tools available (F12)

### Browser Setup
- [ ] Chrome/Chromium latest version
- [ ] No browser extensions interfering
- [ ] JavaScript enabled
- [ ] Cookies/localStorage cleared
- [ ] Zoom level at 100%
- [ ] Network throttling disabled (for now)

### Test Data Preparation
- [ ] Log in as test user
- [ ] Navigate to `/dashboard/developer/api-keys`
- [ ] Note any existing API keys
- [ ] Prepare test key names for creation

---

## DEV-020: Display All Available Scopes

### Test Objective
Verify that the Create API Key dialog displays all available scopes organized by resource category.

### Test Execution

#### Step 1: Navigate to API Keys Page
**Action:**
1. Click on "Developer" in sidebar or navigate to `/dashboard/developer/api-keys`
2. Verify page loads with "API Keys" heading

**Expected:**
- [ ] Page title "API Keys" visible
- [ ] "Create API Key" button visible
- [ ] Page content loads without errors
- [ ] Console has no JavaScript errors

**Screenshot:** `dev-020-step-1-navigate.png`

---

#### Step 2: Open Create API Key Dialog
**Action:**
1. Click "Create API Key" button (blue button with Plus icon)
2. Wait for dialog to fully open

**Expected:**
- [ ] Dialog appears centered on screen
- [ ] Dialog overlay visible
- [ ] Dialog does not auto-close
- [ ] All dialog content loaded

**Verify:**
- [ ] Dialog title: "Create API Key"
- [ ] Subtitle: "Configure your API key with specific permissions and settings."
- [ ] Icon visible (Key icon in blue circle)

**Screenshot:** `dev-020-step-2-dialog-open.png`

---

#### Step 3: Verify Key Name Input
**Action:**
1. Look for "Key Name" input field
2. Click on it to focus

**Expected:**
- [ ] Input field with label "Key Name"
- [ ] Placeholder text visible: "e.g., Production Server, Mobile App"
- [ ] Input accepts text entry
- [ ] Field is required (indicated by layout)

**Screenshot:** `dev-020-step-3-key-name.png`

---

#### Step 4: Verify Permissions (Scopes) Section
**Action:**
1. Locate the "Permissions (Scopes)" section below Key Name
2. Read the description text

**Expected:**
- [ ] Section header with Shield icon
- [ ] Label text: "Permissions (Scopes)"
- [ ] Description: "Select the permissions this API key should have. Choose only what's needed."
- [ ] Clear visual separation from other sections

**Screenshot:** `dev-020-step-4-permissions-section.png`

---

#### Step 5: Verify Resource Categories Display
**Action:**
1. Scroll down slightly in the dialog to see all scope sections
2. Count the number of resource category headers

**Expected Resource Categories (7 total):**
- [ ] Link (group header visible)
- [ ] Analytics (group header visible)
- [ ] Domain (group header visible)
- [ ] Campaign (group header visible)
- [ ] Tag (group header visible)
- [ ] BioPage (group header visible)
- [ ] Team (group header visible)

**Verify Format:**
- [ ] Each category has bold header with horizontal line
- [ ] Category names are capitalized
- [ ] Categories are in logical order

**Screenshot:** `dev-020-step-5-all-categories.png`

---

#### Step 6: Verify Link Scopes (6 scopes)
**Action:**
1. Locate "Link" section
2. Count checkboxes under this header
3. Read each label

**Expected Scopes:**
- [ ] read
- [ ] create
- [ ] update
- [ ] delete
- [ ] export
- [ ] bulk

**Verify:**
- [ ] Each scope has checkbox (unchecked initially)
- [ ] Each scope has readable label
- [ ] Scopes arranged in 2-column grid
- [ ] All 6 scopes visible without scrolling (section-wise)

**Hover Test:**
- [ ] Hover over one scope checkbox
- [ ] Tooltip appears with description
- [ ] Tooltip is readable and meaningful

**Screenshot:** `dev-020-step-6-link-scopes.png`

---

#### Step 7: Verify Analytics Scopes (2 scopes)
**Action:**
1. Locate "Analytics" section
2. Count checkboxes

**Expected Scopes:**
- [ ] read
- [ ] export

**Verify:**
- [ ] Both scopes visible
- [ ] Format matches Link scopes
- [ ] Tooltip descriptions available on hover

**Screenshot:** `dev-020-step-7-analytics-scopes.png`

---

#### Step 8: Verify Domain Scopes (4 scopes)
**Action:**
1. Locate "Domain" section
2. Count and verify scopes

**Expected Scopes:**
- [ ] read
- [ ] create
- [ ] verify
- [ ] delete

**Verify:**
- [ ] All 4 scopes present
- [ ] Proper formatting and layout
- [ ] Tooltips available

**Screenshot:** `dev-020-step-8-domain-scopes.png`

---

#### Step 9: Verify Campaign, Tag, BioPage, Team Scopes
**Action:**
1. Scroll through remaining sections
2. Verify each category exists and displays scopes

**Campaign Scopes (4):**
- [ ] read
- [ ] create
- [ ] update
- [ ] delete

**Tag Scopes (4):**
- [ ] read
- [ ] create
- [ ] update
- [ ] delete

**BioPage Scopes (4):**
- [ ] read
- [ ] create
- [ ] update
- [ ] delete

**Team Scopes (1):**
- [ ] read

**Screenshot:** `dev-020-step-9-remaining-scopes.png`

---

#### Step 10: Verify Advanced Settings Section
**Action:**
1. Scroll to bottom of scope list
2. Look for "Advanced Settings (Optional)" button/section

**Expected:**
- [ ] Section visible below scopes
- [ ] Labeled "Advanced Settings (Optional)"
- [ ] Appears collapsed (can be expanded)
- [ ] Has chevron icon indicating toggle state

**Expand Test:**
- [ ] Click to expand (if collapsed)
- [ ] Verify contains:
  - [ ] IP Whitelist field
  - [ ] Rate Limit field
  - [ ] Expiration Date field

**Screenshot:** `dev-020-step-10-advanced-settings.png`

---

#### Step 11: Verify Scope Total Count
**Action:**
1. Count all checkboxes visible in Permissions section
2. Calculate total

**Expected Total:**
- [ ] Minimum 25 scopes
- [ ] Exact: Link(6) + Analytics(2) + Domain(4) + Campaign(4) + Tag(4) + BioPage(4) + Team(1) = 25

**Verification:**
- [ ] Total matches expected
- [ ] No duplicate scopes
- [ ] No missing scopes

**Screenshot:** `dev-020-step-11-total-count.png`

---

#### Step 12: DEV-020 Dialog Footer
**Action:**
1. Look at bottom of dialog
2. Identify action buttons

**Expected:**
- [ ] "Cancel" button (outline style)
- [ ] "Create Key" button (blue/primary style)
- [ ] Both buttons visible and clickable

**Verify Button States:**
- [ ] Create Key button is DISABLED (grayed out)
- [ ] Reason: No scopes selected yet
- [ ] Cancel button is always ENABLED

**Screenshot:** `dev-020-step-12-footer.png`

---

### DEV-020 Summary Check
**All Verification Points:**
- [ ] Dialog displays completely
- [ ] All 7 resource categories visible
- [ ] All 25 scopes displayed
- [ ] Each scope has checkbox and label
- [ ] Scope descriptions available via tooltip
- [ ] Advanced settings section available
- [ ] Proper form validation states

**DEV-020 Status:**
- [ ] PASS - All scopes displayed correctly
- [ ] FAIL - [Describe any failures]
- [ ] PARTIAL PASS - [Describe partial issues]

---

## DEV-021: Scope Selection and Deselection

### Test Objective
Verify that users can select and deselect individual scopes with proper UI feedback.

### Test Execution

#### Step 1: Select First Scope
**Action:**
1. Dialog should still be open from DEV-020 tests
2. Click the checkbox for "link: read" scope
3. Verify it becomes checked

**Expected:**
- [ ] Checkbox shows checkmark
- [ ] Checkbox appears selected/filled
- [ ] Selection responds immediately (no lag)
- [ ] No console errors

**Verify:**
- [ ] Checkbox state changed visually
- [ ] Only this checkbox is checked
- [ ] Other checkboxes remain unchecked

**Screenshot:** `dev-021-step-1-first-select.png`

---

#### Step 2: Verify Selected Badge Appears
**Action:**
1. After selecting first scope, look below the scope list
2. Check if badge appears showing selected scopes

**Expected:**
- [ ] Blue/info colored container appears
- [ ] Shows text "Selected:"
- [ ] Shows badge for "link read" (or "link: read")
- [ ] Badge has appropriate styling and color
- [ ] Badge appears in real-time (not after delay)

**Verify:**
- [ ] Badge container visible
- [ ] Selected scope name shown in badge
- [ ] Badge styling is clear and readable
- [ ] No overlap with other UI elements

**Screenshot:** `dev-021-step-2-badge-appears.png`

---

#### Step 3: Select Second Scope
**Action:**
1. Click checkbox for "analytics: read" scope
2. Observe badge update

**Expected:**
- [ ] Second checkbox becomes checked
- [ ] Badge updates immediately
- [ ] Now shows 2 selected scopes
- [ ] Both "link read" and "analytics read" badges visible

**Verify:**
- [ ] Both checkboxes checked
- [ ] Both badges displayed
- [ ] Badges arranged horizontally or vertically as designed
- [ ] Badge count updates correctly

**Screenshot:** `dev-021-step-3-second-select.png`

---

#### Step 4: Select Third Scope
**Action:**
1. Click checkbox for "link: create" scope
2. Verify badge updates

**Expected:**
- [ ] Third checkbox checked
- [ ] Badge now shows 3 selected scopes
- [ ] All 3 badges visible
- [ ] Clear visual indication of selected count

**Screenshot:** `dev-021-step-4-third-select.png`

---

#### Step 5: Verify Multiple Selection Badge Display
**Action:**
1. Look at the badge container with 3 selected scopes
2. Verify layout and styling

**Expected:**
- [ ] Badge container shows "Selected:" label
- [ ] All 3 scope badges listed
- [ ] Badges have color coding:
  - Read operations: Gray/slate
  - Create operations: Blue
  - Other operations: Various colors
- [ ] Badges have clear separation/padding
- [ ] No text overflow or truncation
- [ ] Scrolling within badge area works if needed

**Screenshot:** `dev-021-step-5-badge-layout.png`

---

#### Step 6: Deselect One Scope
**Action:**
1. Click checkbox for "link: read" to deselect it
2. Observe badge and checkbox state

**Expected:**
- [ ] "link: read" checkbox becomes unchecked
- [ ] "link read" badge disappears from selected section
- [ ] 2 badges remain (analytics read, link create)
- [ ] Changes instant and visible

**Verify:**
- [ ] Correct scope deselected
- [ ] Remaining checkboxes still checked
- [ ] Badge count updated to 2
- [ ] Badge display accurate

**Screenshot:** `dev-021-step-6-deselect-one.png`

---

#### Step 7: Deselect All Remaining Scopes
**Action:**
1. Click "analytics: read" checkbox to deselect
2. Click "link: create" checkbox to deselect
3. Observe badge behavior

**Expected:**
- [ ] After first deselect: 1 scope remains (link create)
- [ ] Badge shows only 1 item
- [ ] After second deselect: 0 scopes remain
- [ ] Badge container DISAPPEARS (not just empty)
- [ ] All checkboxes unchecked

**Verify:**
- [ ] Badge completely hidden when empty
- [ ] No empty badge container visible
- [ ] Checkboxes return to unchecked state
- [ ] UI returns to initial state

**Screenshot:** `dev-021-step-7-deselect-all.png`

---

#### Step 8: Verify Create Button State Changes
**Action:**
1. With no scopes selected, look at Create Key button
2. Verify it's disabled

**Expected:**
- [ ] Create Key button appears grayed out
- [ ] Button text: "Create Key"
- [ ] Button NOT clickable
- [ ] Visual indication of disabled state

**Now Select Scopes:**
1. Click 2 scope checkboxes
2. Observe Create button

**Expected:**
- [ ] Create Key button becomes highlighted/enabled
- [ ] Button appears clickable
- [ ] Color changes from gray to primary color (blue)
- [ ] No change in button text

**Screenshot Before:** `dev-021-step-8-button-disabled.png`
**Screenshot After:** `dev-021-step-8-button-enabled.png`

---

#### Step 9: Rapid Selection/Deselection Test
**Action:**
1. Rapidly click 5-6 checkboxes in quick succession
2. Deselect them rapidly
3. Observe responsiveness

**Expected:**
- [ ] UI responds to every click
- [ ] No missed clicks or lost updates
- [ ] Badge updates reflect every change
- [ ] Checkboxes visually update correctly
- [ ] No lag or slowdown

**Verify:**
- [ ] All clicks registered
- [ ] Final state is correct
- [ ] No visual glitches
- [ ] No console errors

**Screenshot:** `dev-021-step-9-rapid-toggle.png`

---

#### Step 10: Test "Create Without Scopes" Validation
**Action:**
1. Ensure no scopes are selected
2. Fill in Key Name field: "Test Validation"
3. Attempt to click Create Key button

**Expected:**
- [ ] Create Key button is disabled (cannot click)
- [ ] OR if clickable, shows error: "Please select at least one scope"
- [ ] Dialog remains open
- [ ] Form not submitted

**Verify:**
- [ ] Validation works correctly
- [ ] Prevents invalid API call
- [ ] User gets clear feedback

**Screenshot:** `dev-021-step-10-validation.png`

---

#### Step 11: Select Scopes from Different Categories
**Action:**
1. Select scope from Link category: "link: read"
2. Select scope from Domain category: "domain: verify"
3. Select scope from Team category: "team: read"
4. Verify badge display

**Expected:**
- [ ] All 3 checkboxes checked
- [ ] All 3 badges visible
- [ ] Badges show different colors (based on operation type)
- [ ] Create button is enabled
- [ ] Ready to create key with mixed scope categories

**Verify:**
- [ ] Cross-category selection works
- [ ] Badge display accurate
- [ ] Form state correct

**Screenshot:** `dev-021-step-11-mixed-categories.png`

---

#### Step 12: Create API Key with Selected Scopes
**Action:**
1. Verify 2-3 scopes selected and visible in badge
2. Enter Key Name: "E2E Test Key [timestamp]"
3. Click "Create Key" button

**Expected:**
- [ ] Dialog processes the request
- [ ] Loading state (if visible)
- [ ] API call succeeds (check Network tab)
- [ ] Success message appears
- [ ] New API key displayed for copying
- [ ] Original dialog closes

**Verify Success Screen:**
- [ ] Title: "API Key Created!"
- [ ] Subtitle: "Copy this key now. You won't be able to see it again!"
- [ ] API key value in copyable format
- [ ] Copy button available
- [ ] "I've copied my key" acknowledgment button

**Screenshot Success:** `dev-021-step-12-creation-success.png`

---

#### Step 13: Verify Created Key in Table
**Action:**
1. Close the success dialog (click acknowledgment or X)
2. Look at "Your API Keys" table below
3. Find newly created key

**Expected:**
- [ ] New key appears in the table
- [ ] Key name matches what was entered
- [ ] Scopes column shows selected scopes as badges
- [ ] Created date/time accurate
- [ ] Status shows "Active" or "Never used"

**Verify Key Details:**
- [ ] Name: Matches input
- [ ] Scopes: Shows correct badges for selected scopes
- [ ] Created: Today's date
- [ ] Actions: Rotate, Set Expiration, Revoke buttons available

**Screenshot:** `dev-021-step-13-key-in-table.png`

---

### DEV-021 Summary Check
**All Verification Points:**
- [ ] Checkboxes toggle correctly
- [ ] Badges appear on selection
- [ ] Badges disappear on deselection
- [ ] Multiple scopes can be selected
- [ ] Badge count is accurate
- [ ] Create button state changes correctly
- [ ] Form validation prevents invalid submission
- [ ] API key creation succeeds with selected scopes
- [ ] New key appears in table with correct scopes

**DEV-021 Status:**
- [ ] PASS - All scope selection/deselection works correctly
- [ ] FAIL - [Describe any failures]
- [ ] PARTIAL PASS - [Describe partial issues]

---

## Cross-Test Integration Verification

### Complete Workflow Test
**Action:**
1. From DEV-020 and DEV-021, perform complete end-to-end flow:

**Workflow:**
1. Navigate to API Keys page
2. Click Create API Key (DEV-020: Dialog displays all scopes)
3. Select 4-5 scopes from different categories (DEV-021: Selection works)
4. Enter key name
5. Click Create
6. Verify success
7. Close success dialog
8. Verify key in table

**Expected:**
- [ ] All steps complete without errors
- [ ] UI responsive throughout
- [ ] No console errors
- [ ] Final result: New API key with correct scopes

**Screenshots:**
- `integration-start.png` - Page initial state
- `integration-dialog-open.png` - Dialog with all scopes (DEV-020)
- `integration-scopes-selected.png` - Multiple scopes selected (DEV-021)
- `integration-success.png` - API key created
- `integration-table.png` - Key visible in table

---

## Browser Compatibility Verification

### Chrome/Chromium
- [ ] Dialog renders correctly
- [ ] All scopes visible
- [ ] Checkboxes responsive
- [ ] Badges display properly
- [ ] Creation succeeds

### Firefox (if testing)
- [ ] Dialog renders correctly
- [ ] All scopes visible
- [ ] Checkboxes responsive
- [ ] Badges display properly
- [ ] Creation succeeds

### Safari (if testing)
- [ ] Dialog renders correctly
- [ ] All scopes visible
- [ ] Checkboxes responsive
- [ ] Badges display properly
- [ ] Creation succeeds

### Mobile Browser (if testing)
- [ ] Dialog is readable on smaller screen
- [ ] Touch interactions work
- [ ] Scrolling necessary but functional
- [ ] Scopes selectable on mobile
- [ ] Creation succeeds

---

## Performance & Responsiveness

### Load Time Testing
- [ ] Dialog opens in <1 second
- [ ] Scopes render within <500ms
- [ ] No layout shift while loading

### Interaction Performance
- [ ] Checkbox toggle instant (<50ms)
- [ ] Badge updates instant (<50ms)
- [ ] Button state change instant (<50ms)
- [ ] No UI lag during rapid clicking
- [ ] No slowdown when scrolling scope list

### API Performance
- [ ] Scope fetch completes <1 second
- [ ] API key creation completes <2 seconds
- [ ] Success dialog appears without delay

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key moves between checkboxes
- [ ] Enter/Space toggles checkboxes
- [ ] Tab wraps around at end of dialog
- [ ] Can reach all interactive elements

### Screen Reader (if applicable)
- [ ] Checkboxes announced correctly
- [ ] Scope names read clearly
- [ ] Button states announced
- [ ] Error messages announced

### Color Contrast
- [ ] Badge text readable
- [ ] Button text readable
- [ ] All colors meet WCAG AA standards
- [ ] No information conveyed by color alone

---

## Error Handling & Edge Cases

### Network Error Simulation
- [ ] Slow network (throttled): Dialog still works
- [ ] Offline: Shows appropriate error
- [ ] API error: Error message displayed

### Edge Cases
- [ ] Very long key name: Properly handled
- [ ] Select all scopes: Works correctly
- [ ] Deselect all scopes: Validation prevents submission
- [ ] Rapid dialog open/close: No memory leaks
- [ ] Multiple windows: No state conflicts

---

## Summary of Findings

### DEV-020 Test Results
**Status:** [ ] PASS [ ] FAIL [ ] PARTIAL

**Issues Found:**
1.
2.
3.

**Notes:**
[Add any observations or comments]

---

### DEV-021 Test Results
**Status:** [ ] PASS [ ] FAIL [ ] PARTIAL

**Issues Found:**
1.
2.
3.

**Notes:**
[Add any observations or comments]

---

## Overall Assessment

### Feature Completeness
- [ ] All required features implemented
- [ ] All expected behaviors observed
- [ ] No critical gaps
- [ ] Ready for production

### Quality Assessment
- [ ] Code quality acceptable
- [ ] UI/UX intuitive
- [ ] Performance acceptable
- [ ] No blocking issues

### Sign-Off

**Tester Name:** ___________________
**Date:** _____/_____/_____
**Status:** [ ] APPROVED [ ] APPROVED WITH NOTES [ ] REJECTED

**Comments:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

---

## Appendix: Quick Reference

### Key URLs
- API Keys Page: http://localhost:3010/dashboard/developer/api-keys
- API Endpoint: http://localhost:3011/developer/api-keys

### Test Credentials
- Email: e2e-owner@pingtome.test
- Password: TestPassword123!

### Expected Scopes
- Link: read, create, update, delete, export, bulk
- Analytics: read, export
- Domain: read, create, verify, delete
- Campaign: read, create, update, delete
- Tag: read, create, update, delete
- BioPage: read, create, update, delete
- Team: read

### Button States
- Create Key: Enabled when ≥1 scope selected
- Create Key: Disabled when 0 scopes selected
- Cancel: Always enabled

### Badge Display
- Appears when: ≥1 scope selected
- Disappears when: 0 scopes selected
- Shows: "Selected: [scope badges]"

---

**End of Manual Test Execution Checklist**

For automated test execution, see: `uat-dev-api-scopes.spec.ts`
For detailed documentation, see: `DEV-020-021-API-Scopes-UAT-Report.md`
