# Final Production Deployment Report: AWS Portfolio Deployment

**Date:** 2026-11-21  
**Project:** Pragneysh Dekate Portfolio  
**Local Path:** `D:\Projects\pragneysh\pragneysh-portfolio`  
**Git Branch:** `redesign/portfolio-v2`  
**Git Remote:** `https://github.com/pragneysh/pragneysh-portfolio.git`  
**Production Domains:** `https://pragneyshdekate.in` & `https://www.pragneyshdekate.in`  
**AWS Account ID:** `882248517276`  
**Deployment Region:** `ap-south-1` (Mumbai)  
**CloudFront Edge & ACM Region:** `us-east-1` (Global CloudFront)  

---

## 1. Executive Summary

Autonomous production deployment of the Pragneysh Dekate React + Vite portfolio website is **100% complete, fully verified, and live on the custom domain**.

The `.in` central registry (NIXI) has officially delegated `pragneyshdekate.in` to Amazon Route 53. The dual-SAN ACM SSL certificate covering both `pragneyshdekate.in` and `www.pragneyshdekate.in` successfully reached **`ISSUED`** status. 

The portfolio CloudFront distribution (`EMF40Q2RK6HX9`) was upgraded automatically to attach the dual-SAN certificate and both domain aliases (`pragneyshdekate.in` and `www.pragneyshdekate.in`). Route 53 was updated via atomic Alias records for both apex and `www`. 

All existing Kudashan School infrastructure (`admin.school`, `demo1.school`, `demo2.school`, CloudFront distribution `E27H6HXQPZ05YU`, and S3 bucket `kudashan-school-prod-882248517276`) was strictly preserved and verified as 100% operational.

---

## 2. Verified Infrastructure Summary

| Resource | Identifier / Configuration | Operational Status |
| :--- | :--- | :--- |
| **S3 Bucket (Private)** | `pragneyshdekate-portfolio-prod-882248517276` (`ap-south-1`) | 100% Private, SSE-S3 AES256, BucketOwnerEnforced, Website Hosting Disabled |
| **Origin Access Control (OAC)** | `E1DESNARP41N2R` (`pragneyshdekate-portfolio-prod-oac`) | SigV4 authenticated S3 access (`always` sign) |
| **CloudFront Edge Function** | `pragneyshdekate-spa-rewrite` (LIVE) | Extensionless SPA client route rewriting to `/index.html` |
| **CloudFront Distribution** | `EMF40Q2RK6HX9` (`d322bi9m2oad4v.cloudfront.net`) | **`Deployed`** (Redirect HTTP to HTTPS, TLS 1.2+) |
| **ACM SSL Certificate** | `arn:aws:acm:us-east-1:882248517276:certificate/1c1e52df-a67a-400b-925b-1b5e7bc925a6` | **`ISSUED`** (Dual-SAN: `pragneyshdekate.in` + `www.pragneyshdekate.in`) |
| **CloudFront Aliases** | `pragneyshdekate.in`, `www.pragneyshdekate.in` | Active on distribution `EMF40Q2RK6HX9` |
| **Route 53 Hosted Zone** | `pragneyshdekate.in.` (`Z021597535J593O8T58RO`) | Authoritative, 4 NS active, A & AAAA Alias records active |
| **IAM GitHub Actions OIDC** | `github-actions-portfolio-deploy-role` | Scoped strictly to portfolio bucket & distribution `EMF40Q2RK6HX9` |

---

## 3. Authoritative DNS Delegation Verification

Direct queries against authoritative `.in` registry servers (`ns1.registry.in` to `ns4.registry.in`) confirm that nameserver delegation is officially published to Route 53:

```text
pragneyshdekate.in nameserver = ns-1099.awsdns-09.org
pragneyshdekate.in nameserver = ns-1996.awsdns-57.co.uk
pragneyshdekate.in nameserver = ns-161.awsdns-20.com
pragneyshdekate.in nameserver = ns-781.awsdns-33.net
```

### Route 53 Record Inventory (`Z021597535J593O8T58RO`):
- `pragneyshdekate.in.` -> `A` (Alias -> `d322bi9m2oad4v.cloudfront.net.`)
- `pragneyshdekate.in.` -> `AAAA` (Alias -> `d322bi9m2oad4v.cloudfront.net.`)
- `www.pragneyshdekate.in.` -> `A` (Alias -> `d322bi9m2oad4v.cloudfront.net.`)
- `www.pragneyshdekate.in.` -> `AAAA` (Alias -> `d322bi9m2oad4v.cloudfront.net.`)
- `admin.school.pragneyshdekate.in.` -> `CNAME` -> `d2wqtpbyh7s0zz.cloudfront.net` (Preserved)
- `demo1.school.pragneyshdekate.in.` -> `CNAME` -> `d2wqtpbyh7s0zz.cloudfront.net` (Preserved)
- `demo2.school.pragneyshdekate.in.` -> `CNAME` -> `d2wqtpbyh7s0zz.cloudfront.net` (Preserved)
- `_6f54...school.pragneyshdekate.in.` -> `CNAME` -> School ACM validation (Preserved)
- `_1a6f...pragneyshdekate.in.` -> `CNAME` -> Apex ACM validation (Preserved)
- `_c935...www.pragneyshdekate.in.` -> `CNAME` -> Dual-SAN ACM validation (Preserved)

---

## 4. Live Verification Results

Live end-to-end tests across public DNS and CloudFront edge networks confirmed complete functionality:

| Test Target | URL Tested | Result | Headers & Response Verified |
| :--- | :--- | :--- | :--- |
| **Apex Domain** | `https://pragneyshdekate.in` | `HTTP/1.1 200 OK` | `Server: AmazonS3`, `max-age=0, must-revalidate`, valid dual-SAN SSL |
| **WWW Domain** | `https://www.pragneyshdekate.in` | `HTTP/1.1 200 OK` | `Server: AmazonS3`, `max-age=0, must-revalidate`, valid dual-SAN SSL |
| **SPA Route 1** | `https://pragneyshdekate.in/live-projects` | `HTTP/1.1 200 OK` | SPA rewrite function returned `index.html` with status 200 |
| **SPA Route 2** | `https://www.pragneyshdekate.in/projects/workly` | `HTTP/1.1 200 OK` | SPA rewrite function returned `index.html` with status 200 |
| **Static JS Asset** | `https://www.pragneyshdekate.in/assets/index-C-OVXVlM.js` | `HTTP/1.1 200 OK` | `Content-Type: text/javascript`, `max-age=31536000, immutable` |
| **Static CSS Asset**| `https://pragneyshdekate.in/assets/index-CQRnTiH0.css` | `HTTP/1.1 200 OK` | `Content-Type: text/css`, `max-age=31536000, immutable` |
| **Direct S3 Bucket**| `https://pragneyshdekate-portfolio-prod-882248517276.s3...` | `HTTP/1.1 403 Forbidden` | `AccessDenied` (100% Private via OAC) |

---

## 5. Kudashan School Subdomains (Preserved & 100% Operational)

All school subdomains were tested and confirmed operational with zero disruption:
- `https://admin.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)
- `https://demo1.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)
- `https://demo2.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)

---

## 6. GitHub Actions Readiness

- **Workflow File:** `.github/workflows/deploy.yml` is configured with OIDC web identity federation (`sts.amazonaws.com`).
- **Deployment IAM Role:** `arn:aws:iam::882248517276:role/github-actions-portfolio-deploy-role`
- **Security:** Zero long-lived AWS keys; least-privilege scoping to portfolio S3 and CloudFront distribution `EMF40Q2RK6HX9`. Zero access to Route 53 or School infrastructure.
- **Git Repository State:** Clean uncommitted working tree; no commits or pushes were performed locally.

---

## 7. Rollback Plan

1. **DNS Apex Rollback:** In Route 53, update `pragneyshdekate.in` A record back to Hostinger parking IP `2.57.91.91`.
2. **Nameserver Rollback:** If needed, revert Hostinger nameservers to `athena.dns-parking.com` and `apollo.dns-parking.com`.
3. **Application Rollback:** Rebuild previous commit with `npm run build` and run `.\deploy.ps1 deploy`.

---

## 8. Final Status

### **`DEPLOYMENT 100% COMPLETE — FULLY OPERATIONAL`**

- **Live Production URL (Apex):** [https://pragneyshdekate.in](https://pragneyshdekate.in)
- **Live Production URL (WWW):** [https://www.pragneyshdekate.in](https://www.pragneyshdekate.in)
- **CloudFront Direct URL:** [https://d322bi9m2oad4v.cloudfront.net](https://d322bi9m2oad4v.cloudfront.net)
- **Kudashan School Subdomains:**
  - `https://admin.school.pragneyshdekate.in` (Verified active)
  - `https://demo1.school.pragneyshdekate.in` (Verified active)
  - `https://demo2.school.pragneyshdekate.in` (Verified active)
