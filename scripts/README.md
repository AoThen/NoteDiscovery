# Scripts

This directory contains automation scripts for GoNote development and deployment.

## Available Scripts

### Release Scripts

| Script | Platform | Usage |
|--------|----------|-------|
| `release.sh` | Bash (Linux/macOS) | `./scripts/release.sh 0.24.0` |
| `release.ps1` | PowerShell (Windows) | `./scripts/release.ps1 -Version 0.24.0` |

Create a new release with version tagging and GitHub Actions trigger.

### Utility Scripts

| Script | Purpose |
|--------|---------|
| `generate_password.py` | Generate bcrypt password hash for authentication |

#### Password Hash Generator

Generate a secure password hash for GoNote authentication:

```bash
# Install dependencies first
pip install bcrypt

# Run the script
python scripts/generate_password.py
```

The script will:
1. Prompt you to enter a password (hidden input)
2. Ask for confirmation
3. Generate a bcrypt hash
4. Display the hash for use in `config.yaml`

**Example output:**
```
=== GoNote Password Hash Generator ===

Enter your password: 
Confirm your password: 

✅ Password hash generated successfully!

Add this to your config.yaml:

authentication:
  enabled: true
  password_hash: "$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Using Make

Alternatively, you can use Makefile commands:

```bash
make release-version VERSION=0.24.0   # Create release
```

## Script Permissions

Ensure scripts have execute permissions:

```bash
chmod +x scripts/release.sh
chmod +x scripts/generate_password.py
```

## Adding New Scripts

When adding new scripts:
1. Use descriptive names
2. Include usage instructions in comments
3. Make cross-platform when possible
4. Update this README
