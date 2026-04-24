<<<<<<< HEAD
# Pragneysh — Portfolio (React + Vite)

## 🚀 Quick Start (Local)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # builds to /dist
npm run preview    # preview production build locally
```

---

## ☁️ Deploy to AWS S3 (Static Hosting)

### Step 1 — Build
```bash
npm install
npm run build
# dist/ folder is your deployable artifact
```

### Step 2 — Create S3 Bucket
```bash
aws s3 mb s3://pragneysh-portfolio --region ap-south-1
```

### Step 3 — Enable Static Website Hosting
```bash
aws s3 website s3://pragneysh-portfolio \
  --index-document index.html \
  --error-document index.html
```

### Step 4 — Set Bucket Policy (Public Read)
Create `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::pragneysh-portfolio/*"
  }]
}
```
```bash
aws s3api put-bucket-policy \
  --bucket pragneysh-portfolio \
  --policy file://bucket-policy.json
```

### Step 5 — Upload dist/
```bash
aws s3 sync dist/ s3://pragneysh-portfolio --delete
```

Your site is live at:
`http://pragneysh-portfolio.s3-website.ap-south-1.amazonaws.com`

---

## ⚡ Add CloudFront CDN (Recommended)

```bash
# Create distribution (replace BUCKET_DOMAIN with your S3 website endpoint)
aws cloudfront create-distribution \
  --origin-domain-name pragneysh-portfolio.s3-website.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

Note: For proper React SPA routing with CloudFront, add a custom error page:
- Error code: 403 & 404 → Response page: /index.html → Response code: 200

---

## 🔄 Re-deploy (After Changes)

```bash
npm run build
aws s3 sync dist/ s3://pragneysh-portfolio --delete

# If using CloudFront — invalidate cache:
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## 📁 Project Structure

```
portfolio/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css          ← global styles & CSS variables
    ├── data.js            ← all your content (edit this!)
    └── components/
        ├── Navbar.jsx / .css
        ├── Hero.jsx   / .css
        ├── About.jsx  / .css
        ├── Skills.jsx / .css
        ├── Projects.jsx / .css
        ├── Experience.jsx / .css
        ├── Contact.jsx / .css
        └── Footer.jsx / .css
```

## ✏️ Customization

All content lives in `src/data.js`. Edit:
- `profile` — name, email, GitHub, LinkedIn, bio
- `skills` — tech stack cards
- `projects` — project cards with stack tags
- `experience` — timeline entries

For the contact form, wire up `handleSubmit` in `Contact.jsx` to:
- **AWS SES** (recommended — you already use AWS)
- **EmailJS** (zero-backend option)
- **Formspree** (simple REST endpoint)
=======
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
>>>>>>> 860785cbbd483947ac9ab3778bbd27f77ee16625
