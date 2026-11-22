import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Shield,
  Server,
  Database,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Cpu,
  Cloud,
  FileCode,
  Workflow,
  Radio,
} from "lucide-react";
import "./ArchitectureShowcase.css";

const SYSTEMS = [
  {
    id: "serverless-leave-system",
    slug: "leavesmanagement",
    title: "AWS Serverless Leave Management Architecture",
    tagline: "Serverless YAML IaC · API Gateway · Lambda · DynamoDB",
    badge: "AWS Serverless Production Architecture",
    description:
      "A cloud-native, production-grade serverless architecture engineered on AWS. Deployed with Serverless Framework YAML-based Infrastructure as Code, featuring role-based multi-level approval hierarchies, event-driven state transitions, and single-table DynamoDB storage.",
    metrics: [
      { label: "Infrastructure", value: "100% Serverless" },
      { label: "IaC Model", value: "Serverless YAML" },
      { label: "Compute", value: "AWS Lambda" },
      { label: "Database", value: "DynamoDB (PITR)" },
    ],
    layers: [
      {
        num: "01",
        name: "Client & Edge Delivery Tier",
        icon: Globe,
        color: "blue",
        summary: "Responsive React frontend hosted on S3 and distributed globally through CloudFront edge locations",
        components: [
          { name: "React 18 SPA (Vite)", desc: "Role-scoped employee self-service and manager approval interfaces" },
          { name: "Amazon CloudFront CDN", desc: "Global edge caching with automated HTTPS/TLS termination via ACM" },
          { name: "Amazon S3 Static Bucket", desc: "Origin storage protected by CloudFront Origin Access Control (OAC)" },
        ],
        connectorText: "Secure HTTPS · Global CDN Edge Routing",
      },
      {
        num: "02",
        name: "API Gateway & Edge Security Tier",
        icon: Shield,
        color: "green",
        summary: "Lightweight HTTP/REST endpoints with JWT token validation and payload schemas",
        components: [
          { name: "Amazon API Gateway", desc: "Managed REST/HTTP APIs with path routing, rate limiting, and CORS" },
          { name: "JWT Lambda Authorizer", desc: "Stateless cryptographic token validation verifying user roles" },
          { name: "AWS IAM Security Roles", desc: "Least-privilege execution roles granting explicit Lambda permissions" },
        ],
        connectorText: "Validated JWT Claims · Event Ingestion",
      },
      {
        num: "03",
        name: "Compute & Serverless Logic Tier",
        icon: Cpu,
        color: "orange",
        summary: "On-demand AWS Lambda microservices executing NestJS business logic and approval state machines",
        components: [
          { name: "AWS Lambda Functions", desc: "Autoscaling event-driven compute with zero idle server cost" },
          { name: "NestJS Microservices", desc: "Modular domain logic handling multi-level leave approvals" },
          { name: "Notification Dispatcher", desc: "Automated status notification alerts across approval lifecycles" },
          { name: "Serverless Framework IaC", desc: "Declarative YAML infrastructure defining functions, events, and resources" },
        ],
        connectorText: "Encrypted AWS Backbone · Sub-Second Latency",
      },
      {
        num: "04",
        name: "Database & Persistence Tier",
        icon: Database,
        color: "purple",
        summary: "High-throughput serverless NoSQL storage with continuous data protection",
        components: [
          { name: "Amazon DynamoDB", desc: "Single-table design storing employee profiles, leave balances & requests" },
          { name: "Point-in-Time Recovery", desc: "Continuous PITR backups ensuring immutable audit trails" },
          { name: "AWS KMS Encryption", desc: "Hardware-grade encryption at rest with automated key rotation" },
        ],
        connectorText: null,
      },
    ],
    highlights: [
      "Zero dedicated server management: costs scale down to zero when idle and scale automatically under load.",
      "Strict least-privilege IAM policies ensure each Lambda function accesses only its designated DynamoDB tables.",
      "Declarative Serverless YAML templates allow reproducible, one-command infrastructure deployments.",
      "Point-in-Time Recovery (PITR) guarantees full data recovery and historical compliance for all approval actions.",
    ],
  },
  {
    id: "aws-control-center",
    slug: "aws-control-center",
    title: "AWS Multi-Region Governance Architecture",
    tagline: "17-Region Inventory · 4-Tier Disaster Recovery · Cryptographic Backups",
    badge: "Cloud Infrastructure & Disaster Recovery",
    description:
      "A centralized cloud management and backup audit framework scanning infrastructure across 17 active AWS regions, monitoring 33 Lambda functions across eight audited workloads, 28 databases, and 23 storage vaults to safeguard enterprise assets.",
    metrics: [
      { label: "Audit Coverage", value: "17 AWS Regions" },
      { label: "Discovered Workloads", value: "33 Functions / 8 Workloads" },
      { label: "DR Framework", value: "4-Tier Standard" },
      { label: "Archive Encryption", value: "AES-256 + SHA Hashes" },
    ],
    layers: [
      {
        num: "01",
        name: "Multi-Region Inventory & Discovery Tier",
        icon: Cloud,
        color: "blue",
        summary: "Automated parallel scanning auditing 17 active AWS cloud regions",
        components: [
          { name: "17 AWS Cloud Regions", desc: "Parallel multi-region inventory and resource discovery scanners" },
          { name: "7 Amazon API Gateways", desc: "116 REST/HTTP route definitions mapped and audited for CORS & auth" },
          { name: "IAM Security Inspector", desc: "Cross-account role delegation and policy compliance validation" },
        ],
        connectorText: "Cross-Region SDK Calls · Secure IAM Delegation",
      },
      {
        num: "02",
        name: "Audit Engine & Workload Inventory Tier",
        icon: Cpu,
        color: "green",
        summary: "Automated checks for security policies and workload configurations",
        components: [
          { name: "Audit Engine", desc: "Automated scanner evaluating cross-region drift and compliance" },
          { name: "33 Discovered Functions", desc: "33 Lambda functions discovered across eight audited workloads" },
          { name: "S3 Security Inspection", desc: "Exposure checks across 23 buckets for public access & encryption" },
        ],
        connectorText: "Audit Telemetry Stream · Automated Validation",
      },
      {
        num: "03",
        name: "4-Tier Disaster Recovery Matrix",
        icon: Workflow,
        color: "orange",
        summary: "Structured backup classification framework defining recovery schedules",
        components: [
          { name: "Tier 1: Critical", desc: "Real-time continuous replication and DynamoDB PITR" },
          { name: "Tier 2: Production", desc: "Automated daily snapshot schedules with retention rules" },
          { name: "Tier 3: Standard", desc: "Weekly backup verification and health checks" },
          { name: "Tier 4: Archival", desc: "Long-term compliance storage with cold S3 Glacier lifecycle policies" },
        ],
        connectorText: "Governed Backup Pipelines · Automated Verification",
      },
      {
        num: "04",
        name: "Resilience & Automated Backup Vault Tier",
        icon: Database,
        color: "purple",
        summary: "Continuous point-in-time recovery and verified encrypted backup archives",
        components: [
          { name: "28 DynamoDB Tables", desc: "Continuous Point-in-Time Recovery (PITR) with retention" },
          { name: "23 S3 Storage Buckets", desc: "Bucket versioning and cross-region recovery lifecycle policies" },
          { name: "Encrypted Archives", desc: "AES-256 encrypted archives validated against SHA-256 checksums" },
        ],
        connectorText: null,
      },
    ],
    highlights: [
      "Discovered and catalogued 33 Lambda functions across eight audited workloads, 28 databases, and 23 storage vaults across 17 regions.",
      "Continuous Point-in-Time Recovery guarantees data safety for mission-critical applications.",
      "Formal 4-tier disaster recovery matrix standardizes backup schedules for business applications.",
      "Encrypted backup archives protected with AES-256 encryption and verified through integrity hashes.",
    ],
  },
  {
    id: "workly",
    slug: "workly",
    title: "Multi-Tenant Cloud Platform Architecture",
    tagline: "Tenant Isolation · Role-Based Access · Microservices",
    badge: "Enterprise Web Architecture",
    description:
      "A tenant-isolated software architecture designed for multi-client operational management, regulatory compliance records, and self-service employee portals with strict data isolation.",
    metrics: [
      { label: "Account Privacy", value: "Strict Tenant Isolation" },
      { label: "User Access", value: "Role-Based Logins" },
      { label: "Backend", value: "Modular APIs" },
      { label: "Document Vault", value: "Private S3 Storage" },
    ],
    layers: [
      {
        num: "01",
        name: "Client & Presentation Tier",
        icon: Globe,
        color: "blue",
        summary: "Company-branded single page application with modern, responsive UI",
        components: [
          { name: "React 18 SPA", desc: "Modular component hierarchy & responsive UI layout" },
          { name: "Tailwind CSS", desc: "Custom theme styling & mobile optimization" },
          { name: "Tenant Context", desc: "Secure account routing & private workspace scoping" },
        ],
        connectorText: "Secure HTTPS · Fast Web APIs",
      },
      {
        num: "02",
        name: "Identity & Authentication Tier",
        icon: Shield,
        color: "green",
        summary: "Secure user logins with password recovery and role-based permissions",
        components: [
          { name: "Authentication Engine", desc: "Secure token issuance, password recovery & session management" },
          { name: "Email Normalization", desc: "Clean email input formatting preventing duplicate accounts" },
          { name: "Role Permissions", desc: "Granular access controls for admins, managers, and staff" },
        ],
        connectorText: "Secure Login Tokens · Permission Checks",
      },
      {
        num: "03",
        name: "API & Business Logic Tier",
        icon: Server,
        color: "orange",
        summary: "Web service endpoints handling business workflows and notifications",
        components: [
          { name: "API Gateway", desc: "Fast endpoint routing with rate limiting and payload validation" },
          { name: "Business Services", desc: "Compliance verification and business workflow execution" },
          { name: "Registry Connectors", desc: "License verification and document management" },
          { name: "Email Notifications", desc: "Event-triggered notification emails and renewal alerts" },
        ],
        connectorText: "Encrypted Network Traffic · Strict Privacy",
      },
      {
        num: "04",
        name: "Data & Document Storage Tier",
        icon: Database,
        color: "purple",
        summary: "Safe relational database with account isolation and private document storage",
        components: [
          { name: "PostgreSQL Database", desc: "Company-scoped database with strict access policy enforcement" },
          { name: "Private Document Storage", desc: "Access-controlled storage for certificates and compliance files" },
          { name: "Automated Backups", desc: "Regular automated backups and audit logging" },
        ],
        connectorText: null,
      },
    ],
    highlights: [
      "Strict data privacy ensures each tenant company's data is completely isolated and protected.",
      "Secure user authentication standardizes inputs and prevents account aliasing.",
      "Private document storage safeguards sensitive certificates and uploaded files.",
      "Modern web architecture ensures fast performance and easy feature additions.",
    ],
  },
];

export default function ArchitectureShowcase() {
  const [selectedSystem, setSelectedSystem] = useState("serverless-leave-system");
  const [showDiagram, setShowDiagram] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );
    sectionRef.current?.querySelectorAll(".reveal-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedSystem, showDiagram]);

  const activeData = SYSTEMS.find((s) => s.id === selectedSystem) || SYSTEMS[0];

  return (
    <section id="architecture" className="section arch-showcase-section" ref={sectionRef}>
      <div className="section-inner">
        <div className="section-label">CLOUD &amp; SYSTEM ARCHITECTURE</div>
        <h2 className="section-title">
          Architected for <span className="text-gradient">Scale, Security &amp; Uptime</span>
        </h2>
        <p className="section-description">
          Detailed architectural breakdowns of real production systems engineered on AWS, showcasing serverless microservices, cloud edge delivery, and Infrastructure as Code.
        </p>

        {/* System Toggle Tabs */}
        <div className="arch-system-tabs" role="tablist" aria-label="System Architecture Selection">
          {SYSTEMS.map((sys) => (
            <button
              key={sys.id}
              role="tab"
              aria-selected={selectedSystem === sys.id}
              aria-controls={`arch-panel-${sys.id}`}
              id={`arch-tab-${sys.id}`}
              tabIndex={0}
              className={`arch-system-tab ${selectedSystem === sys.id ? "active" : ""}`}
              onClick={() => {
                setSelectedSystem(sys.id);
                setShowDiagram(true);
              }}
            >
              <Layers size={15} />
              <span>{sys.title}</span>
            </button>
          ))}
        </div>

        {/* Main Architecture Card */}
        <div
          className="arch-main-card reveal-card"
          role="tabpanel"
          id={`arch-panel-${selectedSystem}`}
          aria-labelledby={`arch-tab-${selectedSystem}`}
          tabIndex={0}
        >
          {/* Card Header */}
          <div className="arch-card-header">
            <div className="arch-header-meta">
              <span className="arch-badge">
                <Sparkles size={11} /> {activeData.badge}
              </span>
              <span className="arch-system-tag">{activeData.tagline}</span>
            </div>
            <h3 className="arch-system-heading">{activeData.title}</h3>
            <p className="arch-system-desc">{activeData.description}</p>

            {/* Metrics Row */}
            <div className="arch-metrics-grid">
              {activeData.metrics.map((m, idx) => (
                <div key={idx} className="arch-metric-item">
                  <span className="arch-metric-val">{m.value}</span>
                  <span className="arch-metric-lbl">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Layer Flow */}
          <div className="arch-diagram-flow">
            <div className="arch-flow-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Workflow size={14} />
                <span>Multi-Tier Architectural Blueprint</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagram(!showDiagram)}
                className="btn-ghost"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                {showDiagram ? "Hide Technical Diagram" : "View Technical Diagram"}
              </button>
            </div>

            {showDiagram ? (
              <div className="arch-layers-list">
                {activeData.layers.map((layer, idx) => {
                  const IconComponent = layer.icon;
                  return (
                    <div key={idx} className="arch-layer-item">
                      <div className={`arch-layer-card layer-${layer.color}`}>
                        <div className="layer-top-row">
                          <div className="layer-icon-badge">
                            <IconComponent size={16} />
                          </div>
                          <span className="layer-step-num">Tier {layer.num}</span>
                          <h4 className="layer-name">{layer.name}</h4>
                        </div>

                        <p className="layer-summary">{layer.summary}</p>

                        <div className="layer-components-grid">
                          {layer.components.map((comp, cIdx) => (
                            <div key={cIdx} className="layer-component-pill">
                              <span className="comp-name">{comp.name}</span>
                              <span className="comp-desc">{comp.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {layer.connectorText && (
                        <div className="arch-flow-connector">
                          <div className="connector-line-down" />
                          <span className="connector-text-badge">{layer.connectorText}</span>
                          <div className="connector-line-down" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "1rem 0", color: "var(--color-text-secondary, #94a3b8)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                <p>Click <strong>&ldquo;View Technical Diagram&rdquo;</strong> above to inspect the multi-tier engineering topology, or read the full case study below.</p>
              </div>
            )}
          </div>

          {/* Architectural Guarantees & Callouts */}
          <div className="arch-highlights-footer">
            <h4 className="highlights-footer-title">Key Architectural Guarantees</h4>
            <div className="arch-highlights-grid">
              {activeData.highlights.map((h, idx) => (
                <div key={idx} className="arch-highlight-card">
                  <CheckCircle2 size={15} className="highlight-check" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="arch-cta-row">
              <Link to={`/projects/${activeData.slug}`} className="btn-primary">
                <span>View Full Case Study &amp; Technical Details</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
