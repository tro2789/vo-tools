# 🔒 Security Update - January 2026

## Important: Breaking Changes

This update fixes **5 critical and high severity security vulnerabilities**. Some changes require action before deployment.

## Quick Start

### 1. Update Environment Configuration

```bash
# Copy the new environment template
cp .env.example .env

# Generate a secure API key
openssl rand -hex 32

# Edit .env and configure:
# - API_KEY=<your-generated-key>
# - ALLOWED_ORIGINS=<your-frontend-urls>
```

### 2. Rebuild Containers

```bash
# Production
docker-compose build
docker-compose up -d

# Development
./dev.sh rebuild
```

### 3. Test Authentication

```bash
# Verify API key is required
curl -X POST http://localhost:5000/api/convert -F "file=@test.mp3"
# Expected: 401 Unauthorized

# Verify API key works
curl -X POST http://localhost:5000/api/convert \
  -H "X-API-Key: your-api-key" \
  -F "file=@test.mp3" \
  -F "format=ulaw"
# Expected: File download
```

## What Changed

### 🔴 Critical Fixes

1. **API Authentication** - All API endpoints now require API key authentication
2. **CORS Policy** - Wildcard (`*`) replaced with specific allowed origins

### 🟠 High Severity Fixes

3. **Non-Root Container** - Container now runs as `nextjs` user instead of root
4. **Production Server** - Removed unsafe development server flag
5. **TypeScript Safety** - Build errors are no longer ignored

### 🟡 Medium Severity Improvements

6. **Stronger Room Codes** - WebSocket room codes now use cryptographically secure random (8 chars)

## Required Actions

### For All Users

✅ **Set API Key**: Required in production, optional in development
```bash
API_KEY=your-secure-key-here
```

✅ **Configure CORS**: No more wildcard origins
```bash
ALLOWED_ORIGINS=http://localhost:3010  # or your domain
```

### For Production Deployments

✅ Generate strong API key: `openssl rand -hex 32`  
✅ Use HTTPS/TLS (deploy behind reverse proxy)  
✅ Set specific ALLOWED_ORIGINS for your domain(s)  
✅ Review [SECURITY.md](SECURITY.md) for complete checklist  

### For Development

✅ Update `ALLOWED_ORIGINS` to include your dev ports  
✅ Can use weak API key for development  
✅ Can disable auth with `AUTH_ENABLED=false` (not recommended)  

## New Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_KEY` | ✅ Yes* | - | API authentication key |
| `AUTH_ENABLED` | No | `true` | Enable/disable authentication |
| `ALLOWED_ORIGINS` | ✅ Yes | - | CORS allowed origins |

*Required when `AUTH_ENABLED=true` (default)

## Migration Guide

### From Older Versions

1. **Backup your current `.env`** (if you have one)

2. **Create new `.env` from template:**
   ```bash
   cp .env.example .env
   ```

3. **Configure required variables:**
   ```bash
   # Generate API key
   openssl rand -hex 32
   
   # Edit .env
   API_KEY=<paste-generated-key>
   ALLOWED_ORIGINS=http://localhost:3010  # adjust for your setup
   ```

4. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

5. **Verify everything works:**
   - Test file conversion
   - Test ACX compliance check
   - Test teleprompter remote control

## API Usage Changes

### Before (Insecure)
```javascript
fetch('http://localhost:5000/api/convert', {
  method: 'POST',
  body: formData
});
```

### After (Secure)
```javascript
fetch('http://localhost:5000/api/convert', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key'
  },
  body: formData
});
```

### Via Next.js Proxy (Recommended)
The Next.js frontend automatically handles authentication:
```javascript
// No changes needed - authentication handled automatically
fetch('/api/convert', {
  method: 'POST',
  body: formData
});
```

## Documentation

- **[SECURITY.md](SECURITY.md)** - Complete security guide and configuration
- **[SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md)** - Detailed changelog of fixes
- **[plans/vo-tools-security-analysis.md](plans/vo-tools-security-analysis.md)** - Full security audit report
- **[.env.example](.env.example)** - Environment configuration template

## Troubleshooting

### "API key required" Error
- Check `API_KEY` is set in environment
- Include `X-API-Key` header in API requests
- Or use Next.js proxy routes (`/api/convert` instead of direct Flask calls)

### "CORS policy" Error
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check for typos (http vs https, port numbers)
- Restart container after changing CORS config

### Container Won't Start
- Check file permissions on `/tmp/uploads`
- Rebuild: `docker-compose build`
- Check logs: `docker logs vo-tools`

See [SECURITY.md](SECURITY.md#troubleshooting) for more solutions.

## Verification Checklist

After updating, verify:

- [ ] Environment variables configured (API_KEY, ALLOWED_ORIGINS)
- [ ] Container builds without errors
- [ ] Container runs as non-root user
- [ ] API requires authentication
- [ ] CORS only allows configured origins
- [ ] File conversion works
- [ ] ACX compliance check works
- [ ] Teleprompter remote control works

## Support

For issues:
1. Review [SECURITY.md](SECURITY.md)
2. Check [SECURITY_FIXES_APPLIED.md](SECURITY_FIXES_APPLIED.md)
3. Review application logs: `docker logs vo-tools`

---

**Security Version:** 1.0.0  
**Update Date:** January 2, 2026  
**Status:** ✅ All Critical & High Severity Issues Fixed
