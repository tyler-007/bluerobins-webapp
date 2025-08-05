# Testing Instructions for Database-Driven Pricing System

## Prerequisites

1. **Database Setup**: Ensure the database schema changes have been applied
2. **Admin Access**: You'll need access to the admin pricing page
3. **Test Data**: The system should have some default pricing configurations

## Step 1: Database Setup Verification

### 1.1 Check Database Schema
Run the following SQL queries to verify the database setup:

```sql
-- Check if pricing_config table exists
SELECT * FROM pricing_config LIMIT 5;

-- Check if projects table has type_of_project column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'type_of_project';

-- Check existing pricing configurations
SELECT type_of_project, number_of_sessions, selling_price 
FROM pricing_config 
ORDER BY type_of_project, number_of_sessions;
```

**Expected Results:**
- `pricing_config` table should exist with sample data
- `projects` table should have `type_of_project` column
- Should see default configurations for "Hardware" and "Other" project types

### 1.2 Verify Default Data
You should see default pricing like:
- Hardware, 8 sessions: $1099.00
- Hardware, 12 sessions: $1649.00
- Other, 8 sessions: $1099.00
- Other, 12 sessions: $1649.00

## Step 2: Admin Interface Testing

### 2.1 Access Admin Page
Navigate to: `http://localhost:3000/admin/pricing`

### 2.2 Test Adding New Pricing Configuration
1. **Add a new project type:**
   - Type of Project: "Software"
   - Number of Sessions: "10" (or add a new session option)
   - Selling Price: "1299.00"
   - Click "Add Configuration"

2. **Verify the new configuration appears in the table**

### 2.3 Test Adding New Session Option
1. **Add a new session option:**
   - Type of Project: "Hardware"
   - Number of Sessions: "16" (new option)
   - Selling Price: "2199.00"
   - Click "Add Configuration"

### 2.4 Test Deleting Configuration
1. Click the "Delete" button next to any configuration
2. Verify it's removed from the table

## Step 3: Project Creation Testing

### 3.1 Test Basic Project Creation
Navigate to: `http://localhost:3000/project-hub/create`

**Test Cases:**

#### Case 1: Hardware Project
1. Fill in basic project details (title, description, etc.)
2. **Select "Hardware" as Type of Project**
3. **Verify:**
   - Only Hardware session options appear (8, 12, 16 if added)
   - Price auto-fills based on selection
   - Price updates when changing session count

#### Case 2: Other Project
1. **Select "Other" as Type of Project**
2. **Verify:**
   - Only Other session options appear (8, 12)
   - Price auto-fills correctly
   - Price updates when changing session count

#### Case 3: Software Project (if added)
1. **Select "Software" as Type of Project**
2. **Verify:**
   - Only Software session options appear (10)
   - Price auto-fills correctly

### 3.2 Test Auto-Filling Behavior
1. **Select "Hardware" project type**
2. **Verify session options are filtered** (should only show Hardware sessions)
3. **Change to "Other" project type**
4. **Verify session options update** (should only show Other sessions)
5. **Verify price updates automatically** with each change

### 3.3 Test Form Validation
1. Try submitting without selecting project type
2. Try submitting without selecting sessions
3. **Verify proper error messages appear**

## Step 4: Project Editing Testing

### 4.1 Test Editing Existing Project
1. Navigate to an existing project
2. Click "Edit Project"
3. **Test the same scenarios as project creation:**
   - Change project type and verify session options filter
   - Verify price auto-fills and updates
   - Test form validation

### 4.2 Test Auto-Selection Behavior
1. **Select a project type that doesn't have the current session count**
2. **Verify the system auto-selects the first available session**
3. **Verify the price updates accordingly**

## Step 5: API Testing

### 5.1 Test Pricing API Endpoints

#### GET /api/pricing
```bash
curl http://localhost:3000/api/pricing
```
**Expected:** JSON array of all pricing configurations

#### POST /api/pricing
```bash
curl -X POST http://localhost:3000/api/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "type_of_project": "Test",
    "number_of_sessions": 6,
    "selling_price": 899.00
  }'
```
**Expected:** Success response with the new configuration

#### DELETE /api/pricing
```bash
curl -X DELETE http://localhost:3000/api/pricing \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```
**Expected:** Success response

## Step 6: Edge Cases Testing

### 6.1 Test Empty Database
1. **Temporarily clear pricing_config table**
2. **Try creating a project**
3. **Verify graceful handling** (should show loading state or empty options)

### 6.2 Test Invalid Data
1. **Try adding pricing with invalid price** (negative, non-numeric)
2. **Try adding pricing with invalid sessions** (negative, non-numeric)
3. **Verify proper error handling**

### 6.3 Test Concurrent Updates
1. **Open admin page in two tabs**
2. **Add different configurations in each tab**
3. **Verify no conflicts occur**

## Step 7: Performance Testing

### 7.1 Test Large Dataset
1. **Add 50+ pricing configurations**
2. **Test project creation/editing performance**
3. **Verify no significant slowdown**

### 7.2 Test Network Issues
1. **Simulate slow network** (Chrome DevTools → Network → Slow 3G)
2. **Test loading states**
3. **Verify proper error handling**

## Step 8: Browser Compatibility Testing

### 8.1 Test Different Browsers
- Chrome
- Firefox
- Safari
- Edge

### 8.2 Test Mobile Responsiveness
- Test on mobile devices
- Test responsive design

## Expected Behaviors Summary

### ✅ Auto-Filling Features
- [ ] Project type selection filters session options
- [ ] Price auto-calculates based on project type + sessions
- [ ] Price updates in real-time when selections change
- [ ] Invalid session selections auto-correct to first available option

### ✅ Dynamic Features
- [ ] New project types can be added via admin without code changes
- [ ] New session options can be added via admin without code changes
- [ ] UI automatically updates to show new options

### ✅ Data Persistence
- [ ] Created projects save with correct pricing
- [ ] Edited projects update with correct pricing
- [ ] Admin changes persist in database

### ✅ Error Handling
- [ ] Graceful handling of missing data
- [ ] Proper validation messages
- [ ] Loading states during data fetching

## Troubleshooting

### Common Issues

1. **"Loading..." state never disappears**
   - Check browser console for errors
   - Verify database connection
   - Check API endpoints are accessible

2. **Session options not filtering**
   - Verify `pricing_config` table has correct data
   - Check browser console for JavaScript errors
   - Verify `getAvailableSessionsForProjectType` function

3. **Price not auto-filling**
   - Check `getPricing` function logic
   - Verify data types (string vs number)
   - Check browser console for errors

4. **Admin page not accessible**
   - Verify route exists: `/admin/pricing`
   - Check authentication/authorization
   - Verify all required components are imported

### Debug Commands

```bash
# Check if Next.js server is running
curl http://localhost:3000/api/pricing

# Check database connection
# (Use your database client to run the verification queries above)

# Check browser console for errors
# (Open DevTools → Console tab)
```

## Success Criteria

The implementation is successful if:

1. ✅ **Zero Code Changes Required**: New project types and session options can be added via admin interface
2. ✅ **Auto-Filling Works**: Selecting project type filters sessions and auto-fills price
3. ✅ **Real-Time Updates**: Price updates immediately when selections change
4. ✅ **Data Persistence**: All changes are saved to database correctly
5. ✅ **Error Handling**: Graceful handling of edge cases and errors
6. ✅ **Performance**: No significant performance degradation with dynamic data

## Next Steps After Testing

1. **Deploy to staging environment**
2. **Test with real users**
3. **Monitor performance metrics**
4. **Gather feedback and iterate** 