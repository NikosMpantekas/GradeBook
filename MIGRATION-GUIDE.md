# GradeBook Migration Guide
## Migrating from Multi-Database to Single-Database Multi-Tenant Architecture

This guide outlines the steps to migrate the GradeBook application from using multiple MongoDB databases (one per school) to a single MongoDB database with multi-tenancy using the `schoolId` field.

## Overview of Changes

1. **Schema Updates**: Added `schoolId` field to all models
2. **Authentication Changes**: Updated to support multi-tenancy
3. **Query Filtering**: Modified all controllers to filter by `schoolId`
4. **Middleware**: Added multi-tenancy enforcement middleware
5. **Data Migration**: Script to move data from multiple DBs to one DB

## Prerequisites

- Backup all your existing databases before proceeding
- Make sure you have sufficient disk space for the combined database
- Ensure MongoDB is running with enough connection capacity

## Migration Steps

### 1. Prepare Your Environment

```bash
# Create a backup of all databases
mongodump --uri=<your-mongodb-uri> --out=backup_$(date +%Y%m%d)

# Make sure you have the latest code
git pull
npm install
```

### 2. Update Configuration

1. Update your `.env` file to point to the new single database:

```
MONGO_URI=mongodb://localhost:27017/gradebook
```

Note: You can keep the same database URI if you're using the same MongoDB instance, just pick one database name.

### 3. Run the Migration Script

```bash
cd backend
node scripts/migrateToSingleDb.js
```

This will:
- Connect to each school's database
- Extract all collections
- Add the appropriate `schoolId` to each document
- Insert the data into the new single database

The script generates a detailed log file at `backend/scripts/migration_log.txt`.

### 4. Verify the Migration

After the migration completes, check the log file for any errors. You should verify:

1. All schools were processed
2. The number of migrated documents matches expectations
3. No critical errors occurred

### 5. Test the New System

Before going live, test thoroughly:

1. User authentication for different schools
2. Data isolation between schools
3. All CRUD operations work properly with multi-tenancy

### 6. Deploy

When ready, deploy the updated application:

```bash
# Deploy the updated code
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **Duplicate Key Errors**
   - These may occur if documents have the same IDs across different school databases
   - The migration script attempts to handle this by using `skipDuplicates`
   - For persistent issues, you may need to manually resolve conflicts

2. **Missing SchoolId**
   - If users report access issues, check if their documents have the correct `schoolId`
   - You can run a repair script to update documents:
   ```javascript
   // Example: Update users without schoolId
   db.users.updateMany(
     { schoolId: { $exists: false } },
     { $set: { schoolId: /* default school ID */ } }
   )
   ```

3. **Permissions Issues**
   - The new system uses the `schoolId` for access control
   - Check authentication failures to ensure proper schoolId assignment

## Rollback Plan

If critical issues arise, you can rollback to the previous multi-database system:

1. Revert the code changes
2. Restore the individual databases from backup
3. Update the configuration to use the old multi-database approach

## Architecture Details

### Before Migration
- Multiple MongoDB databases (one per school)
- School-specific connections managed via `multiDbConnect.js`
- Email domains used to route to correct database

### After Migration
- Single MongoDB database
- `schoolId` field in all documents for multi-tenancy
- Query filtering to ensure data isolation
- Improved scalability and maintainability

### Key Files Modified
- Schema definitions in `models/`
- Authentication middleware in `middleware/authMiddleware.js`
- New middleware in `middleware/schoolIdMiddleware.js`
- Database connection in `config/db.js`
- All controllers to enforce `schoolId` filtering

## Support

If you encounter any issues during or after migration, please contact the development team for assistance.
