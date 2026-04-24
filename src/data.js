import {
  Cloud,
  Server,
  DatabaseZap,
  Cpu,
  Layers,
  Code,
  Workflow,
  Code2,
} from "lucide-react"

export const profile = {
  name: "Pragneysh",
  alias: "Dekate",
  role: "Full-Stack Developer & Cloud Engineer",
  location: "Ahmedabad, Gujarat, India",
  email: "pragneyshdekate@gmail.com",
  github: "https://github.com/pragneysh",
  linkedin: "https://www.linkedin.com/in/dekate-pragneysh-79a438394/",
  tagline:
    "I don't just complete tasks — I build systems that grow, scale, and evolve.",
  bio: [
    "I'm a Full-Stack Developer on a DevOps & Cloud Engineering track, based in Ahmedabad, India. My core expertise spans Python, Django, and DRF on the backend, paired with React and modern CSS on the frontend — all deployed on AWS infrastructure I manage myself.",
    "My work style is calm under pressure, systematic, and disciplined. I approach every project with a long-term perspective: not just solving the problem at hand, but designing a system that scales, self-heals, and can be fully automated.",
    "From Dockerized Django applications deployed on EC2 to architecting serverless platforms on Lambda + API Gateway + DynamoDB, I think architecture-first and automate everything that repeats.",
  ],
  status: "open_to_work",
  philosophy: "If it repeats — automate it",
};

export const workflow = [
  { num: "01", label: "Vision", sub: "Define the end-state goal" },
  { num: "02", label: "Design", sub: "Architecture-first planning" },
  { num: "03", label: "Build", sub: "Modular, component-based iteration" },
  { num: "04", label: "Test", sub: "Will this break at scale?" },
  { num: "05", label: "Optimize", sub: "Performance + reliability" },
  { num: "06", label: "Automate", sub: "CI/CD, IaC, pipelines" },
  { num: "07", label: "Scale", sub: "Enterprise-grade systems" },
];

export const skills = [
  {
    icon: Cloud,
    color: "blue",
    title: "Cloud & AWS",
    items: [
      "EC2, Lambda, API Gateway",
      "S3, CloudFront, CloudFormation",
      "AWS CLI & IAM Management",
      "Infrastructure as Code (IaC)",
    ],
  },
  {
    icon: Workflow,
    color: "green",
    title: "DevOps & CI/CD",
    items: [
      "Docker & Kubernetes",
      "CI/CD Pipelines",
      "GitHub Actions",
      "CloudFormation & IaC",
    ],
  },
  {
    icon: Server,
    color: "orange",
    title: "Backend",
    items: [
      "Python, Django, DRF",
      "NestJS (Node.js)",
      "Authentication systems",
      "MySQL, DynamoDB",
    ],
  },
  {
    icon: Code,
    color: "blue",
    title: "Frontend",
    items: [
      "React (Vite)",
      "HTML5, CSS3, Bootstrap 5",
      "Responsive / Component design",
      "Dark theme & modern UI/UX",
    ],
  },
  {
    icon: DatabaseZap,
    color: "green",
    title: "Databases",
    items: [
      "MySQL (relational design)",
      "DynamoDB (NoSQL)",
      "Schema design & optimization",
      "ORMs & query performance",
    ],
  },
  {
    icon: Layers,
    color: "orange",
    title: "Architecture",
    items: [
      "Microservices design",
      "Distributed systems",
      "High availability systems",
      "Serverless architecture",
    ],
  },
];

export const projects = [
  {
    num: "01",
    featured: true,
    title: "Leave Management System",
    desc: "Full enterprise-grade leave management platform built at the office. Features role-based access, multi-level approval workflows, real-time notifications, and a complete audit trail. Deployed entirely on AWS with a YML-configured serverless backend and a React frontend served through CloudFront.",
    stack: [
      "NestJS",
      "React",
      "DynamoDB",
      "AWS Lambda",
      "API Gateway",
      "S3 + CloudFront",
      "YAML Config",
    ],
    stackColors: [
      "default",
      "default",
      "default",
      "green",
      "green",
      "green",
      "default",
    ],
    architecture: [
      { color: "blue", text: "React + Vite · CloudFront CDN" },
      { color: "green", text: "API Gateway · Lambda Functions" },
      { color: "orange", text: "DynamoDB · NestJS Services" },
    ],
  },
  {
    num: "02",
    title: "Tour & Travel Booking Platform",
    desc: "Full-featured booking platform with Admin/User role separation, trip & hotel management, complete location hierarchy, and booking workflows. Built with Django and deployed on EC2.",
    stack: ["Django", "DRF", "MySQL", "AWS EC2", "Bootstrap 5"],
    stackColors: ["default", "default", "default", "green", "default"],
  },
  {
    num: "03",
    title: "T-Shirt Customization E-Commerce",
    desc: "Custom product e-commerce site with live T-shirt design editor, cart system, order management, discount engine, product likes, and role-based dashboards for admins and customers.",
    stack: ["Django", "MySQL", "Bootstrap 5", "Docker"],
    stackColors: ["default", "default", "default", "green"],
  },
  {
    num: "04",
    title: "Client Portfolio Websites",
    desc: "Multiple client portfolio sites deployed on a fully serverless AWS stack — static assets on S3, Lambda for dynamic logic, DynamoDB for data, and CloudFront for global delivery.",
    stack: ["S3", "Lambda", "DynamoDB", "CloudFront", "React"],
    stackColors: ["green", "green", "green", "green", "default"],
  },
  {
    num: "05",
    title: "Auth & Security Systems",
    desc: "Custom authentication frameworks including two-step verification, django-allauth integration, custom auth flows, session management, and role-based access control systems.",
    stack: ["Django", "django-allauth", "DRF", "MySQL", "JWT"],
    stackColors: ["default", "default", "default", "default", "default"],
  },
  {
    num: "06",
    title: "GitHub → EC2 Deployment Pipeline",
    desc: "Automated CI/CD pipeline connecting GitHub repositories directly to EC2 instances. Push-to-deploy workflow with environment management, health checks, and rollback support.",
    stack: ["AWS EC2", "GitHub Actions", "Docker", "CI/CD", "Shell"],
    stackColors: ["green", "default", "green", "default", "default"],
  },
];

export const experience = [
  {
    date: "Current · Full-Time",
    role: "Full-Stack Developer",
    company: "I-Magic Solutions · Ahmedabad, India",
    points: [
      "Architected and delivered enterprise Leave Management System on AWS (Lambda, API Gateway, DynamoDB)",
      "Built NestJS backend services with YML-based deployment configuration",
      "Developed React (Vite) frontend with CloudFront CDN delivery",
      "Deployed and managed multiple client portfolio websites on serverless AWS stack",
      "Established GitHub-to-EC2 CI/CD pipelines and Docker-based workflows",
    ],
  },
  {
    date: "Ongoing · Self-Directed",
    role: "Cloud & DevOps Engineering Upskilling",
    company: "Independent · Active Learning Track",
    points: [
      "Advancing expertise in Kubernetes clusters and microservices orchestration",
      "Studying advanced AWS services, cloud security, and high-availability patterns",
      "Building IaC skills with CloudFormation and exploring Terraform",
      "Practicing distributed systems design and enterprise cloud architecture",
      "Goal: Cloud Engineer → DevOps Architect specializing in enterprise cloud solutions",
    ],
  },
  {
    date: "Past Projects",
    role: "Django Full-Stack Developer",
    company: "Personal & Freelance Projects",
    points: [
      "Built Tour & Travel Booking Platform with full role management and booking workflows",
      "Developed T-Shirt Customization e-commerce with live design editor and admin dashboard",
      "Implemented custom authentication systems including two-step verification and allauth",
      "Deployed Dockerized applications on AWS EC2 with automated pipelines",
    ],
  },
];
