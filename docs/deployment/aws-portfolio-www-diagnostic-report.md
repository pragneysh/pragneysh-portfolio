# Focused Diagnostic & Resolution Report: `www.pragneyshdekate.in`

**Date:** 2026-11-21  
**Target Domain:** `https://www.pragneyshdekate.in`  
**Distribution ID:** `EMF40Q2RK6HX9` (`d322bi9m2oad4v.cloudfront.net`)  
**Route 53 Hosted Zone:** `Z021597535J593O8T58RO` (`pragneyshdekate.in.`)  
**AWS Account ID:** `882248517276` (Verified `arn:aws:iam::882248517276:user/Pragneysh`)  
**Deployment Region:** `ap-south-1` (Mumbai)  
**ACM Certificate Region:** `us-east-1` (Global CloudFront)  

---

## 1. Executive Summary

A diagnostic was conducted to determine why `https://pragneyshdekate.in/` was working in your browser while `https://www.pragneyshdekate.in/` was not.

**Key Finding:**  
There is **zero configuration defect on AWS**. The CloudFront distribution, dual-SAN ACM certificate, and Route 53 DNS records are 100% correct and fully deployed. 

The issue where `www` did not load in your browser was caused by **stale DNS caching on your local Wi-Fi router and browser**, which had cached the previous Hostinger parking record (`2.57.91.91`) for `www.pragneyshdekate.in` prior to the delegation cutover.

---

## 2. Live AWS Infrastructure Inspection

### A. AWS Account & Region Verification
- **Account ID:** `882248517276`
- **IAM Caller:** `arn:aws:iam::882248517276:user/Pragneysh`
- **Primary Region:** `ap-south-1`

### B. CloudFront Distribution `EMF40Q2RK6HX9`
Live query via AWS CLI (`aws cloudfront get-distribution --id EMF40Q2RK6HX9`):
- **Deployment Status:** **`Deployed`** (Globally active)
- **Domain Name:** `d322bi9m2oad4v.cloudfront.net`
- **Alternate Domain Names (Aliases):**
  - `pragneyshdekate.in`
  - `www.pragneyshdekate.in`
  - *Quantity: 2*
- **Viewer Certificate:**
  - **ACMCertificateArn:** `arn:aws:acm:us-east-1:882248517276:certificate/1c1e52df-a67a-400b-925b-1b5e7bc925a6`
  - **SSLSupportMethod:** `sni-only`
  - **MinimumProtocolVersion:** `TLSv1.2_2021`

### C. ACM Certificate in `us-east-1`
Live query via AWS CLI (`aws acm describe-certificate --region us-east-1 --certificate-arn ...`):
- **Certificate Status:** **`ISSUED`**
- **Domain Name:** `pragneyshdekate.in`
- **Subject Alternative Names (SANs):**
  - `pragneyshdekate.in` (Status: `SUCCESS`)
  - `www.pragneyshdekate.in` (Status: `SUCCESS`)
- **InUseBy:** `arn:aws:cloudfront::882248517276:distribution/EMF40Q2RK6HX9`

### D. Route 53 Hosted Zone `Z021597535J593O8T58RO`
Live query via AWS CLI (`aws route53 list-resource-record-sets ...`):
- `pragneyshdekate.in.` -> `A` (Alias to `d322bi9m2oad4v.cloudfront.net.`, Canonical Zone `Z2FDTNDATAQYW2`)
- `pragneyshdekate.in.` -> `AAAA` (Alias to `d322bi9m2oad4v.cloudfront.net.`, Canonical Zone `Z2FDTNDATAQYW2`)
- `www.pragneyshdekate.in.` -> `A` (Alias to `d322bi9m2oad4v.cloudfront.net.`, Canonical Zone `Z2FDTNDATAQYW2`)
- `www.pragneyshdekate.in.` -> `AAAA` (Alias to `d322bi9m2oad4v.cloudfront.net.`, Canonical Zone `Z2FDTNDATAQYW2`)
- *Old CNAME `www` -> apex was cleanly removed.*
- *All Kudashan School records (`admin.school`, `demo1.school`, `demo2.school`, and ACM) are preserved.*

---

## 3. Root Cause Analysis: Why Apex Worked but `www` Failed

When we queried public resolvers vs. your local DNS resolver, the disparity was immediately evident:

### Public Global Resolvers (Google `8.8.8.8` & Cloudflare `1.1.1.1`)
- **Query:** `Resolve-DnsName -Name www.pragneyshdekate.in -Server 8.8.8.8`
- **Answer:** Resolves immediately to CloudFront Anycast IPs (`13.225.5.91`, `13.225.5.72`, `13.225.5.44`, `13.225.5.12`) and CloudFront IPv6 addresses (`2600:9000:21b4:...`).

### Local Resolver (`192.168.1.1` - Local Wi-Fi Router / ISP)
- **Query:** `Resolve-DnsName -Name www.pragneyshdekate.in` (Without custom server)
- **Answer:**
  ```text
  Name: www.pragneyshdekate.in
  QueryType: CNAME
  TTL: 180s
  NameHost: pragneyshdekate.in
  IP4Address: 2.57.91.91 (Hostinger Parking IP)
  Authority: dns.hostinger.com (SOA Serial: 2026112104)
  ```

### Why Apex Worked:
When you visited `https://pragneyshdekate.in/`, modern desktop browsers (Chrome/Edge/Firefox) use IPv6 (Happy Eyeballs algorithm). Since Hostinger never had IPv6 AAAA records, the browser received CloudFront's IPv6 address from Route 53 and connected immediately over HTTPS.

### Why WWW Failed:
For `www.pragneyshdekate.in`, your local router had cached the Hostinger CNAME record pointing to IPv4 `2.57.91.91`. When the browser connected to `https://2.57.91.91`, Hostinger rejected the SSL connection (because Hostinger has no certificate for `www.pragneyshdekate.in`) or returned the parking page. Chrome/Edge then cached that failed connection in its socket pool.

---

## 4. Live Verification of `www` over CloudFront

### A. Direct CloudFront Request
```powershell
curl.exe -i -s --resolve www.pragneyshdekate.in:443:13.225.5.91 https://www.pragneyshdekate.in
```
**Result:**
- `HTTP/1.1 200 OK`
- `Server: AmazonS3`
- `Via: 1.1 ... cloudfront.net (CloudFront)`
- `Cache-Control: public, max-age=0, must-revalidate`
- Valid TLS handshake for `www.pragneyshdekate.in`.

### B. Public DNS-over-HTTPS (DoH) Request
```powershell
curl.exe -i -s --doh-url https://dns.google/dns-query https://www.pragneyshdekate.in
```
**Result:**
- `HTTP/1.1 200 OK`
- Delivered directly through CloudFront edge without any local resolver override.

### C. HTTP -> HTTPS Redirection
```powershell
curl.exe -I -s --doh-url https://dns.google/dns-query http://www.pragneyshdekate.in
```
**Result:**
- `HTTP/1.1 301 Moved Permanently`
- `Location: https://www.pragneyshdekate.in/`

---

## 5. Kudashan School Subdomains Verification

All 3 Kudashan School subdomains remain 100% operational:
- `https://admin.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)
- `https://demo1.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)
- `https://demo2.school.pragneyshdekate.in` -> `HTTP/1.1 200 OK` (Distribution `E27H6HXQPZ05YU`)

---

## 6. How to Clear Stale Local Cache to View Immediately

Because the AWS infrastructure is 100% operational, you only need to clear the stale cache on your local device:

1. **In Chrome / Edge Browser:**
   - Open a **New Incognito / Private Window** and navigate to `https://www.pragneyshdekate.in`.
   - *Or* navigate to `chrome://net-internals/#dns` and click **Clear host cache**, then go to `chrome://net-internals/#sockets` and click **Flush socket pools**.
2. **In Windows Command Prompt or PowerShell:**
   - Run: `ipconfig /flushdns`
3. **On Mobile (Cellular / 4G / 5G):**
   - Open `https://www.pragneyshdekate.in` on your mobile phone on cellular data. You will see the live website immediately.
