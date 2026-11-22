# Final Pre-Bootstrap Execution Audit: AWS Portfolio Deployment

**Date:** 2026-11-21  
**Project:** Pragneysh Dekate Portfolio  
**Local Path:** `D:\Projects\pragneysh\pragneysh-portfolio`  
**Git Branch:** `redesign/portfolio-v2`  
**Target Domain:** `pragneyshdekate.in` / `www.pragneyshdekate.in`  
**AWS Account ID:** `882248517276` (Verified)  
**Deployment Region:** `ap-south-1` (Mumbai)  
**ACM Certificate Region:** `us-east-1` (N. Virginia)  

---

## 1. Executive Summary

This final pre-bootstrap audit evaluated the complete deployment automation suite (`deploy.sh`, `deploy.ps1`, `.github/workflows/deploy.yml`, `scripts/spa-rewrite-function.js`, and documentation) prior to initiating infrastructure provisioning.

All previously identified review findings (C1 Windows path handling, H1 GitHub Actions IAM list permissions, and M1 certificate/alias synchronization) were inspected and verified as fixed.

**Key Verification Highlights:**
1. **Zero Impact on Kudashan School Infrastructure:** Verified that the existing school CloudFront distribution (`E27H6HXQPZ05YU`), school S3 bucket (`kudashan-school-prod-882248517276`), and all 4 school Route 53 DNS records are completely isolated and cannot be selected or modified.
2. **S3 Privacy by Default:** The portfolio S3 bucket (`pragneyshdekate-portfolio-prod-882248517276`) is provisioned with 100% public access block, ACLs disabled (`BucketOwnerEnforced`), SSE-S3 encryption enabled, website hosting disabled, and read permissions locked strictly to the portfolio CloudFront distribution via SigV4 Origin Access Control (OAC).
3. **ACM & DNS Decoupling:** Live read-only DNS checks verified that certificate `f56d9ed1` (`pragneyshdekate.in`) is active and in `ISSUED` status. The dual-SAN certificate `1c1e52df` (`pragneyshdekate.in` + `www.pragneyshdekate.in`) is `PENDING_VALIDATION` because the validation CNAME is published in Route 53 but not yet in Hostinger DNS. `deploy.sh` correctly provisions CloudFront with the active apex certificate first and prevents `www` Route 53 aliasing until the dual-SAN certificate is validated and attached.
4. **Targeted DNS Changes with Confirmation:** No nameservers are modified automatically. Route 53 changes use atomic `ChangeResourceRecordSets` and require the explicit `--confirm` flag.

**Final Readiness Verdict:** **SAFE TO PROCEED WITH BOOTSTRAP**

---

## 2. Bootstrap Operation-by-Operation Analysis

The following table traces every AWS API command that `deploy.sh bootstrap` executes, in exact sequence:

| Step | AWS Service | API Operation | Target Resource | Idempotent? | Behavior If Already Exists | School/Existing Impact | Destructive? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | STS | `GetCallerIdentity` | Caller session | Yes | Returns caller ARN | None (Read-only) | No |
| **2** | Route 53 | `ListHostedZones` | Hosted zones list | Yes | Discovers ID `Z021597535J593O8T58RO` | None (Read-only) | No |
| **3** | Route 53 | `ListResourceRecordSets` | Zone records | Yes | Counts school records (4 verified) | None (Read-only) | No |
| **4** | ACM | `ListCertificates` | `us-east-1` certs | Yes | Discovers active issued certificate | None (Read-only) | No |
| **5** | S3 | `HeadBucket` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Checks bucket existence | None (Read-only) | No |
| **6** | S3 | `CreateBucket` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Skipped if `HeadBucket` succeeded | None (Unique name) | No |
| **7** | S3 | `PutPublicAccessBlock` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Re-enforces all 4 block settings | None | No |
| **8** | S3 | `PutBucketOwnershipControls` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Sets `BucketOwnerEnforced` | None | No |
| **9** | S3 | `PutBucketEncryption` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Re-enforces AES256 SSE-S3 | None | No |
| **10** | CloudFront | `ListOriginAccessControls` | OAC list | Yes | Checks for existing OAC | None (Read-only) | No |
| **11** | CloudFront | `CreateOriginAccessControl` | `pragneyshdekate-portfolio-prod-oac` | Yes | Skipped if OAC already exists | None | No |
| **12** | CloudFront | `DescribeFunction` | `pragneyshdekate-spa-rewrite` | Yes | Checks if function exists | None (Read-only) | No |
| **13** | CloudFront | `CreateFunction` / `UpdateFunction` | `pragneyshdekate-spa-rewrite` | Yes | Updates with ETag if exists | None | No |
| **14** | CloudFront | `PublishFunction` | `pragneyshdekate-spa-rewrite` (LIVE) | Yes | Publishes live stage | None | No |
| **15** | CloudFront | `ListDistributions` | Distribution list | Yes | Checks if distribution exists for bucket | None (Read-only) | No |
| **16** | ACM | `DescribeCertificate` | `<cert_arn>` (`us-east-1`) | Yes | Checks SANs for `www` presence | None (Read-only) | No |
| **17** | CloudFront | `CreateDistribution` | Dedicated portfolio distribution | Yes | Skipped if distribution exists | None (Dedicated to portfolio) | No |
| **18** | CloudFront | `UpdateDistribution` | Portfolio distribution (upgrade) | Yes | Only executed if dual-SAN becomes active | None | No |
| **19** | S3 | `PutBucketPolicy` | `pragneyshdekate-portfolio-prod-882248517276` | Yes | Updates policy for distribution ARN | None | No |
| **20** | IAM | `GetOpenIDConnectProvider` | `token.actions.githubusercontent.com` | Yes | Checks if provider exists | None (Read-only) | No |
| **21** | IAM | `CreateOpenIDConnectProvider` | `token.actions.githubusercontent.com` | Yes | Skipped if provider exists | None | No |
| **22** | IAM | `GetRole` | `github-actions-portfolio-deploy-role` | Yes | Checks if role exists | None (Read-only) | No |
| **23** | IAM | `CreateRole` / `UpdateAssumeRolePolicy` | `github-actions-portfolio-deploy-role` | Yes | Updates trust policy if exists | None | No |
| **24** | IAM | `PutRolePolicy` | `PortfolioDeployPolicy` | Yes | Enforces least-privilege policy | None | No |

*Zero destructive, deletion, or replacement operations exist in the bootstrap workflow.*

---

## 3. AWS Resource Isolation Verification

### A. Account ID Verification
- Enforced on line 57 of `deploy.sh`: validates `current_account == "882248517276"`. Any deviation terminates execution immediately.

### B. Kudashan School Infrastructure Isolation
- **CloudFront Distribution `E27H6HXQPZ05YU`:**  
  Origin is `kudashan-school-prod-882248517276.s3.ap-south-1.amazonaws.com`.  
  Portfolio distribution lookup explicitly requires `o.DomainName === '${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com'`. It is impossible for the script to select or modify `E27H6HXQPZ05YU`.
- **School S3 Bucket `kudashan-school-prod-882248517276`:**  
  The script strictly targets `pragneyshdekate-portfolio-prod-882248517276`.
- **School Subdomain DNS Records:**  
  The 4 school records (`admin.school`, `demo1.school`, `demo2.school`, and `_6f54...school`) are verified before execution and are completely excluded from change batches.

### C. Client Website Isolation
- S3 buckets, CloudFront distributions, and Route 53 zones for `Aurexon`, `FortiNexus`, `Durgesh Koshti`, `The Yoga Hub`, and `Pal Films` are unaffected.

---

## 4. DNS Safety & Migration Analysis

### A. Hosted Zone Verification
- Discovered zone: `Z021597535J593O8T58RO` (`pragneyshdekate.in.`, public).
- Verified that NS and SOA records are never modified.

### B. Planned Route 53 Records

| Record Name | Type | Action | Target / Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `pragneyshdekate.in.` | `A` (Alias) | `UPSERT` | `d...cloudfront.net.` (`Z2FDTNDATAQYW2`) | Points apex to portfolio CloudFront. Replaces temporary Hostinger parking IP `2.57.91.91`. |
| `pragneyshdekate.in.` | `AAAA` (Alias) | `UPSERT` | `d...cloudfront.net.` (`Z2FDTNDATAQYW2`) | IPv6 routing to portfolio CloudFront. |
| `www.pragneyshdekate.in.` | `CNAME` | `DELETE` | `pragneyshdekate.in` | Atomic cleanup (only if `www` is aliased). |
| `www.pragneyshdekate.in.` | `A` (Alias) | `UPSERT` | `d...cloudfront.net.` (`Z2FDTNDATAQYW2`) | Points `www` to CloudFront (only when certificate covers `www`). |
| `www.pragneyshdekate.in.` | `AAAA` (Alias) | `UPSERT` | `d...cloudfront.net.` (`Z2FDTNDATAQYW2`) | IPv6 routing for `www` (only when certificate covers `www`). |

### C. Protected DNS Records (Untouched)
- `admin.school.pragneyshdekate.in.` (CNAME -> `d2wqtpbyh7s0zz.cloudfront.net`)
- `demo1.school.pragneyshdekate.in.` (CNAME -> `d2wqtpbyh7s0zz.cloudfront.net`)
- `demo2.school.pragneyshdekate.in.` (CNAME -> `d2wqtpbyh7s0zz.cloudfront.net`)
- `_6f54061e9e6e692f6e7e7885189fc9d4.school.pragneyshdekate.in.` (ACM validation CNAME)
- `_1a6f601ad16006bde2a1c1a5b25fa220.pragneyshdekate.in.` (Portfolio ACM validation CNAME)
- `_c935ff70ede7f71ed80e7c6ba76deef4.www.pragneyshdekate.in.` (Portfolio www ACM validation CNAME)
- Domain `NS` and `SOA` records.

---

## 5. ACM Certificate Validation Analysis

Live DNS queries against Hostinger's authoritative nameservers (`athena.dns-parking.com`) and Route 53 (`Z021597535J593O8T58RO`) established the exact certificate status:

1. **Active Certificate (`f56d9ed1`):**  
   - Domain: `pragneyshdekate.in` (apex only)  
   - Status: **`ISSUED`** in `us-east-1`.  
   - Validation CNAME `_1a6f...` is published in Hostinger DNS and verified.
2. **Dual-SAN Certificate (`1c1e52df`):**  
   - Domains: `pragneyshdekate.in` + `www.pragneyshdekate.in`  
   - Status: **`PENDING_VALIDATION`** in `us-east-1`.  
   - Apex validation is complete (`SUCCESS`).  
   - `www` validation CNAME `_c935...` is published in Route 53, but is **not** present in Hostinger DNS.
3. **Can Dual-SAN Validation Complete Before Nameserver Migration?**  
   - **Yes.** If you add the CNAME `_c935ff70ede7f71ed80e7c6ba76deef4.www.pragneyshdekate.in` -> `_4dc896e04b23c7a5b98d04c6947b4474.wzccmgtwzk.acm-validations.aws.` into your Hostinger DNS panel, ACM will validate `www` within ~5 minutes, turning `1c1e52df` into `ISSUED` status before changing nameservers.
   - Alternatively, if nameservers are migrated to Route 53, ACM will validate it immediately from Route 53.
4. **Is the Apex Certificate Safe for Initial Bootstrap?**  
   - **Yes.** `deploy.sh` attaches `f56d9ed1` with alias `pragneyshdekate.in` only. `dns-plan` and `dns-apply` detect this and preserve `www` as a CNAME to apex. Once `1c1e52df` validates, re-running `bootstrap` automatically attaches it to CloudFront.

---

## 6. IAM & GitHub Actions Security Review

- **OIDC Authentication:** Uses short-lived web identity tokens issued by GitHub Actions. Zero static AWS keys are used.
- **Trust Policy Scoping:** Scoped to `repo:pragneysh/pragneysh-portfolio:*` with audience `sts.amazonaws.com`.
- **Least-Privilege Resource Scoping:**
  - S3 Actions: `PutObject`, `GetObject`, `ListBucket`, `DeleteObject` restricted to `arn:aws:s3:::pragneyshdekate-portfolio-prod-882248517276` and `/*`.
  - CloudFront Invalidation: `CreateInvalidation`, `GetInvalidation` restricted to `arn:aws:cloudfront::882248517276:distribution/<DISTRIBUTION_ID>`.
  - CloudFront List: `ListDistributions` on `*` *(required by AWS IAM because CloudFront does not support resource-level permissions for list actions; read-only)*.
  - Route 53: **Zero permissions.** The CI/CD role cannot modify DNS records.
  - School Resources: **Zero access.**

---

## 7. Windows Compatibility Review

- **Path Conversion:** Verified that `to_aws_file_url()` in `deploy.sh` invokes `cygpath -m` to translate `/d/Projects/...` to `D:/Projects/...`, allowing native Windows `aws.exe` to parse `file://` and `fileb://` parameters without error.
- **PowerShell Wrapper:** Verified that `deploy.ps1` forwards multi-argument commands cleanly via `$ExtraArgs`.
- **Syntax Validation:** Executed `bash -n deploy.sh` — passed with 0 errors.

---

## 8. Proposed Phased Execution Plan

The execution is strictly partitioned into distinct phases. **DNS cutover is completely decoupled from bootstrap:**

```
Phase A: Local Build Verification (Clean npm build & catalogue audit)
      ↓
Phase B: Infrastructure Bootstrap (Private S3, OAC, CloudFront Function & CDN, IAM OIDC Role)
      ↓
Phase C: Application Deployment & CDN Verification (Sync dist/ with cache headers, test CloudFront URL)
      ↓
Phase D: Targeted Route 53 DNS Cutover (Review dns-plan, execute dns-apply --confirm)
      ↓
Phase E: Nameserver Delegation (Update Hostinger nameservers to Route 53)
```

### Phase A — Local Build Verification
- **Command:** `npm run test:catalogue && npm run build`
- **Expected Result:** Clean production build in `dist/` with 0 catalogue errors.
- **Risk:** None (Local only).

### Phase B — AWS Infrastructure Bootstrap
- **Command:** `.\deploy.ps1 bootstrap`
- **Expected Result:** Private S3 bucket created, CloudFront OAC created, edge SPA function deployed, CloudFront distribution created with active ACM certificate, bucket policy locked, IAM OIDC role provisioned.
- **Risk:** None. Does not touch DNS, nameservers, or school infrastructure.

### Phase C — CloudFront Deployment & Verification
- **Command:** `.\deploy.ps1 deploy`
- **Expected Result:** Static assets uploaded with 1-year immutable cache; HTML uploaded with `must-revalidate`; CloudFront cache invalidated.
- **Verification:** Test the CloudFront domain directly (`https://<distribution-id>.cloudfront.net`). Verify that homepage, `/live-projects`, and `/projects/workly` load with HTTP 200.
- **Risk:** None (Does not affect live traffic on `pragneyshdekate.in`).

### Phase D — Targeted Route 53 DNS Cutover (Separate Step)
- **Step 1 Review:** `.\deploy.ps1 dns-plan`
- **Step 2 Execute:** `.\deploy.ps1 dns-apply --confirm`
- **Expected Result:** Replaces apex parking record `2.57.91.91` with Alias A and AAAA pointing to CloudFront. School records remain untouched.
- **Risk:** Minimal (Requires explicit `--confirm` flag).

### Phase E — Registrar Nameserver Delegation (Manual at HostingR)
- **Action:** Update `pragneyshdekate.in` nameservers in Hostinger to the 4 assigned Route 53 nameservers:
  - `ns-781.awsdns-33.net`
  - `ns-161.awsdns-20.com`
  - `ns-1996.awsdns-57.co.uk`
  - `ns-1099.awsdns-09.org`
- **Expected Result:** Global DNS resolves `pragneyshdekate.in` to Route 53 and CloudFront. School subdomains continue operating uninterrupted.

---

## 9. Rollback Plan

1. **Content Rollback:** Revert local commit, rebuild (`npm run build`), and execute `.\deploy.ps1 deploy`.
2. **DNS Rollback:** Revert Route 53 apex A record to Hostinger parking IP `2.57.91.91` and `www` CNAME to `pragneyshdekate.in`.
3. **Nameserver Rollback:** Change nameservers in Hostinger back to `athena.dns-parking.com` / `apollo.dns-parking.com`.

---

## 10. Critical Risks Assessment

- **Risk 1: Accidental modification of Kudashan School website:** **ELIMINATED.** Verified separate S3 bucket, separate CloudFront distribution, and record preservation in Route 53.
- **Risk 2: Public S3 bucket exposure:** **ELIMINATED.** 100% public access blocked, bucket policy restricted exclusively to CloudFront SourceArn.
- **Risk 3: SSL certificate name mismatch on `www`:** **ELIMINATED.** Verified that `deploy.sh` inspects active aliases and preserves `www` as a CNAME to apex until the dual-SAN certificate is validated and attached.
- **Risk 4: Windows path errors during AWS CLI execution:** **ELIMINATED.** Verified that `to_aws_file_url()` normalizes all file paths using `cygpath -m`.

---

## 11. Final Readiness Verdict

### **SAFE TO PROCEED WITH BOOTSTRAP**

**Rationale:**  
All pre-execution safety validations have passed. The automation script `deploy.sh bootstrap` is idempotent, non-destructive, and strictly isolated from all existing AWS projects. DNS cutover is completely decoupled and will not occur during bootstrap.

---

**Next Command to Execute (Upon Your Explicit Approval):**

```powershell
.\deploy.ps1 bootstrap
```
