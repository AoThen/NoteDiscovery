#!/bin/bash

# GoNote Release Script
# Usage: ./scripts/release.sh <version> [--skip-commit]
# Example: ./scripts/release.sh 0.4.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_COMMIT=false
VERSION=""

for arg in "$@"; do
    case $arg in
        --skip-commit)
            SKIP_COMMIT=true
            shift
            ;;
        *)
            if [ -z "$VERSION" ]; then
                VERSION="$arg"
            fi
            ;;
    esac
done

# Validate version format (semantic versioning)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Version must be in format X.Y.Z (e.g., 0.4.0)${NC}"
    exit 1
fi

# Check if we're on the main branch
currentBranch=$(git rev-parse --abbrev-ref HEAD)
if [ "$currentBranch" != "main" ] && [ "$currentBranch" != "master" ]; then
    echo -e "${RED}Error: Releases can only be created from the main branch.${NC}"
    echo -e "${YELLOW}Current branch: $currentBranch${NC}"
    echo -e "${YELLOW}Please switch to main branch first: git checkout main${NC}"
    exit 1
fi

echo -e "${GREEN}Releasing version $VERSION from branch: $currentBranch${NC}"

# Pull latest changes from remote
echo -e "${YELLOW}Pulling latest changes from origin/$currentBranch...${NC}"
if ! git pull origin "$currentBranch"; then
    echo -e "${RED}Error: Failed to pull latest changes from remote.${NC}"
    echo -e "${YELLOW}Please resolve the issue and try again.${NC}"
    exit 1
fi

# Read current version and validate it's higher
if [ -f "VERSION" ]; then
    currentVersion=$(cat VERSION | tr -d '[:space:]')
    
    if [[ "$currentVersion" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # Parse versions into components
        IFS='.' read -r currentMajor currentMinor currentPatch <<< "$currentVersion"
        IFS='.' read -r newMajor newMinor newPatch <<< "$VERSION"
        
        # Compare versions
        isHigher=false
        if [ "$newMajor" -gt "$currentMajor" ]; then
            isHigher=true
        elif [ "$newMajor" -eq "$currentMajor" ]; then
            if [ "$newMinor" -gt "$currentMinor" ]; then
                isHigher=true
            elif [ "$newMinor" -eq "$currentMinor" ]; then
                if [ "$newPatch" -gt "$currentPatch" ]; then
                    isHigher=true
                fi
            fi
        fi
        
        if [ "$isHigher" = false ]; then
            echo -e "${RED}Error: New version must be higher than current version.${NC}"
            echo -e "${YELLOW}Current version: $currentVersion${NC}"
            echo -e "${YELLOW}New version: $VERSION${NC}"
            echo -e "${YELLOW}Version comparison:${NC}"
            echo -e "${YELLOW}  Major: $newMajor vs $currentMajor${NC}"
            echo -e "${YELLOW}  Minor: $newMinor vs $currentMinor${NC}"
            echo -e "${YELLOW}  Patch: $newPatch vs $currentPatch${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}Version check passed: $currentVersion -> $VERSION${NC}"
    else
        echo -e "${RED}Error: Current VERSION file has invalid format. Must be in X.Y.Z format (e.g., 0.4.0)${NC}"
        echo -e "${YELLOW}Current VERSION file contains: '$currentVersion'${NC}"
        echo -e "${YELLOW}Please fix the VERSION file before creating a release.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No existing VERSION file found. Creating new one...${NC}"
fi

# Check if working directory is clean (unless skipping commit)
if [ "$SKIP_COMMIT" = false ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}Warning: Working directory has uncommitted changes:${NC}"
        git status --porcelain
        read -p "Continue anyway? (y/N): " response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo -e "${RED}Aborted.${NC}"
            exit 1
        fi
    fi
fi

# Update VERSION file (single source of truth)
echo -e "${YELLOW}Updating VERSION file...${NC}"
echo -n "$VERSION" > VERSION

# Commit changes (unless skipped)
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "${YELLOW}Committing version changes...${NC}"
    git add VERSION
    git commit -m "Updated version to $VERSION"
    
    # Push commits first
    # NOTE: This will trigger GitHub's built-in 'pages-build-deployment' workflow
    # if you have GitHub Pages configured and changes were made to docs/ folder
    echo -e "${YELLOW}Pushing commits...${NC}"
    git push
fi

# Create git tag
echo -e "${YELLOW}Creating git tag v$VERSION...${NC}"
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push tag to remote
echo -e "${YELLOW}Pushing tag to remote...${NC}"
git push origin "v$VERSION"

echo -e "\n${GREEN}Release $VERSION completed successfully!${NC}"
echo -e "${CYAN}Tag: v$VERSION${NC}"

# Open GitHub Actions page to monitor build status
echo -e "\n${YELLOW}Opening GitHub Actions to monitor build status...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open "https://github.com/gamosoft/GoNote/actions"
elif command -v open &> /dev/null; then
    open "https://github.com/gamosoft/GoNote/actions"
else
    echo -e "${CYAN}Please visit: https://github.com/gamosoft/GoNote/actions${NC}"
fi
