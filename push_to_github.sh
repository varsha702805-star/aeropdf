#!/bin/bash
echo "===================================================="
echo "      AeroPDF - GitHub Publishing Assistant         "
echo "===================================================="
echo ""
echo "First: Make sure you have created a public repository"
echo "named exactly 'aeropdf' at https://github.com/new"
echo ""

# Ask for the GitHub username
read -p "Enter your GitHub username: " username

if [ -z "$username" ]; then
    echo "Error: Username cannot be empty. Script aborted."
    exit 1
fi

# Clean up any existing remote linkage and establish new link
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$username/aeropdf.git"

echo ""
echo "Connecting to GitHub and uploading your files..."
echo "Note: When prompted, enter your GitHub Username and Password"
echo "(or Personal Access Token) to securely authenticate."
echo "----------------------------------------------------"

# Push the code up to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo "----------------------------------------------------"
    echo "🎉 Success! Your code is now live on GitHub."
    echo "You can now connect it to Vercel or Netlify for free!"
    echo "===================================================="
else
    echo "----------------------------------------------------"
    echo "⚠️ Push failed."
    echo "Ensure your username is correct, you created the repository"
    echo "'aeropdf' on GitHub, and your credentials are correct."
    echo "===================================================="
fi
