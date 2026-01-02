# Production Deployment Checklist

**Target:** VPS with reverse proxy → Docker container
**Domain:** voiceover-tools.com / www.voiceover-tools.com

---

## ✅ Repository Security Status

**VERIFIED CLEAN - Safe to Deploy**

- ✅ No hardcoded secrets or API keys in code
- ✅ `.env` file is gitignored (won't be committed)
- ✅ Only `.env.example` is in repo (sanitized template)
- ✅ No passwords or tokens in source files
- ✅ All sensitive config uses environment variables

---

## 🚀 Pre-Deployment Steps

### 1. On Your VPS

```bash
# Clone/pull the repository
git clone <your-repo-url> /opt/voiceover-tools
cd /opt/voiceover-tools/vo-tools

# Create production .env file
cp .env.example .env

# Generate secure API key
openssl rand -hex 32
# Output: e.g., a1b2c3d4e5f6...

# Edit .env with production values
nano .env
```

### 2. Configure Production Environment

**Required Changes in `.env`:**

```bash
# CRITICAL: Set strong API key
API_KEY=<paste-your-generated-key-here>

# CRITICAL: Set production domains (HTTPS only)
ALLOWED_ORIGINS=https://voiceover-tools.com,https://www.voiceover-tools.com

# Ensure authentication is enabled
AUTH_ENABLED=true

# Production settings
NODE_ENV=production
FLASK_DEBUG=false
LOG_LEVEL=INFO

# Rate limiting (adjust based on expected traffic)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
WS_RATE_LIMIT_PER_MINUTE=30
```

### 3. Docker Compose Production Config

**Verify [`docker-compose.yml`](docker-compose.yml) has:**

```yaml
environment:
  - ALLOWED_ORIGINS=https://voiceover-tools.com,https://www.voiceover-tools.com,http://localhost:3010
  - API_KEY=${API_KEY:-}  # Will read from .env
```

**✅ Already configured correctly**

---

## 🔒 Reverse Proxy Configuration

### Nginx Configuration (Recommended)

Create `/etc/nginx/sites-available/voiceover-tools`:

```nginx
# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name voiceover-tools.com www.voiceover-tools.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Main Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name voiceover-tools.com www.voiceover-tools.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/voiceover-tools.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voiceover-tools.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/voiceover-tools.com/chain.pem;
    
    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers (app.py also sets these)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Max upload size (match or exceed app config)
    client_max_body_size 50M;
    
    # Proxy timeouts (for long audio conversions)
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    
    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3010;
    }
    
    # Flask API (if accessed directly)
    location /api/ {
        proxy_pass http://localhost:5000;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

**Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/voiceover-tools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d voiceover-tools.com -d www.voiceover-tools.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## 🐳 Deployment Commands

### First Time Deployment

```bash
cd /opt/voiceover-tools/vo-tools

# Build and start production container
docker-compose build
docker-compose up -d

# Verify it's running
docker-compose ps
docker logs vo-tools

# Test health endpoint
curl http://localhost:3010/health
# Should return: {"status":"healthy","service":"audio-converter","version":"1.0.0"}
```

### Future Updates

```bash
cd /opt/voiceover-tools/vo-tools

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker logs vo-tools --tail 50
```

---

## ✅ Production Security Checklist

### Critical (Must Do)

- [ ] Generated strong API key with `openssl rand -hex 32`
- [ ] Set `API_KEY` in `.env` file on VPS
- [ ] Set `ALLOWED_ORIGINS` to HTTPS production domains only
- [ ] Verified `.env` is NOT committed to git (it's in .gitignore)
- [ ] SSL/TLS certificate installed and working
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Reverse proxy configured with proper timeouts
- [ ] WebSocket support enabled in proxy
- [ ] `AUTH_ENABLED=true` in production
- [ ] `FLASK_DEBUG=false` in production
- [ ] `LOG_LEVEL=INFO` (not DEBUG)

### Recommended

- [ ] Rate limiting enabled
- [ ] Set up log rotation for Docker logs
- [ ] Configure firewall (UFW):
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- [ ] Set up monitoring (uptime checks)
- [ ] Configure automatic backups
- [ ] Set up Docker restart policy (already in docker-compose.yml)
- [ ] Test all features work through HTTPS

### Nice to Have

- [ ] Set up log aggregation (e.g., Logtail, Papertrail)
- [ ] Configure alerts for container crashes
- [ ] Set up automated security updates
- [ ] Configure CDN (Cloudflare) for DDoS protection
- [ ] Set up database backups (if using one in future)

---

## 🧪 Post-Deployment Testing

### 1. Basic Functionality

```bash
# Health check
curl https://voiceover-tools.com/health

# Test authentication (should fail without key)
curl -X POST https://voiceover-tools.com/api/convert \
  -F "file=@test.mp3"
# Expected: 401 Unauthorized

# Test with API key (from another service, not browser)
curl -X POST https://voiceover-tools.com/api/convert \
  -H "X-API-Key: your-production-api-key" \
  -F "file=@test.mp3" \
  -F "format=ulaw"
```

### 2. HTTPS/SSL

```bash
# Check SSL grade
https://www.ssllabs.com/ssltest/analyze.html?d=voiceover-tools.com

# Verify HTTPS redirect
curl -I http://voiceover-tools.com
# Should show: 301 redirect to https://
```

### 3. Security Headers

```bash
curl -I https://voiceover-tools.com | grep -E "X-Frame|X-Content|Strict-Transport"
# Should show security headers
```

### 4. WebSocket (Teleprompter Remote)

- Open teleprompter on desktop
- Try connecting from phone
- Verify remote control works

---

## 🔐 API Key Management

### For Your Own Use

If you're the only user, keep your API key in a password manager and use it in your applications.

### For Multiple Users/Clients

Consider implementing per-user API keys:

```python
# Future enhancement: Multiple API keys
VALID_API_KEYS = {
    os.getenv('API_KEY_ADMIN'): 'admin',
    os.getenv('API_KEY_CLIENT1'): 'client1',
    # etc.
}
```

---

## 📊 Monitoring Recommendations

### Docker Health Checks

Already configured in app (`/health` endpoint). Monitor this endpoint:

```bash
# Simple uptime monitor
watch -n 60 'curl -s https://voiceover-tools.com/health | jq'
```

### Log Monitoring

```bash
# Watch logs in real-time
docker logs -f vo-tools

# Check for errors
docker logs vo-tools 2>&1 | grep -i error

# Monitor authentication failures
docker logs vo-tools 2>&1 | grep "API key"
```

### Resource Usage

```bash
# Container stats
docker stats vo-tools

# Disk usage
docker system df

# Clean up old images
docker system prune
```

---

## 🚨 Security Incident Response

### If API Key Compromised

1. **Immediately rotate:**
   ```bash
   cd /opt/voiceover-tools/vo-tools
   
   # Generate new key
   NEW_KEY=$(openssl rand -hex 32)
   
   # Update .env
   sed -i "s/API_KEY=.*/API_KEY=$NEW_KEY/" .env
   
   # Restart container
   docker-compose restart
   ```

2. **Check logs for abuse:**
   ```bash
   docker logs vo-tools --since 24h | grep "API key"
   ```

3. **Update all clients with new key**

### If Container Compromised

1. Stop container immediately
2. Preserve logs for analysis
3. Rebuild from scratch
4. Rotate all secrets
5. Review access logs

---

## 📝 Environment Variables Reference

**Production `.env` template:**

```bash
# ===== SECURITY (REQUIRED) =====
API_KEY=<your-64-char-hex-key>
AUTH_ENABLED=true
ALLOWED_ORIGINS=https://voiceover-tools.com,https://www.voiceover-tools.com

# ===== FLASK SETTINGS =====
FLASK_API_URL=http://localhost:5000
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=false
LOG_LEVEL=INFO

# ===== FILE HANDLING =====
MAX_CONTENT_LENGTH=52428800
UPLOAD_FOLDER=/tmp/uploads
ALLOWED_EXTENSIONS=wav,mp3,ogg,flac,m4a,aiff,wma,aac
FFMPEG_TIMEOUT=60

# ===== RATE LIMITING =====
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
WS_RATE_LIMIT_PER_MINUTE=30

# ===== NEXT.JS =====
NODE_ENV=production
NEXT_PUBLIC_API_URL=
CORS_MAX_AGE=3600
```

---

## 🎯 Quick Deployment Summary

```bash
# 1. On VPS: Clone and configure
git clone <repo> /opt/voiceover-tools
cd /opt/voiceover-tools/vo-tools
cp .env.example .env
nano .env  # Set API_KEY and ALLOWED_ORIGINS

# 2. Set up SSL
sudo certbot --nginx -d voiceover-tools.com -d www.voiceover-tools.com

# 3. Deploy container
docker-compose build
docker-compose up -d

# 4. Verify
curl https://voiceover-tools.com/health
docker logs vo-tools
```

---

**Status:** ✅ Repository is production-ready and secure
**Last Updated:** 2026-01-02
**Security Version:** 2.0.0 (All Critical/High/Medium issues resolved)
