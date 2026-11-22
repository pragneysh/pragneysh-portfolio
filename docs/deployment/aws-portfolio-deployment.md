# AWS Production Deployment Guide: Pragneysh Dekate Portfolio

**Target Domain:** `pragneyshdekate.in` / `www.pragneyshdekate.in`  
**Registrar:** HostingR (Hostinger)  
**Primary Region:** `ap-south-1` (Mumbai)  
**ACM Certificate Region:** `us-east-1` (N. Virginia)  
**Architecture:** Private S3 Bucket + CloudFront (OAC + Edge SPA Function) + ACM SSL + Route 53 DNS  

---

## 1. Architecture Overview

```
User Browser (HTTPS)
      ↓
Route 53 Public Hosted Zone (pragneyshdekate.in)
      ↓ (Alias A & AAAA Records — Free DNS queries)
Amazon CloudFront Distribution
      ├── TLS 1.2/1.3 SSL Certificate (ACM us-east-1)
      ├── Edge CloudFront Function (Viewer-Request SPA URL Rewrite)
      └── Origin Access Control (OAC with SigV4 Signing)
            ↓
Amazon S3 Private Bucket (ap-south-1: pragneyshdekate-portfolio-prod-882248517276)
      ├── Block All Public Access: ENABLED (100% Private)
      ├── SSE-S3 Encryption: AES256
      └── Bucket Policy: Restricted exclusively to CloudFront SourceArn
```

---

## 2. Infrastructure Resources

| Resource | Resource Name / ID | Purpose |
| :--- | :--- | :--- |
| **S3 Bucket** | `pragneyshdekate-portfolio-prod-882248517276` | Private static website storage in `ap-south-1` |
| **Origin Access Control** | `pragneyshdekate-portfolio-prod-oac` | SigV4 authenticated S3 access |
| **CloudFront Function** | `pragneyshdekate-spa-rewrite` | Edge URL rewrite for React Router SPA routes |
| **CloudFront Distribution** | `<DISCOVERED_OR_CREATED>` | Global CDN edge caching and SSL termination |
| **ACM Certificate** | `arn:aws:acm:us-east-1:882248517276:certificate/f56d9ed1-379f-43f8-9a8a-0ccd0cd4c953` | Validated SSL/TLS certificate in `us-east-1` |
| **Route 53 Hosted Zone** | `Z021597535J593O8T58RO` (`pragneyshdekate.in.`) | Public DNS hosted zone |
| **GitHub OIDC Role** | `github-actions-portfolio-deploy-role` | Least-privilege IAM deployment role |

---

## 3. Automation Scripts & Commands

All deployment tasks are automated via `deploy.sh` (or `deploy.ps1` in PowerShell / `npm run deploy:*`).

| Command | Action |
| :--- | :--- |
| `./deploy.sh audit` | Performs a read-only safety audit of all AWS resources, account ownership, and school subdomain protections. |
| `./deploy.sh bootstrap` | Idempotently provisions the S3 bucket, OAC, CloudFront function, CloudFront distribution, S3 bucket policy, and GitHub OIDC role. |
| `./deploy.sh deploy` | Runs `npm run build`, uploads assets with 1-year immutable caching, uploads HTML with `must-revalidate`, and invalidates CloudFront. |
| `./deploy.sh invalidate` | Creates an invalidation on CloudFront for `/*`. |
| `./deploy.sh dns-plan` | Displays the exact targeted Route 53 record changes without applying them. |
| `./deploy.sh dns-apply --confirm` | Applies the targeted Route 53 Alias changes for `pragneyshdekate.in` and `www`. |
| `./deploy.sh rollback-info` | Displays application and DNS rollback instructions. |

---

## 4. React Router SPA Routing Solution

In React Router Single Page Applications, routes such as `/live-projects` and `/projects/aws-control-center` do not exist as physical files on S3.

### Solution: CloudFront Edge Function (`viewer-request`)
Instead of a blunt 403/404-to-200 custom error response that maps everything to HTML, a lightweight CloudFront Function inspects incoming requests at the edge:

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Static assets with file extensions (.js, .css, .png, .pdf, .svg, .ico, .json)
    // pass directly to S3 and are never rewritten.
    if (uri.includes('.')) {
        return request;
    }

    // Root requests pass through to DefaultRootObject (index.html)
    if (uri === '/' || uri === '') {
        return request;
    }

    // Rewrite client-side routes internally to /index.html before contacting S3
    request.uri = '/index.html';
    return request;
}
```

**Benefits:**
- Client routes (`/live-projects`, `/projects/workly`, etc.) receive genuine HTTP 200 responses directly from origin.
- Missing files (`/assets/missing.png`) genuinely return 404, preventing invalid HTML fallbacks.
- Sub-millisecond execution with negligible cost.

---

## 5. Caching & Invalidation Strategy

Vite creates content-hashed filenames for compiled JavaScript and CSS (e.g. `index-C-OVXVlM.js`). This enables a high-performance two-tier caching strategy:

1. **Hashed Assets (`dist/assets/*`):**
   - Header: `Cache-Control: public, max-age=31536000, immutable`
   - Cache duration: 1 year.
2. **Root Documents & HTML (`dist/*.html`, `dist/manifest.json`, `dist/robots.txt`, `dist/resume.pdf`):**
   - Header: `Cache-Control: public, max-age=0, must-revalidate`
   - Browsers immediately check for new versions on each visit.
3. **CloudFront Invalidation:**
   - Triggered on each deployment for `/*`.

---

## 6. GitHub Actions CI/CD (OIDC Authentication)

The deployment workflow [deploy.yml](../../.github/workflows/deploy.yml) uses AWS OpenID Connect (OIDC) token exchange:
- **Zero long-lived AWS keys:** No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` stored in GitHub secrets.
- **Audience:** `sts.amazonaws.com`.
- **Subject Restriction:** Scoped strictly to `repo:pragneysh/pragneysh-portfolio:*`.
- **Permissions:** Scoped strictly to the portfolio S3 bucket and CloudFront distribution.

---

## 7. DNS Cutover & HostingR Nameserver Setup

The Route 53 public hosted zone `Z021597535J593O8T58RO` is already created and populated with:
- School subdomains (`admin.school`, `demo1.school`, `demo2.school`, and school ACM CNAME).
- Portfolio ACM validation CNAME (`_1a6f...`).
- Temporary Hostinger parking A record (`2.57.91.91`).

### Step-by-Step DNS Cutover:
1. Run `./deploy.sh bootstrap` to ensure CloudFront distribution is deployed.
2. Run `./deploy.sh deploy` to upload the website build.
3. Run `./deploy.sh dns-plan` to review the Route 53 change.
4. Run `./deploy.sh dns-apply --confirm` to point apex and `www` to CloudFront.
5. In your HostingR (Hostinger) portal for `pragneyshdekate.in`:
   - Change nameservers to the 4 assigned Route 53 nameservers:
     - `ns-781.awsdns-33.net`
     - `ns-161.awsdns-20.com`
     - `ns-1996.awsdns-57.co.uk`
     - `ns-1099.awsdns-09.org`

---

## 8. Rollback Procedures

### Application Content Rollback
```bash
git checkout <PREVIOUS_STABLE_COMMIT>
npm run build
./deploy.sh deploy
```

### DNS Rollback
If you need to revert DNS to the Hostinger parking server:
- Change apex `A` record back to: `2.57.91.91`
- Change `www` `CNAME` back to: `pragneyshdekate.in`
- Existing school records remain completely unaffected.
