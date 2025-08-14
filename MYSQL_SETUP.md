# MySQL Setup Guide for Coffee Morning Challenge

## Step 1: Install MySQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

### macOS:
```bash
brew install mysql
brew services start mysql
```

### Windows:
Download MySQL from https://dev.mysql.com/downloads/mysql/

## Step 2: Connect to MySQL

```bash
mysql -u root -p
```

## Step 3: Run the Setup Script

```bash
mysql -u root -p < setup-mysql.sql
```

Or manually copy and paste the contents of `setup-mysql.sql` into your MySQL client.

## Step 4: Test Connection

```bash
mysql -u coffee_user -p admin_coffee
# Password: coffee_password_2024
```

## Step 5: Update Environment Variables

The server/.env file has been configured with:
- Database: admin_coffee
- User: coffee_user  
- Password: coffee_password_2024

## Step 6: Start the Server

```bash
npm run server
```

## Troubleshooting

### Connection Issues:
1. Make sure MySQL is running: `sudo systemctl status mysql`
2. Check if port 3306 is open: `netstat -tlnp | grep 3306`
3. Verify user permissions: `SHOW GRANTS FOR 'coffee_user'@'localhost';`

### Authentication Issues:
If you get "Access denied" errors, try:
```sql
ALTER USER 'coffee_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'coffee_password_2024';
FLUSH PRIVILEGES;
```

### Default Login:
- Admin Email: admin@yspi.ie
- Admin Password: admin123

## Security Notes

**For Production:**
1. Change the default passwords
2. Use environment variables for sensitive data
3. Enable SSL/TLS connections
4. Restrict database user permissions
5. Use a strong JWT secret