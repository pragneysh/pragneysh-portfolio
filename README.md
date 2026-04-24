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
