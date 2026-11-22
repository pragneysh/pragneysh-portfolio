# AWS Portfolio Deployment: Safety Audit Report

**Date:** 2026-11-21  
**Project:** Pragneysh Dekate Portfolio  
**Target Domain:** `pragneyshdekate.in` / `www.pragneyshdekate.in`  
**AWS Account ID:** `882248517276`  
**Active Caller:** `arn:aws:iam::882248517276:user/Pragneysh`  
**Deployment Region:** `ap-south-1`  
**ACM Region:** `us-east-1`  

---

## 1. Safety Audit Findings

| Audit Check | Status | Evidence / Verification Details |
| :--- | :--- | :--- |
| **AWS Account ID Match** | **PASSED** | Caller account `882248517276` matches expected ID exactly. |
| **Route 53 Zone Discovery** | **PASSED** | Public hosted zone `Z021597535J593O8T58RO` discovered for `pragneyshdekate.in.`. |
| **School Website Protection** | **PASSED** | Verified 4 protected records for `school.pragneyshdekate.in` in Route 53 pointing to distribution `d2wqtpbyh7s0zz.cloudfront.net`. Zero risk of disruption. |
| **ACM Certificate in `us-east-1`** | **PASSED** | Certificate `arn:aws:acm:us-east-1:882248517276:certificate/f56d9ed1-379f-43f8-9a8a-0ccd0cd4c953` is active and in `ISSUED` status for `pragneyshdekate.in`. |
| **Dual-SAN ACM Certificate** | **IN PROGRESS** | Certificate `arn:aws:acm:us-east-1:882248517276:certificate/1c1e52df-a67a-400b-925b-1b5e7bc925a6` covering `pragneyshdekate.in` and `www.pragneyshdekate.in` requested; validation CNAME added to Route 53. |
| **S3 Private Bucket State** | **AUDITED** | Bucket `pragneyshdekate-portfolio-prod-882248517276` not yet created (handled idempotently in `bootstrap`). |
| **CloudFront OAC State** | **AUDITED** | OAC `pragneyshdekate-portfolio-prod-oac` not yet created (handled idempotently in `bootstrap`). |
| **CloudFront Function State** | **AUDITED** | SPA rewrite function script created at `scripts/spa-rewrite-function.js`. |
| **Existing School CDN Unmodified** | **PASSED** | Distribution `E27H6HXQPZ05YU` confirmed untouched. |

---

## 2. Resource Inventory & Protection Boundaries

### Protected Resources (DO NOT TOUCH):
- Distribution `E27H6HXQPZ05YU` (Kudashan School CDN)
- S3 Bucket `kudashan-school-prod-882248517276`
- Route 53 records:
  - `admin.school.pragneyshdekate.in`
  - `demo1.school.pragneyshdekate.in`
  - `demo2.school.pragneyshdekate.in`
  - `_6f54061e9e6e692f6e7e7885189fc9d4.school.pragneyshdekate.in`
- Client distributions (`Aurexon`, `FortiNexus`, `Durgesh Koshti`, `The Yoga Hub`, `Pal Films`)

### Target Portfolio Resources:
- Private S3 Bucket: `pragneyshdekate-portfolio-prod-882248517276`
- CloudFront OAC: `pragneyshdekate-portfolio-prod-oac`
- CloudFront Function: `pragneyshdekate-spa-rewrite`
- Portfolio CloudFront Distribution: Dedicated to `pragneyshdekate.in`
- GitHub OIDC IAM Role: `github-actions-portfolio-deploy-role`

---

## 3. Automation Implementation Verification

1. **`deploy.sh`:** Complete bash automation script supporting:
   - `audit`
   - `bootstrap`
   - `deploy`
   - `invalidate`
   - `dns-plan`
   - `dns-apply`
   - `rollback-info`
2. **`deploy.ps1`:** Windows PowerShell wrapper for executing `deploy.sh`.
3. **`.github/workflows/deploy.yml`:** Production CI/CD workflow utilizing OIDC token assumption with least-privilege IAM permissions.
4. **Catalogue Audit:** Verified 9 engineering projects and 5 live client websites via `node scripts/auditCatalogue.mjs`.

---

## 4. Pending / Next Steps

1. Execute `./deploy.sh bootstrap` to create the S3 bucket, OAC, CloudFront function, and CloudFront distribution.
2. Execute `./deploy.sh deploy` to upload the production build.
3. Review `./deploy.sh dns-plan`.
4. Execute `./deploy.sh dns-apply --confirm` when ready for DNS cutover.
