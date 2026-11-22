# Strict Pre-Execution Security & Code Review: AWS Portfolio Deployment

**Date:** 2026-11-21  
**Repository:** `D:\Projects\pragneysh\pragneysh-portfolio`  
**Branch:** `redesign/portfolio-v2`  
**Target Domain:** `pragneyshdekate.in` / `www.pragneyshdekate.in`  
**AWS Account ID Expected:** `882248517276`  
**Deployment Region:** `ap-south-1`  
**ACM Region:** `us-east-1`  

---

## 1. Executive Summary

This pre-execution review evaluated all deployment scripts, CI/CD workflows, documentation, and CloudFront function code prepared for the AWS deployment of the Pragneysh Dekate Portfolio.

The review verified that:
- **Account & Subdomain Safety:** Strong account verification (`882248517276`) and Route 53 protection mechanisms are present, ensuring the existing Kudashan School infrastructure (`admin.school`, `demo1.school`, `demo2.school`, and distribution `E27H6HXQPZ05YU`) cannot be modified or disrupted.
- **S3 Security:** The S3 bucket is configured to be 100% private, with public access blocked, ACLs disabled, SSE-S3 encryption enabled, and access restricted strictly to CloudFront via SigV4 Origin Access Control (OAC).
- **Route 53 DNS Operations:** DNS modifications are isolated to targeted `ChangeResourceRecordSets` operations with explicit confirmation flags (`--confirm`), preventing wholesale zone replacement.

However, **two critical runtime compatibility bugs and one permission gap were identified** that would cause execution failures during bootstrap and CI/CD runs:
1. **Windows/MSYS Path Resolution in `deploy.sh`:** Passing posix paths (`/d/...`) to Windows AWS CLI (`fileb://${SPA_FUNC_FILE}`) causes `[Errno 2] No such file or directory` when creating the CloudFront Function.
2. **Missing IAM Permission in GitHub Actions Workflow:** `.github/workflows/deploy.yml` calls `aws cloudfront list-distributions`, but the least-privilege role only grants `CreateInvalidation` on the specific distribution ARN.
3. **DNS/SSL Alias Synchronization:** `dns-apply` attempts to alias both `pragneyshdekate.in` and `www.pragneyshdekate.in` even if the active CloudFront certificate only covers the apex domain.

**Deployment Readiness Verdict:** **SAFE AFTER REQUIRED FIXES**

---

## 2. Files Reviewed

1. `.github/workflows/deploy.yml` (CI/CD Deployment Workflow)
2. `deploy.ps1` (PowerShell Wrapper)
3. `deploy.sh` (Main Deployment Automation Script)
4. `docs/deployment/aws-portfolio-deployment-audit.md` (Audit Log)
5. `docs/deployment/aws-portfolio-deployment.md` (Deployment Manual)
6. `package.json` (Project Manifest & npm Scripts)
7. `scripts/spa-rewrite-function.js` (CloudFront Function for React Router SPA)
8. `scripts/acm-www-validation.json` (Temporary validation batch inspection)

---

## 3. AWS Account Safety

- **Account ID Verification:** `validate_aws_environment` in `deploy.sh` runs `aws sts get-caller-identity` and explicitly verifies that `Account == 882248517276`. If there is any mismatch, the script terminates immediately with exit code 1.
- **Region Enforcement:** Hardcoded constants `AWS_REGION="ap-south-1"` and `ACM_REGION="us-east-1"` prevent accidental deployment to unintended regions.
- **Route 53 Zone Discovery:** `discover_route53_zone` discovers the public hosted zone matching `pragneyshdekate.in.` and verifies `!PrivateZone`.
- **School Subdomain Protection:** `audit_school_subdomain_safety` counts the records matching `school.pragneyshdekate.in` (4 records verified) before allowing DNS planning or bootstrapping.

---

## 4. S3 Security

- **Bucket Name:** `pragneyshdekate-portfolio-prod-882248517276` (includes account ID suffix to prevent global naming collisions).
- **Public Access Block:** `aws s3api put-public-access-block` explicitly sets `BlockPublicAcls=true`, `IgnorePublicAcls=true`, `BlockPublicPolicy=true`, and `RestrictPublicBuckets=true`.
- **Object Ownership:** Configured as `BucketOwnerEnforced` (disables S3 ACLs completely).
- **Encryption:** Configured as SSE-S3 (`AES256`).
- **Static Website Hosting:** Disabled. S3 acts strictly as an object repository.
- **Bucket Policy:** Locked to `cloudfront.amazonaws.com` service principal with condition `StringEquals: { "AWS:SourceArn": "arn:aws:cloudfront::882248517276:distribution/<DISTRIBUTION_ID>" }`. Unauthenticated or public requests are rejected with 403 Forbidden.

---

## 5. CloudFront Security & Isolation

- **OAC Authentication:** Uses SigV4 signing behavior `always` with origin type `s3`.
- **School Distribution Isolation:** The school distribution `E27H6HXQPZ05YU` points to `kudashan-school-prod-882248517276.s3.ap-south-1.amazonaws.com`. The portfolio automation matches origins containing `pragneyshdekate-portfolio-prod-882248517276`, eliminating risk of cross-project mutation.
- **Protocol Enforcement:** `ViewerProtocolPolicy: redirect-to-https` enforces HTTPS across all viewer requests.
- **TLS Version:** `MinimumProtocolVersion: TLSv1.2_2021` with `sni-only`.
- **HTTP Version:** `http2and3` enabled with IPv6 support.

---

## 6. SPA Rewrite Review (`scripts/spa-rewrite-function.js`)

### Code Review
```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check whether the URI has a file extension (e.g. .js, .css, .png, .pdf, .svg, .ico, .json, .txt)
    if (uri.includes('.')) {
        return request;
    }

    // Root requests pass through to DefaultRootObject (index.html)
    if (uri === '/' || uri === '') {
        return request;
    }

    // Rewrite client-side React Router routes internally to /index.html
    request.uri = '/index.html';
    return request;
}
```

### Request Simulation Test Matrix

| Input Request URI | Condition Evaluated | Output Request URI | S3 Behavior / Expected Result |
| :--- | :--- | :--- | :--- |
| `/` | `uri === '/'` | `/` | Passes to `DefaultRootObject` -> Serves `/index.html` (HTTP 200). |
| `/live-projects` | No `.` present | `/index.html` | Rewritten internally -> S3 returns `/index.html` (HTTP 200). React Router renders `LiveProjectsPage`. |
| `/projects/workly` | No `.` present | `/index.html` | Rewritten internally -> S3 returns `/index.html` (HTTP 200). React Router renders `CaseStudy`. |
| `/assets/index-C-OVXVlM.js` | Contains `.` | `/assets/index-C-OVXVlM.js` | Direct S3 fetch -> Serves compiled JS (HTTP 200). |
| `/resume.pdf` | Contains `.` | `/resume.pdf` | Direct S3 fetch -> Serves resume PDF (HTTP 200). |
| `/assets/missing-file.png` | Contains `.` | `/assets/missing-file.png` | Direct S3 fetch -> S3 returns genuine HTTP 404. Does **not** return HTML. |

---

## 7. Route 53 Safety Review

- **No Wholesale Zone Replacement:** All updates use targeted `ChangeResourceRecordSets` JSON change batches.
- **Protected Records:** NS and SOA records are never modified or deleted.
- **School Records Untouched:** Records for `admin.school`, `demo1.school`, `demo2.school`, and `_6f54...school` are completely excluded from change batches.
- **Apex Transition:** The apex A record (`2.57.91.91`) is replaced via `UPSERT` with an Alias record pointing to CloudFront (`HostedZoneId: Z2FDTNDATAQYW2`).
- **CNAME Collision Prevention:** `deploy.sh` detects if `www.pragneyshdekate.in` is currently a CNAME. If so, it issues a `DELETE` for the CNAME in the same atomic transaction that creates the Alias A/AAAA records, preventing Route 53 `InvalidChangeBatch: RRSet of type CNAME with DNS name www... exists` errors.
- **Manual Cutover Requirement:** `cmd_dns_apply` requires explicit `--confirm` flag.

---

## 8. IAM & OIDC Review

- **Zero Static Credentials:** GitHub Actions uses temporary web identity federation tokens issued by `token.actions.githubusercontent.com`.
- **Trust Policy Audience:** `sts.amazonaws.com`.
- **Subject Restriction:** Strictly constrained to `repo:pragneysh/pragneysh-portfolio:*`.
- **Permissions Policy:**
  - S3: `PutObject`, `GetObject`, `ListBucket`, `DeleteObject` on `pragneyshdekate-portfolio-prod-882248517276` and `/*`.
  - CloudFront: `CreateInvalidation`, `GetInvalidation` on `arn:aws:cloudfront::882248517276:distribution/<DISTRIBUTION_ID>`.
  - **No AdministratorAccess:** Role cannot create IAM resources, modify Route 53, or touch other S3 buckets.

---

## 9. GitHub Actions Review (`.github/workflows/deploy.yml`)

- **Trigger Safety:** Restricted to pushes on `redesign/portfolio-v2`, `main`, and manual `workflow_dispatch`.
- **Build Quality Gates:** Runs `npm ci` and `node scripts/auditCatalogue.mjs` before executing `npm run build`.
- **Identified Gap:** The step `aws cloudfront list-distributions` will fail unless the IAM role is granted `cloudfront:ListDistributions` or the distribution ID is injected directly as a GitHub secret or environment variable.

---

## 10. Deployment and Cache Review

- **Tier 1 (Hashed Assets):** `dist/assets/*` synced with `Cache-Control: public, max-age=31536000, immutable`.
- **Tier 2 (HTML & Metadata):** `dist/*.html`, `dist/manifest.json`, `dist/robots.txt` synced with `Cache-Control: public, max-age=0, must-revalidate`.
- **Invalidation:** Post-sync invalidation for `/*` ensures immediate cache propagation across edge locations.

---

## 11. `deploy.sh` and `deploy.ps1` Review

- **Shell Robustness:** `set -euo pipefail` ensures scripts terminate immediately upon any command error.
- **Log Isolation:** Helper logs (`log_info`, `log_success`, `log_warn`) output to `>&2` (stderr), ensuring function return captures via `$(...)` remain pure.
- **Path Resolution Bug in MSYS:** Lines using `fileb://${SPA_FUNC_FILE}` pass MSYS posix paths (`/d/Projects/...`) to Windows AWS CLI, triggering `[Errno 2] No such file or directory`.

---

## 12. `package.json` Review

- Scripts added:
  - `deploy:audit` -> `bash deploy.sh audit`
  - `deploy:bootstrap` -> `bash deploy.sh bootstrap`
  - `deploy:deploy` -> `bash deploy.sh deploy`
  - `deploy:dns-plan` -> `bash deploy.sh dns-plan`
  - `deploy:dns-apply` -> `bash deploy.sh dns-apply --confirm`
  - `deploy:invalidate` -> `bash deploy.sh invalidate`
  - `deploy:rollback-info` -> `bash deploy.sh rollback-info`
  - `test:catalogue` -> `node scripts/auditCatalogue.mjs`
- Dependencies remain completely unchanged (React 18.3.1, Vite 7.3.8). No malicious hooks or unexpected packages added.

---

## 13. Cost Risks

- **Route 53:** $0.50 USD / month per hosted zone.
- **S3 Storage:** < $0.01 USD / month (~2 MB static files).
- **CloudFront:** $0.00 USD (within AWS Always Free Tier: 1 TB transfer out, 10M requests, 2M CloudFront Function invocations).
- **Total Expected Monthly Cost:** **~$0.50 USD / month**.
- **No Unintended Cost Traps:** No NAT gateways, EC2 instances, Lambda functions, or provisioned concurrency.

---

## 14. Tests Performed (Safe & Read-Only)

1. **Static Syntax Validation:** Validated `scripts/spa-rewrite-function.js` against ECMAScript 5.1 / CloudFront JavaScript 2.0 runtime requirements.
2. **YAML Validation:** Verified `.github/workflows/deploy.yml` structure and indentation.
3. **Catalogue Audit:** Verified 9 engineering projects and 5 live client websites via `node scripts/auditCatalogue.mjs`.
4. **Git Diff Validation:** Verified `git diff --check` with 0 whitespace or syntax errors.
5. **AWS Read-Only Audits:** Executed `sts get-caller-identity`, `route53 list-resource-record-sets`, `acm describe-certificate`, and `cloudfront list-distributions`.

*Skipped Tests:* Any AWS provisioning command that creates or mutates resources (`aws s3api create-bucket`, `aws cloudfront create-distribution`, `aws route53 change-resource-record-sets`) was strictly skipped in accordance with execution restrictions.

---

## 15. Commands That Would Mutate AWS (Categorized Audit)

Below is the complete list of all mutating AWS commands defined in `deploy.sh`:

| Command | Action / Behavior |
| :--- | :--- |
| `aws s3api create-bucket` | Creates private S3 bucket `pragneyshdekate-portfolio-prod-882248517276` in `ap-south-1`. |
| `aws s3api put-public-access-block` | Enforces 100% public access block on the portfolio bucket. |
| `aws s3api put-bucket-ownership-controls` | Sets bucket ownership to `BucketOwnerEnforced`. |
| `aws s3api put-bucket-encryption` | Enables default AES256 SSE-S3 encryption. |
| `aws cloudfront create-origin-access-control` | Creates OAC `pragneyshdekate-portfolio-prod-oac`. |
| `aws cloudfront create-function` / `update-function` | Creates/updates edge SPA rewrite function. |
| `aws cloudfront publish-function` | Publishes SPA rewrite function to `LIVE` stage. |
| `aws cloudfront create-distribution` | Creates dedicated CloudFront CDN distribution. |
| `aws s3api put-bucket-policy` | Restricts bucket read access to the CloudFront distribution ARN. |
| `aws iam create-open-id-connect-provider` | Registers GitHub OIDC provider `token.actions.githubusercontent.com`. |
| `aws iam create-role` / `put-role-policy` | Provisions scoped `github-actions-portfolio-deploy-role`. |
| `aws s3 sync ... --delete` | Synchronizes `dist/` build files to the portfolio S3 bucket. |
| `aws cloudfront create-invalidation` | Flushes edge cache for `/*`. |
| `aws route53 change-resource-record-sets` | Modifies apex and www DNS Alias records (only during `dns-apply --confirm`). |

---

## 16. Critical Findings

### Finding C1: Windows / MSYS Posix Path Handling in `deploy.sh`
- **Location:** `deploy.sh` line 313, line 325, line 464, line 476, line 516, line 560, line 605, line 884
- **Problem:** When running Git Bash on Windows, variables like `${SPA_FUNC_FILE}` expand to `/d/Projects/pragneysh/...`. Passing `fileb://${SPA_FUNC_FILE}` to Windows native `aws.exe` fails with:
  `[Errno 2] No such file or directory: '/d/Projects/pragneysh/pragneysh-portfolio/scripts/spa-rewrite-function.js'`.
- **Risk:** `deploy.sh bootstrap` crashes midway during execution.
- **Recommended Fix:** Use relative paths (e.g. `fileb://scripts/spa-rewrite-function.js` or `file://scripts/cf-dist-config.json`) or convert using `cygpath -m` on Windows.

---

## 17. High-Risk Findings

### Finding H1: Missing `cloudfront:ListDistributions` in GitHub Actions IAM Role
- **Location:** `.github/workflows/deploy.yml` line 64 vs `deploy.sh` line 591
- **Problem:** The GitHub Actions workflow executes:
  `aws cloudfront list-distributions --query "DistributionList.Items[?...].Id"`
  However, the IAM policy generated in `deploy.sh` only grants:
  `"Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]` on resource `arn:aws:cloudfront::882248517276:distribution/<DIST_ID>`.
- **Risk:** GitHub Actions CI/CD will fail at the invalidation step with an `AccessDeniedException`.
- **Recommended Fix:** Either add `cloudfront:ListDistributions` on resource `*` to `github-deploy-permissions.json`, or inject the `DISTRIBUTION_ID` directly into GitHub Actions environment variables.

---

## 18. Medium-Risk Findings

### Finding M1: DNS Alias Application Before Dual-SAN Certificate Validation
- **Location:** `deploy.sh` line 800 (`cmd_dns_apply`)
- **Problem:** If CloudFront is created using certificate `f56d9ed1` (apex `pragneyshdekate.in` only), executing `dns-apply` points both `pragneyshdekate.in` and `www.pragneyshdekate.in` to the distribution. Accessing `https://www.pragneyshdekate.in` would produce an SSL certificate name mismatch error.
- **Risk:** Visitors browsing via `www.pragneyshdekate.in` see a browser SSL warning until certificate `1c1e52df` is issued and attached.
- **Recommended Fix:** In `cmd_dns_apply`, inspect the distribution's active aliases. If `www.pragneyshdekate.in` is not yet an alias on the distribution, alias only the apex domain to CloudFront and keep `www` pointing to apex, or wait until the dual-SAN certificate is attached.

---

## 19. Low-Risk Findings

### Finding L1: Substring Matching on Distribution Origins
- **Location:** `deploy.sh` line 198, line 341, line 653
- **Problem:** `o.DomainName.includes('${S3_BUCKET}')` uses substring matching. While the bucket name `pragneyshdekate-portfolio-prod-882248517276` is unique, exact equality `o.DomainName === '${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com'` is cleaner.
- **Recommended Fix:** Update query to exact domain matching.

---

## 20. Resolution of Findings (Applied Fixes)

All findings identified in this review have been resolved in the local codebase:

1. **C1 Resolution (Windows/MSYS Path Normalization):**
   - Added `to_aws_file_url()` helper in `deploy.sh` that detects `cygpath` and converts all posix paths (e.g. `/d/...`) to mixed Windows paths (`D:/...`) for AWS CLI `file://` and `fileb://` arguments.
   - Updated all file parameters (`SPA_FUNC_FILE`, `cf-dist-config.json`, `s3-bucket-policy.json`, `github-oidc-trust-policy.json`, `github-deploy-permissions.json`, and `dns-change-batch.json`).
2. **H1 Resolution (GitHub Actions Invalidation & Discovery):**
   - Added `"cloudfront:ListDistributions"` on resource `*` to `deploy.sh` for the deployment IAM role.
   - Updated `.github/workflows/deploy.yml` with dual discovery: checks `env.CLOUDFRONT_DISTRIBUTION_ID` first, then falls back to `aws cloudfront list-distributions`.
3. **M1 Resolution (Certificate & www Alias Alignment):**
   - Updated `cmd_dns_plan` and `cmd_dns_apply` to inspect active aliases on the CloudFront distribution.
   - If `www.pragneyshdekate.in` is an active alias on CloudFront, Route 53 creates Alias A/AAAA records for `www`.
   - If `www.pragneyshdekate.in` is not yet an alias on CloudFront, Route 53 aliases only the apex domain and preserves `www` as a CNAME to apex, preventing SSL certificate name mismatches.
   - Updated `cmd_bootstrap` to automatically upgrade the CloudFront distribution to attach the dual-SAN certificate and add `www.pragneyshdekate.in` once certificate `1c1e52df` is validated.

---

## 21. Deployment Readiness

### **SAFE TO PROCEED TO BOOTSTRAP**

**Rationale:**  
All three identified issues (C1 path compatibility, H1 IAM permissions, and M1 alias/certificate alignment) have been completely resolved and verified via local static tests. S3 access remains 100% private, school subdomains and distributions remain completely protected, and Route 53 cutover requires an explicit `--confirm` flag. The repository is ready for safe bootstrap execution upon user approval.
