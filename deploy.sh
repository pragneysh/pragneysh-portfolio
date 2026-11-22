#!/usr/bin/env bash
# ==============================================================================
# AWS Production Deployment Automation for Pragneysh Dekate Portfolio
# Domain: pragneyshdekate.in / www.pragneyshdekate.in
# Architecture: Route 53 -> CloudFront (OAC + Edge Rewrite) -> Private S3
# ==============================================================================
set -euo pipefail

# --- Configuration & Constants ---
readonly EXPECTED_ACCOUNT_ID="882248517276"
readonly AWS_REGION="ap-south-1"
readonly ACM_REGION="us-east-1"
readonly S3_BUCKET="pragneyshdekate-portfolio-prod-882248517276"
readonly TARGET_DOMAIN="pragneyshdekate.in"
readonly TARGET_WWW_DOMAIN="www.pragneyshdekate.in"
readonly OAC_NAME="pragneyshdekate-portfolio-prod-oac"
readonly CF_FUNCTION_NAME="pragneyshdekate-spa-rewrite"
readonly CF_HOSTED_ZONE_ID="Z2FDTNDATAQYW2" # Universal Amazon CloudFront Route 53 Zone ID
readonly GITHUB_REPO="pragneysh/pragneysh-portfolio"
readonly GITHUB_ROLE_NAME="github-actions-portfolio-deploy-role"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SPA_FUNC_FILE="${SCRIPT_DIR}/scripts/spa-rewrite-function.js"

# --- Output Styling ---
CLR_RESET="\033[0m"
CLR_INFO="\033[36m"
CLR_SUCCESS="\033[32m"
CLR_WARN="\033[33m"
CLR_ERROR="\033[31m"
CLR_BOLD="\033[1m"

log_info() { echo -e "${CLR_INFO}[INFO]${CLR_RESET} $*" >&2; }
log_success() { echo -e "${CLR_SUCCESS}[SUCCESS]${CLR_RESET} $*" >&2; }
log_warn() { echo -e "${CLR_WARN}[WARN]${CLR_RESET} $*" >&2; }
log_error() { echo -e "${CLR_ERROR}[ERROR]${CLR_RESET} $*" >&2; }

# Portable path converter for AWS CLI paramfiles (handles Windows/Git Bash/MSYS path mapping)
to_aws_file_url() {
    local prefix="$1" # e.g. "file://" or "fileb://"
    local raw_path="$2"
    if command -v cygpath >/dev/null 2>&1; then
        echo "${prefix}$(cygpath -m "$raw_path")"
    else
        echo "${prefix}${raw_path}"
    fi
}

# --- Safety Validations ---
validate_aws_environment() {
    log_info "Validating AWS CLI installation and credentials..."
    if ! command -v aws >/dev/null 2>&1; then
        log_error "AWS CLI is not installed or not in PATH."
        exit 1
    fi

    local caller_json
    caller_json=$(aws sts get-caller-identity --output json 2>/dev/null || true)
    if [[ -z "$caller_json" ]]; then
        log_error "Failed to retrieve AWS caller identity. Check your credentials."
        exit 1
    fi

    local current_account
    current_account=$(echo "$caller_json" | node -e "let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>console.log(JSON.parse(data).Account))")
    local caller_arn
    caller_arn=$(echo "$caller_json" | node -e "let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>console.log(JSON.parse(data).Arn))")

    if [[ "$current_account" != "$EXPECTED_ACCOUNT_ID" ]]; then
        log_error "Account ID mismatch! Expected: ${EXPECTED_ACCOUNT_ID}, Actual: ${current_account}. ABORTING FOR SAFETY."
        exit 1
    fi

    log_success "AWS Account validated: ${current_account} (Caller: ${caller_arn})"
}

discover_route53_zone() {
    log_info "Discovering Route 53 public hosted zone for ${TARGET_DOMAIN}..."
    local zone_id
    zone_id=$(aws route53 list-hosted-zones --output json | node -e "
        let data='';
        process.stdin.on('data', c=>data+=c);
        process.stdin.on('end', ()=>{
            const zones = JSON.parse(data).HostedZones || [];
            const match = zones.find(z => z.Name === '${TARGET_DOMAIN}.' && !z.Config.PrivateZone);
            if (match) {
                console.log(match.Id.replace('/hostedzone/', ''));
            }
        });
    ")

    if [[ -z "$zone_id" ]]; then
        log_error "Route 53 hosted zone for ${TARGET_DOMAIN} not found! ABORTING."
        exit 1
    fi

    log_success "Discovered Route 53 Hosted Zone ID: ${zone_id}"
    echo "$zone_id"
}

audit_school_subdomain_safety() {
    local zone_id="$1"
    log_info "Auditing existing DNS records in zone ${zone_id} to ensure school subdomains are protected..."
    local records_json
    records_json=$(aws route53 list-resource-record-sets --hosted-zone-id "$zone_id" --output json)

    local school_records_count
    school_records_count=$(echo "$records_json" | node -e "
        let data='';
        process.stdin.on('data', c=>data+=c);
        process.stdin.on('end', ()=>{
            const records = JSON.parse(data).ResourceRecordSets || [];
            const school = records.filter(r => r.Name.includes('school.pragneyshdekate.in'));
            console.log(school.length);
        });
    ")

    if [[ "$school_records_count" -lt 4 ]]; then
        log_warn "Fewer than 4 school DNS records found in Route 53 zone. Verify existing school DNS before proceeding."
    else
        log_success "Found ${school_records_count} protected school records in Route 53. Protection confirmed."
    fi
}

discover_best_acm_certificate() {
    log_info "Discovering ACM certificates in ${ACM_REGION} for ${TARGET_DOMAIN}..."
    local certs_json
    certs_json=$(aws acm list-certificates --region "$ACM_REGION" --certificate-statuses ISSUED --output json)

    local cert_arn
    cert_arn=$(echo "$certs_json" | node -e "
        let data='';
        process.stdin.on('data', c=>data+=c);
        process.stdin.on('end', ()=>{
            const list = JSON.parse(data).CertificateSummaryList || [];
            // Prefer certificate with both apex and www
            const dual = list.find(c => c.DomainName === '${TARGET_DOMAIN}' && (c.SubjectAlternativeNameSummaries || []).includes('${TARGET_WWW_DOMAIN}'));
            if (dual) {
                console.log(dual.CertificateArn);
                return;
            }
            // Fallback to certificate with apex
            const apex = list.find(c => c.DomainName === '${TARGET_DOMAIN}');
            if (apex) {
                console.log(apex.CertificateArn);
                return;
            }
        });
    ")

    if [[ -z "$cert_arn" ]]; then
        log_error "No ISSUED ACM certificate found for ${TARGET_DOMAIN} in ${ACM_REGION}!"
        exit 1
    fi

    log_success "Discovered active ACM Certificate ARN: ${cert_arn}"
    echo "$cert_arn"
}

# --- Subcommands ---

cmd_audit() {
    echo -e "${CLR_BOLD}=== [1/8] AUDITING AWS INFRASTRUCTURE FOR PORTFOLIO DEPLOYMENT ===${CLR_RESET}"
    validate_aws_environment

    local zone_id
    zone_id=$(discover_route53_zone)
    audit_school_subdomain_safety "$zone_id"

    echo ""
    echo -e "${CLR_BOLD}=== [2/8] AUDITING S3 BUCKET ===${CLR_RESET}"
    if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
        log_success "S3 Bucket ${S3_BUCKET} exists."
    else
        log_info "S3 Bucket ${S3_BUCKET} does not exist yet (will be created during bootstrap)."
    fi

    echo ""
    echo -e "${CLR_BOLD}=== [3/8] AUDITING CLOUDFRONT OAC ===${CLR_RESET}"
    local oac_id
    oac_id=$(aws cloudfront list-origin-access-controls --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).OriginAccessControlList || {}).Items || [];
            const match = items.find(i => i.Name === '${OAC_NAME}');
            if (match) console.log(match.Id);
        });
    ")
    if [[ -n "$oac_id" ]]; then
        log_success "CloudFront OAC exists: ${oac_id}"
    else
        log_info "CloudFront OAC ${OAC_NAME} does not exist yet."
    fi

    echo ""
    echo -e "${CLR_BOLD}=== [4/8] AUDITING CLOUDFRONT FUNCTION ===${CLR_RESET}"
    if aws cloudfront describe-function --name "$CF_FUNCTION_NAME" --stage LIVE >/dev/null 2>&1; then
        log_success "CloudFront Function ${CF_FUNCTION_NAME} exists in LIVE stage."
    else
        log_info "CloudFront Function ${CF_FUNCTION_NAME} does not exist yet."
    fi

    echo ""
    echo -e "${CLR_BOLD}=== [5/8] AUDITING ACM CERTIFICATES ===${CLR_RESET}"
    local cert_arn
    cert_arn=$(discover_best_acm_certificate)

    echo ""
    echo -e "${CLR_BOLD}=== [6/8] AUDITING PORTFOLIO CLOUDFRONT DISTRIBUTION ===${CLR_RESET}"
    local dist_id
    dist_id=$(aws cloudfront list-distributions --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).DistributionList || {}).Items || [];
            const match = items.find(d => {
                const origins = (d.Origins || {}).Items || [];
                return origins.some(o => o.DomainName && o.DomainName.includes('${S3_BUCKET}'));
            });
            if (match) console.log(match.Id);
        });
    ")
    if [[ -n "$dist_id" ]]; then
        log_success "Portfolio CloudFront Distribution exists: ${dist_id}"
    else
        log_info "No CloudFront Distribution found linked to S3 origin ${S3_BUCKET}."
    fi

    echo ""
    echo -e "${CLR_BOLD}=== [7/8] AUDITING GITHUB ACTIONS OIDC & IAM ROLE ===${CLR_RESET}"
    local oidc_arn="arn:aws:iam::${EXPECTED_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
    if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$oidc_arn" >/dev/null 2>&1; then
        log_success "GitHub Actions OIDC Provider exists: ${oidc_arn}"
    else
        log_info "GitHub Actions OIDC Provider does not exist yet."
    fi

    if aws iam get-role --role-name "$GITHUB_ROLE_NAME" >/dev/null 2>&1; then
        log_success "Deployment IAM Role exists: ${GITHUB_ROLE_NAME}"
    else
        log_info "Deployment IAM Role ${GITHUB_ROLE_NAME} does not exist yet."
    fi

    echo ""
    echo -e "${CLR_BOLD}=== [8/8] AUDIT SUMMARY ===${CLR_RESET}"
    log_success "Audit completed safely without making modifications."
}

cmd_bootstrap() {
    echo -e "${CLR_BOLD}=== INITIATING SAFE PORTFOLIO INFRASTRUCTURE BOOTSTRAP ===${CLR_RESET}"
    validate_aws_environment

    local zone_id
    zone_id=$(discover_route53_zone)
    audit_school_subdomain_safety "$zone_id"

    local cert_arn
    cert_arn=$(discover_best_acm_certificate)

    # 1. S3 Bucket
    log_info "Step 1: Ensuring private S3 bucket exists: ${S3_BUCKET} in ${AWS_REGION}..."
    if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
        aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
        log_success "Created S3 bucket: ${S3_BUCKET}"
    else
        log_info "S3 bucket already exists."
    fi

    log_info "Enforcing 100% Block Public Access on ${S3_BUCKET}..."
    aws s3api put-public-access-block \
        --bucket "$S3_BUCKET" \
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    log_info "Setting Object Ownership to BucketOwnerEnforced..."
    aws s3api put-bucket-ownership-controls \
        --bucket "$S3_BUCKET" \
        --ownership-controls="Rules=[{ObjectOwnership=BucketOwnerEnforced}]"

    log_info "Enabling SSE-S3 default AES256 encryption..."
    aws s3api put-bucket-encryption \
        --bucket "$S3_BUCKET" \
        --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

    log_success "S3 Bucket is secure, encrypted, and 100% private."

    # 2. CloudFront OAC
    log_info "Step 2: Ensuring CloudFront Origin Access Control (OAC) exists..."
    local oac_id
    oac_id=$(aws cloudfront list-origin-access-controls --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).OriginAccessControlList || {}).Items || [];
            const match = items.find(i => i.Name === '${OAC_NAME}');
            if (match) console.log(match.Id);
        });
    ")

    if [[ -z "$oac_id" ]]; then
        local oac_create_res
        oac_create_res=$(aws cloudfront create-origin-access-control \
            --origin-access-control-config "Name=${OAC_NAME},Description=OAC for portfolio private S3 bucket,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
            --output json)
        oac_id=$(echo "$oac_create_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).OriginAccessControl.Id))")
        log_success "Created CloudFront OAC: ${oac_id}"
    else
        log_info "Reusing existing CloudFront OAC: ${oac_id}"
    fi

    # 3. CloudFront Function for SPA Rewrite
    log_info "Step 3: Ensuring CloudFront Function for React Router SPA rewrite exists..."
    if [[ ! -f "$SPA_FUNC_FILE" ]]; then
        log_error "CloudFront function source file not found at ${SPA_FUNC_FILE}"
        exit 1
    fi

    local fn_arn
    if aws cloudfront describe-function --name "$CF_FUNCTION_NAME" >/dev/null 2>&1; then
        log_info "Updating CloudFront Function ${CF_FUNCTION_NAME}..."
        local etag
        etag=$(aws cloudfront describe-function --name "$CF_FUNCTION_NAME" --output json | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).ETag))")
        local update_res
        update_res=$(aws cloudfront update-function \
            --name "$CF_FUNCTION_NAME" \
            --if-match "$etag" \
            --function-config "Comment=React Router SPA rewrite,Runtime=cloudfront-js-2.0" \
            --function-code "$(to_aws_file_url "fileb://" "$SPA_FUNC_FILE")" \
            --output json)
        etag=$(echo "$update_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).ETag))")
        aws cloudfront publish-function --name "$CF_FUNCTION_NAME" --if-match "$etag" >/dev/null
        fn_arn=$(echo "$update_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).FunctionSummary.FunctionMetadata.FunctionARN))")
        log_success "Updated and published CloudFront Function: ${fn_arn}"
    else
        log_info "Creating CloudFront Function ${CF_FUNCTION_NAME}..."
        local create_res
        create_res=$(aws cloudfront create-function \
            --name "$CF_FUNCTION_NAME" \
            --function-config "Comment=React Router SPA rewrite,Runtime=cloudfront-js-2.0" \
            --function-code "$(to_aws_file_url "fileb://" "$SPA_FUNC_FILE")" \
            --output json)
        local etag
        etag=$(echo "$create_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).ETag))")
        aws cloudfront publish-function --name "$CF_FUNCTION_NAME" --if-match "$etag" >/dev/null
        fn_arn=$(echo "$create_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).FunctionSummary.FunctionMetadata.FunctionARN))")
        log_success "Created and published CloudFront Function: ${fn_arn}"
    fi

    # 4. CloudFront Distribution
    log_info "Step 4: Ensuring CloudFront Distribution exists..."
    local dist_id
    dist_id=$(aws cloudfront list-distributions --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).DistributionList || {}).Items || [];
            const match = items.find(d => {
                const origins = (d.Origins || {}).Items || [];
                return origins.some(o => o.DomainName && o.DomainName.includes('${S3_BUCKET}'));
            });
            if (match) console.log(match.Id);
        });
    ")

    # Determine aliases supported by certificate
    local cert_desc
    cert_desc=$(aws acm describe-certificate --certificate-arn "$cert_arn" --region "$ACM_REGION" --output json)
    local has_www
    has_www=$(echo "$cert_desc" | node -e "
        let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>{
            const sans = JSON.parse(d).Certificate.SubjectAlternativeNames || [];
            console.log(sans.includes('${TARGET_WWW_DOMAIN}') ? 'true' : 'false');
        });
    ")

    local aliases_json
    if [[ "$has_www" == "true" ]]; then
        aliases_json="{\"Quantity\": 2, \"Items\": [\"${TARGET_DOMAIN}\", \"${TARGET_WWW_DOMAIN}\"]}"
    else
        aliases_json="{\"Quantity\": 1, \"Items\": [\"${TARGET_DOMAIN}\"]}"
        log_warn "Certificate covers ${TARGET_DOMAIN} only. Using single alias initially; www can be added once certificate validates."
    fi

    local dist_domain=""
    if [[ -z "$dist_id" ]]; then
        log_info "Creating new CloudFront Distribution for ${S3_BUCKET}..."
        local dist_config_file="${SCRIPT_DIR}/scripts/cf-dist-config.json"
        cat <<EOF > "$dist_config_file"
{
  "CallerReference": "portfolio-bootstrap-$(date +%s)",
  "Aliases": ${aliases_json},
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
        "OriginPath": "",
        "CustomHeaders": { "Quantity": 0 },
        "S3OriginConfig": { "OriginAccessIdentity": "" },
        "OriginAccessControlId": "${oac_id}"
      }
    ]
  },
  "OriginGroups": { "Quantity": 0 },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "TrustedKeyGroups": { "Enabled": false, "Quantity": 0 },
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": { "Quantity": 0 },
    "FunctionAssociations": {
      "Quantity": 1,
      "Items": [
        {
          "FunctionARN": "${fn_arn}",
          "EventType": "viewer-request"
        }
      ]
    },
    "FieldLevelEncryptionId": "",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CacheBehaviors": { "Quantity": 0 },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  },
  "Comment": "Pragneysh Dekate Portfolio Production CDN",
  "Logging": {
    "Enabled": false,
    "IncludeCookies": false,
    "Bucket": "",
    "Prefix": ""
  },
  "PriceClass": "PriceClass_All",
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "${cert_arn}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "Certificate": "${cert_arn}",
    "CertificateSource": "acm"
  },
  "Restrictions": {
    "GeoRestriction": {
      "RestrictionType": "none",
      "Quantity": 0
    }
  },
  "WebACLId": "",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "ContinuousDeploymentPolicyId": "",
  "Staging": false
}
EOF

        local create_dist_res
        create_dist_res=$(aws cloudfront create-distribution --distribution-config "$(to_aws_file_url "file://" "$dist_config_file")" --output json)
        rm -f "$dist_config_file"
        dist_id=$(echo "$create_dist_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).Distribution.Id))")
        dist_domain=$(echo "$create_dist_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).Distribution.DomainName))")
        log_success "Created CloudFront Distribution: ${dist_id} (${dist_domain})"
    else
        dist_domain=$(aws cloudfront get-distribution --id "$dist_id" --output json | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).Distribution.DomainName))")
        log_info "Reusing existing CloudFront Distribution: ${dist_id} (${dist_domain})"

        # Check if existing distribution needs alias/certificate upgrade when dual-SAN certificate becomes available
        local current_has_www
        current_has_www=$(aws cloudfront get-distribution-config --id "$dist_id" --output json | node -e "
            let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>{
                const items = (JSON.parse(d).DistributionConfig.Aliases || {}).Items || [];
                console.log(items.includes('${TARGET_WWW_DOMAIN}') ? 'true' : 'false');
            });
        ")
        if [[ "$has_www" == "true" && "$current_has_www" == "false" ]]; then
            log_info "Upgrading CloudFront distribution ${dist_id} to attach dual-SAN certificate and alias ${TARGET_WWW_DOMAIN}..."
            local dist_cfg_json
            dist_cfg_json=$(aws cloudfront get-distribution-config --id "$dist_id" --output json)
            local dist_etag
            dist_etag=$(echo "$dist_cfg_json" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).ETag))")
            local updated_cfg
            updated_cfg=$(echo "$dist_cfg_json" | node -e "
                let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>{
                    const cfg = JSON.parse(d).DistributionConfig;
                    cfg.Aliases = ${aliases_json};
                    cfg.ViewerCertificate = {
                        ACMCertificateArn: '${cert_arn}',
                        SSLSupportMethod: 'sni-only',
                        MinimumProtocolVersion: 'TLSv1.2_2021',
                        Certificate: '${cert_arn}',
                        CertificateSource: 'acm'
                    };
                    console.log(JSON.stringify(cfg, null, 2));
                });
            ")
            local updated_cfg_file="${SCRIPT_DIR}/scripts/cf-dist-upgrade-config.json"
            echo "$updated_cfg" > "$updated_cfg_file"
            aws cloudfront update-distribution \
                --id "$dist_id" \
                --if-match "$dist_etag" \
                --distribution-config "$(to_aws_file_url "file://" "$updated_cfg_file")" >/dev/null
            rm -f "$updated_cfg_file"
            log_success "CloudFront distribution upgraded with dual-SAN certificate and www alias."
        fi
    fi

    # 5. S3 Bucket Policy (Locked to CloudFront SourceArn)
    log_info "Step 5: Applying locked bucket policy on ${S3_BUCKET} for CloudFront distribution ${dist_id}..."
    local policy_file="${SCRIPT_DIR}/scripts/s3-bucket-policy.json"
    cat <<EOF > "$policy_file"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${EXPECTED_ACCOUNT_ID}:distribution/${dist_id}"
        }
      }
    },
    {
      "Sid": "AllowCloudFrontListBucket",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::${S3_BUCKET}",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${EXPECTED_ACCOUNT_ID}:distribution/${dist_id}"
        }
      }
    }
  ]
}
EOF
    aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy "$(to_aws_file_url "file://" "$policy_file")"
    rm -f "$policy_file"
    log_success "S3 Bucket policy applied. Access is restricted exclusively to CloudFront distribution ${dist_id}."

    # 6. GitHub Actions OIDC & Least-Privilege IAM Role
    log_info "Step 6: Setting up GitHub Actions OIDC provider and least-privilege deployment role..."
    local oidc_arn="arn:aws:iam::${EXPECTED_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
    if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$oidc_arn" >/dev/null 2>&1; then
        aws iam create-open-id-connect-provider \
            --url "https://token.actions.githubusercontent.com" \
            --client-id-list "sts.amazonaws.com" \
            --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c5876a9793e2b7b7be10c37f4e9f1b777a83d46" >/dev/null
        log_success "Created GitHub Actions IAM OIDC Provider."
    else
        log_info "GitHub Actions IAM OIDC Provider already exists."
    fi

    local trust_policy_file="${SCRIPT_DIR}/scripts/github-oidc-trust-policy.json"
    cat <<EOF > "$trust_policy_file"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "${oidc_arn}"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO}:*"
        }
      }
    }
  ]
}
EOF

    if ! aws iam get-role --role-name "$GITHUB_ROLE_NAME" >/dev/null 2>&1; then
        aws iam create-role \
            --role-name "$GITHUB_ROLE_NAME" \
            --assume-role-policy-document "$(to_aws_file_url "file://" "$trust_policy_file")" \
            --description "GitHub Actions deployment role for ${GITHUB_REPO}" >/dev/null
        log_success "Created IAM Role: ${GITHUB_ROLE_NAME}"
    else
        aws iam update-assume-role-policy \
            --role-name "$GITHUB_ROLE_NAME" \
            --policy-document "$(to_aws_file_url "file://" "$trust_policy_file")" >/dev/null
        log_info "Updated trust policy for IAM Role: ${GITHUB_ROLE_NAME}"
    fi
    rm -f "$trust_policy_file"

    local deploy_policy_file="${SCRIPT_DIR}/scripts/github-deploy-permissions.json"
    cat <<EOF > "$deploy_policy_file"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3PortfolioDeployPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::${S3_BUCKET}",
        "arn:aws:s3:::${S3_BUCKET}/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidationPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::${EXPECTED_ACCOUNT_ID}:distribution/${dist_id}"
    },
    {
      "Sid": "CloudFrontListDistributionsForDiscovery",
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    aws iam put-role-policy \
        --role-name "$GITHUB_ROLE_NAME" \
        --policy-name "PortfolioDeployPolicy" \
        --policy-document "$(to_aws_file_url "file://" "$deploy_policy_file")"
    rm -f "$deploy_policy_file"
    log_success "Attached scoped least-privilege policy to ${GITHUB_ROLE_NAME}."

    echo ""
    echo -e "${CLR_BOLD}=== BOOTSTRAP COMPLETE ===${CLR_RESET}"
    echo "S3 Bucket:             ${S3_BUCKET}"
    echo "CloudFront OAC:        ${oac_id}"
    echo "CloudFront Function:   ${CF_FUNCTION_NAME}"
    echo "Distribution ID:       ${dist_id}"
    echo "Distribution Domain:   ${dist_domain}"
    echo "IAM Deployment Role:   arn:aws:iam::${EXPECTED_ACCOUNT_ID}:role/${GITHUB_ROLE_NAME}"
    echo ""
    log_warn "NOTE: DNS records were NOT modified. To view or apply Route 53 changes:"
    echo "  ./deploy.sh dns-plan"
    echo "  ./deploy.sh dns-apply --confirm"
}

cmd_deploy() {
    echo -e "${CLR_BOLD}=== DEPLOYING APPLICATION BUILD TO S3 + CLOUDFRONT ===${CLR_RESET}"
    validate_aws_environment

    if [[ ! -d "${SCRIPT_DIR}/dist" || ! -f "${SCRIPT_DIR}/dist/index.html" ]]; then
        log_info "Running local production build (npm run build)..."
        npm run build
    else
        log_info "Verified existing production build in dist/."
    fi

    log_info "Step 1: Uploading hashed static assets to ${S3_BUCKET} with 1-year immutable caching..."
    aws s3 sync "${SCRIPT_DIR}/dist/assets" "s3://${S3_BUCKET}/assets" \
        --cache-control "public, max-age=31536000, immutable"

    log_info "Step 2: Uploading HTML, metadata, and root assets with must-revalidate caching..."
    aws s3 sync "${SCRIPT_DIR}/dist" "s3://${S3_BUCKET}" \
        --exclude "assets/*" \
        --cache-control "public, max-age=0, must-revalidate" \
        --delete

    log_success "Files synchronized to S3 successfully."

    cmd_invalidate
}

cmd_invalidate() {
    log_info "Looking up CloudFront Distribution ID for ${S3_BUCKET}..."
    local dist_id
    dist_id=$(aws cloudfront list-distributions --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).DistributionList || {}).Items || [];
            const match = items.find(d => {
                const origins = (d.Origins || {}).Items || [];
                return origins.some(o => o.DomainName && o.DomainName.includes('${S3_BUCKET}'));
            });
            if (match) console.log(match.Id);
        });
    ")

    if [[ -z "$dist_id" ]]; then
        log_error "CloudFront distribution for ${S3_BUCKET} not found. Cannot invalidate."
        exit 1
    fi

    log_info "Invalidating CloudFront cache for distribution ${dist_id} (/*)..."
    local inv_res
    inv_res=$(aws cloudfront create-invalidation --distribution-id "$dist_id" --paths "/*" --output json)
    local inv_id
    inv_id=$(echo "$inv_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).Invalidation.Id))")
    log_success "CloudFront invalidation initiated: ${inv_id}"
}

cmd_dns_plan() {
    echo -e "${CLR_BOLD}=== ROUTE 53 DNS CUTOVER PLAN ===${CLR_RESET}"
    validate_aws_environment

    local zone_id
    zone_id=$(discover_route53_zone)
    audit_school_subdomain_safety "$zone_id"

    local dist_meta
    dist_meta=$(aws cloudfront list-distributions --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).DistributionList || {}).Items || [];
            const match = items.find(d => {
                const origins = (d.Origins || {}).Items || [];
                return origins.some(o => o.DomainName && (o.DomainName === '${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com' || o.DomainName.includes('${S3_BUCKET}')));
            });
            if (match) {
                const aliases = (match.Aliases || {}).Items || [];
                console.log(JSON.stringify({ domain: match.DomainName, aliases: aliases }));
            }
        });
    ")

    if [[ -z "$dist_meta" ]]; then
        log_error "Portfolio CloudFront distribution not found. Run ./deploy.sh bootstrap first."
        exit 1
    fi

    local dist_domain
    dist_domain=$(echo "$dist_meta" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).domain))")
    local dist_has_www
    dist_has_www=$(echo "$dist_meta" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>{ const a = JSON.parse(d).aliases || []; console.log(a.includes('${TARGET_WWW_DOMAIN}') ? 'true' : 'false'); })")

    echo ""
    echo "Target CloudFront Distribution Domain: ${dist_domain}"
    echo "CloudFront Canonical Hosted Zone ID:  ${CF_HOSTED_ZONE_ID}"
    echo ""
    echo "Planned targeted Route 53 changes for ${TARGET_DOMAIN}:"
    echo "  1. UPSERT A Alias for '${TARGET_DOMAIN}.' -> ${dist_domain} (Replaces current 2.57.91.91)"
    echo "  2. UPSERT AAAA Alias for '${TARGET_DOMAIN}.' -> ${dist_domain} (IPv6 Support)"

    if [[ "$dist_has_www" == "true" ]]; then
        echo "  3. DELETE CNAME '${TARGET_WWW_DOMAIN}.' -> ${TARGET_DOMAIN} (if existing)"
        echo "  4. UPSERT A Alias for '${TARGET_WWW_DOMAIN}.' -> ${dist_domain}"
        echo "  5. UPSERT AAAA Alias for '${TARGET_WWW_DOMAIN}.' -> ${dist_domain}"
    else
        echo ""
        log_warn "NOTICE (M1 Protection): CloudFront distribution currently has alias for '${TARGET_DOMAIN}' only."
        log_warn "'${TARGET_WWW_DOMAIN}' will NOT be aliased to CloudFront yet to prevent SSL certificate name mismatch."
        log_warn "Existing www CNAME to apex will be preserved until the dual-SAN certificate is validated and bootstrap is re-run."
    fi
    echo ""
    log_success "School subdomains (admin.school, demo1.school, demo2.school, ACM) will remain UNTOUCHED."
    echo ""
    echo "To execute these changes, run:"
    echo "  ./deploy.sh dns-apply --confirm"
}

cmd_dns_apply() {
    if [[ "${1:-}" != "--confirm" ]]; then
        log_error "Execution requires explicit confirmation flag: ./deploy.sh dns-apply --confirm"
        exit 1
    fi

    echo -e "${CLR_BOLD}=== APPLYING TARGETED ROUTE 53 DNS CHANGES ===${CLR_RESET}"
    validate_aws_environment

    local zone_id
    zone_id=$(discover_route53_zone)
    audit_school_subdomain_safety "$zone_id"

    local dist_meta
    dist_meta=$(aws cloudfront list-distributions --output json | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const items = (JSON.parse(data).DistributionList || {}).Items || [];
            const match = items.find(d => {
                const origins = (d.Origins || {}).Items || [];
                return origins.some(o => o.DomainName && (o.DomainName === '${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com' || o.DomainName.includes('${S3_BUCKET}')));
            });
            if (match) {
                const aliases = (match.Aliases || {}).Items || [];
                console.log(JSON.stringify({ domain: match.DomainName, aliases: aliases }));
            }
        });
    ")

    if [[ -z "$dist_meta" ]]; then
        log_error "Portfolio CloudFront distribution not found. Run ./deploy.sh bootstrap first."
        exit 1
    fi

    local dist_domain
    dist_domain=$(echo "$dist_meta" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).domain))")
    local dist_has_www
    dist_has_www=$(echo "$dist_meta" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>{ const a = JSON.parse(d).aliases || []; console.log(a.includes('${TARGET_WWW_DOMAIN}') ? 'true' : 'false'); })")

    # Check if www is currently a CNAME
    local records_json
    records_json=$(aws route53 list-resource-record-sets --hosted-zone-id "$zone_id" --output json)
    local www_is_cname
    www_is_cname=$(echo "$records_json" | node -e "
        let data=''; process.stdin.on('data', c=>data+=c); process.stdin.on('end', ()=>{
            const r = JSON.parse(data).ResourceRecordSets || [];
            const match = r.find(x => x.Name === '${TARGET_WWW_DOMAIN}.' && x.Type === 'CNAME');
            console.log(match ? 'true' : 'false');
        });
    ")

    local changes="[]"
    if [[ "$dist_has_www" == "true" ]]; then
        if [[ "$www_is_cname" == "true" ]]; then
            changes=$(node -e "
                const c = [
                    {
                        Action: 'DELETE',
                        ResourceRecordSet: {
                            Name: '${TARGET_WWW_DOMAIN}.',
                            Type: 'CNAME',
                            TTL: 300,
                            ResourceRecords: [{ Value: '${TARGET_DOMAIN}' }]
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_DOMAIN}.',
                            Type: 'A',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_DOMAIN}.',
                            Type: 'AAAA',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_WWW_DOMAIN}.',
                            Type: 'A',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_WWW_DOMAIN}.',
                            Type: 'AAAA',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    }
                ];
                console.log(JSON.stringify({ Changes: c }, null, 2));
            ")
        else
            changes=$(node -e "
                const c = [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_DOMAIN}.',
                            Type: 'A',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_DOMAIN}.',
                            Type: 'AAAA',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_WWW_DOMAIN}.',
                            Type: 'A',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    },
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name: '${TARGET_WWW_DOMAIN}.',
                            Type: 'AAAA',
                            AliasTarget: {
                                HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                                DNSName: '${dist_domain}.',
                                EvaluateTargetHealth: false
                            }
                        }
                    }
                ];
                console.log(JSON.stringify({ Changes: c }, null, 2));
            ")
        fi
    else
        log_warn "M1 Protection: Aliasing only apex '${TARGET_DOMAIN}' to CloudFront. Preserving existing www configuration."
        changes=$(node -e "
            const c = [
                {
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                        Name: '${TARGET_DOMAIN}.',
                        Type: 'A',
                        AliasTarget: {
                            HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                            DNSName: '${dist_domain}.',
                            EvaluateTargetHealth: false
                        }
                    }
                },
                {
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                        Name: '${TARGET_DOMAIN}.',
                        Type: 'AAAA',
                        AliasTarget: {
                            HostedZoneId: '${CF_HOSTED_ZONE_ID}',
                            DNSName: '${dist_domain}.',
                            EvaluateTargetHealth: false
                        }
                    }
                }
            ];
            console.log(JSON.stringify({ Changes: c }, null, 2));
        ")
    fi

    local change_batch_file="${SCRIPT_DIR}/scripts/dns-change-batch.json"
    echo "$changes" > "$change_batch_file"

    log_info "Executing targeted Route 53 ChangeResourceRecordSets..."
    local change_res
    change_res=$(aws route53 change-resource-record-sets --hosted-zone-id "$zone_id" --change-batch "$(to_aws_file_url "file://" "$change_batch_file")" --output json)
    rm -f "$change_batch_file"

    local change_id
    change_id=$(echo "$change_res" | node -e "let d=''; process.stdin.on('data', c=>d+=c); process.stdin.on('end', ()=>console.log(JSON.parse(d).ChangeInfo.Id))")
    log_success "Route 53 change submitted successfully: ${change_id}"
}

cmd_rollback_info() {
    echo -e "${CLR_BOLD}=== DISASTER RECOVERY & ROLLBACK GUIDE ===${CLR_RESET}"
    echo "1. Application Content Rollback:"
    echo "   If a bad build is deployed to S3:"
    echo "   a) Check out the last known good Git commit."
    echo "   b) Run: npm run build"
    echo "   c) Run: ./deploy.sh deploy"
    echo "   CloudFront cache invalidation will flush old assets immediately."
    echo ""
    echo "2. DNS Rollback:"
    echo "   If you need to quickly revert DNS back to the previous Hostinger parking server:"
    echo "   Run the following targeted Route 53 rollback batch:"
    echo "   - Revert 'pragneyshdekate.in.' A record to: 2.57.91.91 (TTL 300)"
    echo "   - Revert 'www.pragneyshdekate.in.' CNAME to: pragneyshdekate.in (TTL 300)"
    echo "   - Remove apex AAAA Alias and www AAAA Alias"
    echo "   All school records (admin.school, demo1.school, etc.) will remain completely untouched."
    echo ""
    echo "3. Nameserver Rollback (Registrar Level):"
    echo "   If nameserver delegation needs to be reverted at HostingR (Hostinger):"
    echo "   Change nameservers back to: athena.dns-parking.com / apollo.dns-parking.com"
}

# --- Main Dispatcher ---
main() {
    local cmd="${1:-help}"
    case "$cmd" in
        audit)         cmd_audit ;;
        bootstrap)     cmd_bootstrap ;;
        deploy)        cmd_deploy ;;
        invalidate)    cmd_invalidate ;;
        dns-plan)      cmd_dns_plan ;;
        dns-apply)     shift; cmd_dns_apply "$@" ;;
        rollback-info) cmd_rollback_info ;;
        *)
            echo "Usage: ./deploy.sh <command>"
            echo "Commands:"
            echo "  audit          - Audit existing AWS infrastructure and safety constraints"
            echo "  bootstrap      - Provision private S3, CloudFront OAC, SPA function, distribution & OIDC"
            echo "  deploy         - Build project, sync to S3 with cache headers, and invalidate CloudFront"
            echo "  invalidate     - Create CloudFront invalidation for /*"
            echo "  dns-plan       - Display planned targeted Route 53 changes"
            echo "  dns-apply      - Apply targeted Route 53 changes (requires --confirm)"
            echo "  rollback-info  - Display application and DNS rollback procedures"
            exit 1
            ;;
    esac
}

main "$@"
