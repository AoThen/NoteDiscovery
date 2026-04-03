# Security Contact

## Reporting a Vulnerability

We take the security of GoNote seriously. If you believe you have found a security vulnerability, please report it to us as described below.

## How to Report

### Preferred Method: GitHub Security Advisories

Report security issues directly through GitHub's security advisory system:

1. Go to the [Security tab](https://github.com/gamosoft/gonote/security)
2. Click "Report a vulnerability"
3. Provide a detailed description of the vulnerability
4. Include steps to reproduce if possible

### Alternative: Email

For sensitive issues that cannot be reported through GitHub, email:

**security@nodediscovery.com** (placeholder - update with actual contact)

## What to Include

When reporting a vulnerability, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Affected versions** (if known)
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up questions

## Response Time

We aim to respond to security reports within:

- **Initial acknowledgment**: 48 hours
- **Status update**: 7 days
- **Resolution or mitigation**: 30 days (depending on severity)

## Security Policy

### Supported Versions

| Version | Supported |
|---------|-----------|
| 0.23.x  | ✅ Yes    |
| 0.3.x  | ⚠️ Limited |
| < 0.3  | ❌ No     |

### What We Consider Security Issues

- Authentication bypass
- Unauthorized access to notes
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- SQL injection (if applicable)
- Path traversal vulnerabilities
- Remote code execution
- Denial of service (DoS)

### What We Don't Consider Security Issues

- Missing best practices (unless they lead to exploitation)
- Presence of known vulnerable libraries without proof of exploitation
- Issues requiring physical access to the server
- Issues requiring social engineering
- Missing security headers (unless they lead to exploitation)

## Disclosure Policy

We follow a coordinated disclosure process:

1. **Report received** - We acknowledge your report
2. **Assessment** - We evaluate the vulnerability
3. **Fix development** - We work on a patch
4. **Testing** - We test the fix thoroughly
5. **Release** - We publish a security advisory and release
6. **Disclosure** - Details are made public after users have had time to update

We request that you:

- **Do not disclose** the vulnerability publicly before we release a fix
- **Allow reasonable time** for us to develop and test a fix
- **Coordinate with us** on the timing of public disclosure

## Security Measures

GoNote includes several security features:

- **CSRF Protection** - Double Submit Cookie pattern
- **Session Security** - SameSite cookies, secure flags
- **Rate Limiting** - Configurable per-endpoint limits
- **Path Validation** - Directory traversal prevention
- **Error Sanitization** - Production mode hides sensitive information
- **Input Validation** - All user input is validated
- **Password Hashing** - bcrypt for password storage

## Security Best Practices for Users

To keep your GoNote instance secure:

1. **Change default password** immediately
2. **Generate a random secret key** for sessions
3. **Enable authentication** if exposed to a network
4. **Use HTTPS** in production
5. **Keep updated** with the latest version
6. **Run behind a reverse proxy** with additional security
7. **Regular backups** of your data
8. **Review logs** for suspicious activity

See [SECURITY.md](project-docs/security/SECURITY.md) for complete security guide.

## Bug Bounty

Currently, we do not offer a bug bounty program. However:

- We **publicly acknowledge** security researchers (with permission)
- We add contributors to our **Hall of Fame**
- We welcome **pull requests** for fixes

## Previous Security Advisories

| Date | Version | Issue | Severity |
|------|---------|-------|----------|
| - | - | - | - |

*No security advisories published yet*

## Contact

For general security questions:

- **Email**: security@nodediscovery.com (placeholder)
- **GitHub**: https://github.com/gamosoft/gonote/discussions

---

**Thank you for helping keep GoNote secure!**
