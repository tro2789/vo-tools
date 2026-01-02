# Security Guide

This document explains the security features implemented in VO Tools and how to configure them properly.

## Security Improvements

The following critical security issues have been fixed:

### ✅ 1. API Key Authentication (CRITICAL)
All API endpoints now require authentication using API keys.

**Configuration:**
```bash
# Generate a secure API key
openssl rand -hex 32

# Set in your environment or .env file
API_KEY=your-generated-key-here
```

**Usage:**
- The Next.js frontend automatically includes the API key when proxying to Flask
- External API clients must include the key in the `X-API-Key` header

**Development Mode:**
You can disable authentication for local development (NOT RECOMMENDED):
```bash
AUTH_ENABLED=false
```

### ✅ 2. Restricted CORS Policy (CRITICAL)
CORS is now restricted to specific allowed origins instead of wildcard (`*`).

**Configuration:**
```bash
# Production - use your actual domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Development
ALLOWED_ORIGINS=http://localhost:3011,http://localhost:3000
```

### ✅ 3. Non-Root Container (HIGH)
The Docker container now runs as the `nextjs` user instead of root.

**What Changed:**
- Supervisor runs as `nextjs` user
- Both Next.js and Flask processes run with reduced privileges
- Upload directory (`/tmp/uploads`) owned by `nextjs` user

**Impact:**
- Better security isolation
- Reduced risk if container is compromised

### ✅ 4. Removed Unsafe Werkzeug Mode (HIGH)
The `allow_unsafe_werkzeug=True` flag has been removed.

**What Changed:**
- Development server warnings are now respected
- Production uses Gunicorn (already configured in Dockerfile)
- `__main__` block only for local development

### ✅ 5. TypeScript Type Safety (HIGH)
TypeScript build errors are no longer ignored.

**What Changed:**
- Removed `ignoreBuildErrors: true` from `next.config.mjs`
- All type errors must be fixed before building
- Better code quality and safety

### ✅ 6. Stronger WebSocket Room Codes (MEDIUM)
Room codes for teleprompter remote control are now more secure.

**What Changed:**
- 8 characters instead of 6
- Uses `secrets` module instead of `random`
- Cryptographically secure random generation
- Better protection against brute force

## Configuration

### Required Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

**Minimum Required Configuration:**

```bash
# REQUIRED: Generate a secure API key
API_KEY=your-secure-random-key-here

# REQUIRED: Set allowed CORS origins (no wildcards!)
ALLOWED_ORIGINS=http://localhost:3010

# Optional but recommended
AUTH_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Production Configuration

For production deployment:

1. **Generate Secure API Key:**
```bash
openssl rand -hex 32
```

2. **Configure Environment:**
```bash
# Security
API_KEY=<your-generated-key>
AUTH_ENABLED=true
ALLOWED_ORIGINS=https://yourdomain.com

# Flask
FLASK_DEBUG=false
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
```

3. **Use HTTPS:**
Deploy behind a reverse proxy (nginx, Caddy) with TLS/SSL certificates.

### Development Configuration

For local development:

```bash
# Security (use weak key for dev only)
API_KEY=dev-api-key-change-in-production
AUTH_ENABLED=true  # Keep enabled to test auth flow
ALLOWED_ORIGINS=http://localhost:3011,http://localhost:3000

# Flask
FLASK_DEBUG=true
LOG_LEVEL=DEBUG

# Rate Limiting (more permissive for dev)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_PER_HOUR=500
```

## Deployment

### Building the Container

```bash
# Production
docker-compose build
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

### Using the Dev Script

The `dev.sh` script makes it easier:

```bash
# Start development environment
./dev.sh start

# View logs
./dev.sh logs

# Rebuild after changes
./dev.sh rebuild

# Deploy to production (merges dev to main)
./dev.sh deploy
```

## API Usage

### Authentication

All API requests must include the API key:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/convert \
  -H "X-API-Key: your-api-key" \
  -F "file=@audio.mp3" \
  -F "format=ulaw"
```

**Using JavaScript/fetch:**
```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('format', 'ulaw');

fetch('http://localhost:5000/api/convert', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key'
  },
  body: formData
});
```

**Via Next.js Proxy (Recommended):**
The Next.js frontend automatically handles authentication when you use the proxy routes:
- `/api/convert` → proxies to Flask with API key
- `/api/acx-check` → proxies to Flask with API key

### Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/health` | GET | ❌ No | Health check |
| `/api/convert` | POST | ✅ Yes | Audio conversion |
| `/api/audio/acx-check` | POST | ✅ Yes | ACX compliance check |
| WebSocket | - | ❌ No* | Teleprompter remote |

*WebSocket connections are currently unauthenticated. Consider adding room passwords for sensitive use.

## Security Best Practices

### ✅ DO

- **Use strong API keys** - Generate with `openssl rand -hex 32`
- **Enable authentication** - Always set `AUTH_ENABLED=true` in production
- **Use specific CORS origins** - Never use `*` in production
- **Use HTTPS** - Deploy behind a reverse proxy with TLS
- **Keep dependencies updated** - Run `npm audit` and `pip check` regularly
- **Monitor logs** - Watch for authentication failures and suspicious activity
- **Backup environment variables** - Store securely (e.g., password manager, secrets manager)

### ❌ DON'T

- **Don't use weak API keys** - No "password123" or predictable keys
- **Don't disable auth in production** - `AUTH_ENABLED=false` is only for local dev
- **Don't use wildcard CORS** - `ALLOWED_ORIGINS=*` defeats same-origin policy
- **Don't run as root** - Container now runs as `nextjs` user
- **Don't expose Flask directly** - Use the Next.js proxy or a reverse proxy
- **Don't commit secrets** - Keep `.env` out of git (already in `.gitignore`)
- **Don't share API keys** - Each deployment should have unique keys

## Security Checklist

Before deploying to production:

- [ ] Generated strong API key using `openssl rand -hex 32`
- [ ] Set `API_KEY` environment variable
- [ ] Set `AUTH_ENABLED=true`
- [ ] Configured specific `ALLOWED_ORIGINS` (no wildcards)
- [ ] Enabled HTTPS/TLS with valid certificates
- [ ] Set `FLASK_DEBUG=false`
- [ ] Enabled rate limiting (`RATE_LIMIT_ENABLED=true`)
- [ ] Reviewed and adjusted rate limits for your use case
- [ ] Container runs as non-root user (default in new Dockerfile)
- [ ] Configured log aggregation and monitoring
- [ ] Set up automated backups of configuration
- [ ] Tested authentication is working correctly
- [ ] Tested CORS policy blocks unauthorized origins

## Troubleshooting

### "API key required" Error

**Problem:** Getting 401 error when calling API.

**Solutions:**
1. Check `API_KEY` is set in environment
2. Verify `AUTH_ENABLED=true` in environment
3. Include `X-API-Key` header in requests
4. Check logs: `docker logs vo-tools` or `./dev.sh logs`

### "CORS policy" Error

**Problem:** Browser blocks requests with CORS error.

**Solutions:**
1. Check `ALLOWED_ORIGINS` includes your frontend URL
2. Ensure no typos in origin URLs (http vs https, ports, etc.)
3. Add comma-separated origins if needed
4. Restart container after changing CORS config

### Container Permission Errors

**Problem:** Container fails to start or can't write files.

**Solutions:**
1. Rebuild container: `docker-compose build`
2. Check `/tmp/uploads` permissions: `docker exec vo-tools ls -la /tmp/uploads`
3. Verify Dockerfile creates directory with correct ownership

### TypeScript Build Errors

**Problem:** Build fails with TypeScript errors.

**Solutions:**
1. Fix the type errors in your code
2. Run `npm run build` locally to see errors
3. Don't re-enable `ignoreBuildErrors` - fix the issues instead

## Additional Resources

- [Security Analysis Report](plans/vo-tools-security-analysis.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Flask Security Considerations](https://flask.palletsprojects.com/en/latest/security/)

## Support

If you encounter security issues or have questions:

1. Review the [Security Analysis Report](plans/vo-tools-security-analysis.md)
2. Check this guide's troubleshooting section
3. Review application logs
4. For vulnerabilities, report privately (not in public issues)

---

**Last Updated:** 2026-01-02  
**Security Version:** 1.0.0
