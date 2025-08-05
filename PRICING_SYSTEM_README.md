# Database-Driven Pricing System

## Overview

The pricing system has been updated to use database-driven configuration instead of hardcoded prices. This allows for flexible pricing management without code changes.

## Changes Made

### 1. Database Schema

**New Table: `pricing_config`**
```sql
CREATE TABLE pricing_config (
    id SERIAL PRIMARY KEY,
    type_of_project VARCHAR(50) NOT NULL,
    number_of_sessions INTEGER NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type_of_project, number_of_sessions)
);
```

**Updated Table: `projects`**
- Added `type_of_project` column (VARCHAR(50), default: 'Other')

### 2. Code Changes

#### Create Project Page (`app/(private)/project-hub/create/page.tsx`)
- ✅ Removed hardcoded `SELLING_PRICE_COST_MAP`
- ✅ Added `typeOfProject` field to form schema
- ✅ Added dynamic session options to form schema
- ✅ Added database pricing lookup function
- ✅ Updated form to include project type selection
- ✅ Updated form to include dynamic session selection
- ✅ Removed `cost_price` from database operations

#### Edit Project Page (`app/(private)/project-hub/[id]/edit/page.tsx`)
- ✅ Removed hardcoded `SELLING_PRICE_COST_MAP`
- ✅ Added `typeOfProject` field to form schema
- ✅ Added dynamic session options to form schema
- ✅ Added database pricing lookup function
- ✅ Updated form to include project type selection
- ✅ Updated form to include dynamic session selection
- ✅ Removed `cost_price` from database operations

#### Project Shape (`app/shapes/project.ts`)
- ✅ Removed `cost_price` from type definition
- ✅ Added `type_of_project` field

#### Project Card (`app/components/NewProjectCard.tsx`)
- ✅ Removed `cost_price` usage
- ✅ Updated to use only `selling_price`

### 3. New API Endpoints

**`/api/pricing`**
- `GET`: Fetch all pricing configurations
- `POST`: Add/update pricing configuration
- `DELETE`: Delete pricing configuration

### 4. Admin Interface

**`/admin/pricing`**
- Add new pricing configurations
- View current pricing configurations
- Delete pricing configurations
- Dynamic project type and session option selection

## Setup Instructions

### 1. Database Setup

Run the SQL script in `database_setup.sql`:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U your-username -d your-database -f database_setup.sql
```

Or run the SQL commands directly in your Supabase dashboard.

### 2. Default Pricing Data

The setup script includes default pricing:
- Hardware, 8 sessions: $1299
- Hardware, 12 sessions: $1849
- Other, 8 sessions: $1099
- Other, 12 sessions: $1649

### 3. Access Admin Interface

Navigate to `/admin/pricing` to manage pricing configurations.

## Usage

### For Mentors
1. When creating a project, select the project type (Hardware or Other)
2. The system automatically filters available session options based on the selected project type
3. Choose the number of sessions from the filtered options
4. The system automatically displays and calculates the price based on database configuration
5. When editing a project, the same auto-filling behavior applies

### For Administrators
1. Access `/admin/pricing`
2. Add new pricing configurations
3. Modify existing prices

## Dynamic Features

### Project Types
- Project types are dynamically fetched from the `pricing_config` table
- New project types can be added via the admin interface without code changes
- The create/edit project forms automatically update to show new project types

### Session Options with Auto-Filling
- Number of sessions are dynamically fetched from the `pricing_config` table
- When a project type is selected, only available sessions for that type are shown
- The system automatically selects the first available session if the current selection is invalid
- New session options can be added via the admin interface without code changes
- The create/edit project forms automatically update to show new session options

### Auto-Filled Pricing
- When a project type and session count are selected, the price is automatically calculated and displayed
- The price updates in real-time as selections change
- No manual price entry required
- Price is displayed prominently in the UI for transparency

## Benefits

1. **Flexible Pricing**: Change prices without code deployment
2. **Dynamic Project Types**: Add new project types without code changes
3. **Admin Control**: Web interface for pricing management
4. **Scalable**: Easy to add new project types or session counts
5. **Audit Trail**: Database timestamps for tracking changes
6. **Zero Code Changes**: All project types are fetched dynamically from database

## Migration Notes

- Existing projects will default to "Other" type
- `cost_price` field has been removed from all operations
- All pricing is now based on `selling_price` only
- Backward compatibility maintained for existing projects

## Future Enhancements

1. **Bulk Pricing Updates**: Mass update pricing configurations
2. **Pricing History**: Track pricing changes over time
3. **Regional Pricing**: Support different prices by region
4. **Seasonal Pricing**: Time-based pricing adjustments
5. **Project Type Management**: Admin interface to add/remove project types 