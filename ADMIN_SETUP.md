# Admin User Setup for Self-Hosting Deployment

This guide helps you create admin credentials for your MyBookStore self-hosted deployment.

## Method 1: Using the Admin Creation Script (Recommended)

After deploying your application, run the admin creation script:

```bash
# Navigate to your application directory
cd /path/to/your/mybookstore

# Run the admin creation script
node scripts/create-admin.js
```

The script will prompt you for:
- Admin username
- Admin email 
- Admin password

Once created, you can log in with these credentials and access the admin panel at `your-domain.com/admin`.

## Method 2: Using npm script

```bash
npm run create-admin
```

## Method 3: Manual Database Entry (Advanced)

If you need to create an admin user directly in the database:

```sql
-- Connect to your PostgreSQL database
-- Replace values with your desired credentials

INSERT INTO users (id, username, email, password, role, credits, is_active, email_verified, created_at, updated_at, credits_reset_date)
VALUES (
  gen_random_uuid(),
  'superadmin',  -- Your admin username
  'admin@yourdomain.com',  -- Your admin email
  '$2a$12$hashedpasswordhere',  -- Use bcrypt to hash your password
  'admin',
  999,
  true,
  true,
  NOW(),
  NOW(),
  NOW()
);
```

**Note**: For Method 3, you'll need to hash the password using bcrypt with 12 rounds.

## Admin Panel Features

Once logged in as admin, you can:

- **User Management**: Create, edit, and delete users
- **Role Assignment**: Set user roles (Free, Subscribed, Admin)
- **Credit Management**: Allocate credits to users
- **Account Status**: Activate/deactivate user accounts
- **AI Configuration**: Manage AI prompts and system settings

## Default Admin Credentials (Development Only)

For development/testing purposes, you can use:
- **Username**: `superadmin@mybookstore.app`
- **Password**: Use the password you set when running the creation script

## Security Notes

- Change default credentials immediately after deployment
- Use strong passwords for admin accounts
- Consider enabling email verification for production
- Regularly audit admin user access
- Monitor admin activity logs

## Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` environment variable is set correctly
- Verify PostgreSQL service is running
- Check network connectivity to your database

### Script Execution Issues
```bash
# Make sure you're in the correct directory
ls scripts/create-admin.js

# Check Node.js version (requires Node 16+)
node --version

# Run with explicit path
node ./scripts/create-admin.js
```

### Cannot Access Admin Panel
- Verify user role is set to 'admin' in database
- Clear browser cache and cookies
- Check server logs for authentication errors
- Ensure you're accessing the correct URL: `your-domain.com/admin`

For additional support, check the application logs and database records to troubleshoot specific issues.