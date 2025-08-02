# Heroku ACM Status Refresh Commands

## Check Current ACM Status

```bash
# View all certificates and their status
heroku certs

# Check automatic certificate status specifically
heroku certs:auto

# Get detailed certificate information
heroku certs:info
```

## Refresh ACM Certificate Status

### Method 1: Disable and Re-enable Auto SSL
```bash
# Disable automatic SSL
heroku certs:auto:disable

# Wait 30 seconds, then re-enable
heroku certs:auto:enable

# Check status after re-enabling
heroku certs:auto
```

### Method 2: Force Certificate Refresh
```bash
# Remove existing certificate (if any issues)
heroku certs:remove

# Re-enable automatic SSL
heroku certs:auto:enable

# Monitor the provisioning process
heroku certs:auto --wait
```

### Method 3: Domain-Specific Refresh
```bash
# If using custom domains, refresh domain status
heroku domains

# Remove and re-add domain to trigger certificate refresh
heroku domains:remove yourdomain.com
heroku domains:add yourdomain.com

# Enable SSL for the re-added domain
heroku certs:auto:enable
```

## Monitor Certificate Provisioning

```bash
# Watch certificate status in real-time
watch heroku certs:auto

# Check DNS propagation (if using custom domain)
dig yourdomain.com

# Test SSL endpoint
curl -I https://beetagged-app-53414697acd3.herokuapp.com/health
```

## Common ACM Status Messages

- **`pending`**: Certificate is being provisioned (can take 24-48 hours)
- **`issued`**: Certificate is active and working
- **`failed`**: Provisioning failed, usually due to DNS issues
- **`disabled`**: Auto SSL is turned off

## Troubleshooting Failed ACM Status

### If Status Shows "Failed":
```bash
# Check domain configuration
heroku domains

# Verify DNS settings
nslookup beetagged-app-53414697acd3.herokuapp.com

# Reset the certificate process
heroku certs:auto:disable
sleep 30
heroku certs:auto:enable
```

### Force DNS Refresh:
```bash
# Clear DNS cache and retry
heroku domains:clear-cache

# Refresh ACM after DNS cache clear
heroku certs:auto:refresh
```

## Expected Timeline

- **Initial provisioning**: 5-15 minutes for Heroku apps
- **DNS propagation**: Up to 24-48 hours for custom domains
- **Certificate activation**: Usually within 1 hour after DNS resolves

Your ACM status should refresh and show the current certificate state.