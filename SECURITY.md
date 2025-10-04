# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our project seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do Not** Open a Public Issue

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send details to the repository owner via:
- GitHub Security Advisory (preferred)
- Direct message to maintainers
- Email (if contact information is available)

### 3. Include in Your Report

Please include:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)
- Your contact information

### 4. Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## Security Best Practices

When contributing or deploying:

### For Contributors:

1. **Never commit sensitive data:**
   - API keys
   - Passwords
   - Private keys
   - Tokens
   - Database credentials

2. **Always use environment variables:**
   ```bash
   # ✅ GOOD
   const apiKey = process.env.API_KEY;
   
   # ❌ BAD
   const apiKey = 'sk_live_abc123';
   ```

3. **Check before committing:**
   ```bash
   # Verify no secrets in files
   git diff --cached
   
   # Check .gitignore includes:
   .env
   .env.local
   .env.*.local
   ```

4. **Run security checks:**
   ```bash
   npm audit
   npm audit fix
   ```

### For Deployers:

1. **Secure environment variables:**
   - Use Vercel/platform environment variables
   - Never hardcode in source
   - Rotate periodically
   - Use different values for dev/staging/prod

2. **Enable security headers:**
   - Already configured in `next.config.js`
   - Verify after deployment

3. **Keep dependencies updated:**
   ```bash
   npm update
   npm audit fix
   ```

4. **Monitor access logs:**
   - Check Vercel/platform logs
   - Watch for suspicious activity
   - Set up alerts

## What We Do

### Security Measures:

- ✅ All secrets stored in environment variables
- ✅ Security headers configured
- ✅ HTTPS enforced
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting (platform-level)
- ✅ Regular dependency updates
- ✅ Security audits before releases

### Automated Security:

- GitHub Dependabot for dependency updates
- npm audit in CI/CD pipeline
- Vercel security features enabled
- Supabase Row Level Security

## Disclosure Policy

When we receive a security bug report:

1. We confirm the problem and determine affected versions
2. We audit code to find similar problems
3. We prepare fixes for all supported versions
4. We release new versions and announce publicly

## Comments on this Policy

If you have suggestions on improving this security policy, please submit a pull request or open an issue.

---

**Last Updated:** January 2025
