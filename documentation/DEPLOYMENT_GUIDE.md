# Step-by-Step GitHub Deployment Commands

## 1. Initialize and Prepare Repository

```powershell
# Navigate to your project directory
cd "c:\Users\zakar\OneDrive\Documents\Desktop\random school"

# Initialize git repository (if not already done)
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Complete tutoring school management system"

# Add GitHub remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/banat-hawaa-school.git

# Push to GitHub
git push -u origin main
```

## 2. If you get an error about 'main' branch, try:

```powershell
git branch -M main
git push -u origin main
```

## 3. Verify Upload

- Go to your GitHub repository
- Verify all files are uploaded
- Check that .env is NOT uploaded (it should be in .gitignore)
