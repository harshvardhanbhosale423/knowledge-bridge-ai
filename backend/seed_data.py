import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import User, Project, Document, KnowledgeItem, HandoverReport, ActivityLog

SAMPLE_DOC_APOLLO = """# PROJECT APOLLO - CLOUD MIGRATION & K8S HANDOVER
Document Version: 2.4 | Author: Marcus Vance (Principal Architect)
Status: Handover Active | Date: October 2026

--- [Page 1] ---
1. EXECUTIVE SUMMARY & BACKGROUND
Project Apollo migrated our monolithic billing and subscription engine into AWS EKS microservices.
Marcus Vance is stepping down as Technical Lead on November 15, 2026. This document captures all architectural choices, technical debt, operational runbooks, and critical pending items.

2. IMPORTANT ARCHITECTURAL DECISIONS
- Decision: Standardized on AWS EKS 1.30 with Karpenter for cluster autoscaling rather than Cluster Autoscaler.
- Decision: Selected PostgreSQL RDS Aurora Serverless v2 for database multi-AZ failover with 15-second RTO.
- Decision: Implemented gRPC with mTLS for inter-service communication to enforce zero-trust network boundaries.
- Decision: Decided to deprecate RabbitMQ in favor of AWS SQS + SNS FIFO queues for event-driven processing.

--- [Page 2] ---
3. SYSTEM ROLES & KEY RESPONSIBILITIES
- Lead: Marcus Vance (Outgoing Principal Architect) - Handing over to Elena Rostova.
- Primary On-Call: Devops Infra Guild (Slack: #apollo-ops, PagerDuty schedule: Apollo-Tier-1).
- Code Owner for Auth Engine: Sarah Jenkins (Senior Backend Engineer).
- Database Administrator POC: Tariq Al-Mansoor (Data Infrastructure Team).

4. CRITICAL RISKS & TECHNICAL BLOCKERS
- High Risk: Redis cache cluster runs on a single node in staging; production cluster lacks automatic memory defragmentation during weekend traffic bursts.
- Blocker: Third-party Webhook provider (PaySync API) has a hard rate limit of 40 req/sec; batch retries cause cascading timeouts if unthrottled.
- Vulnerability: Terraform state file in S3 currently uses SSE-S3 encryption instead of customer-managed KMS key.

--- [Page 3] ---
5. SYSTEM DEPENDENCIES & PREREQUISITES
- Dependency: Depends on Vault Enterprise cluster (v1.17) for dynamic database credential generation.
- Dependency: Integrated with Datadog APM agent v7.50; requires DD_API_KEY injected via Kubernetes secrets.
- Prerequisite: All CI/CD pipelines require SonarQube quality gate passing with code coverage > 85%.

6. UNRESOLVED QUESTIONS & OPEN DEBATES
- Question: Should we migrate legacy payment webhooks to async event streaming or maintain synchronous REST proxies?
- Open Question: Who will take ownership of the bi-weekly load testing pipeline once the contract with QA-Cloud expires in December?
- Needs clarification: What is the exact customer SLA guarantee for international multi-currency conversions during leap seconds?

--- [Page 4] ---
7. RECOMMENDED NEXT ACTIONS (FIRST 30 DAYS)
- Immediate Priority: Rotate AWS IAM root credentials and transition all Terraform CI pipelines to OIDC GitHub Actions.
- Next Action: Conduct disaster recovery dry run for Aurora read replica promotion before Black Friday freeze.
- Action Item: Schedule knowledge transfer session between Elena Rostova and Tariq Al-Mansoor regarding Aurora connection pooling.
- Milestone: Complete migration of remaining 3 legacy cron jobs from EC2 to Kubernetes CronJobs by November 30.
"""

SAMPLE_DOC_FINPAY = """# FINPAY V2 - PAYMENT GATEWAY CORE HANDOVER
Lead Engineer: Elena Rostova | Department: Financial Systems
Target Launch: Q1 2027 | Confidential Synthetic Mock Data

--- [Page 1] ---
1. ARCHITECTURAL OVERVIEW
FinPay V2 is a PCI-DSS Level 1 compliant tokenization pipeline processing Visa, Mastercard, and ACH transactions.

2. ARCHITECTURAL DECISIONS
- Decision: Decided to use Rust for the core tokenization microservice to guarantee sub-5ms latency and memory safety.
- Decision: Agreed to store cardholder tokens in AWS DynamoDB with global tables across us-east-1 and eu-west-1.

3. RISKS & HARD DEPENDENCIES
- Risk: Cross-region replication latency can spike up to 800ms during transatlantic undersea cable maintenance.
- Dependency: Depends on Thales Cloud HSM for hardware-level token encryption keys.
- Blocker: Compliance audit with Bishop Fox is pending final signature from Chief Risk Officer.

4. NEXT ACTIONS & ASSIGNED TASKS
- Next Action: Finalize 3D Secure 2.2 authentication webhook callbacks before November 25.
- Pending Task: Complete load test at 12,000 TPS simulating Cyber Monday transaction spikes.
- Assigned to: David Kim is responsible for implementing circuit breaker fallbacks in the Stripe relay gateway.
"""

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Project).first():
        return

    # 1. Create Users
    admin_user = User(
        email="admin@knowledgebridge.ai",
        full_name="Alex Chen",
        role="admin",
        department="Engineering Management",
        avatar_color="blue"
    )
    team_user = User(
        email="elena.rostova@knowledgebridge.ai",
        full_name="Elena Rostova",
        role="team_member",
        department="Platform Engineering",
        avatar_color="emerald"
    )
    db.add(admin_user)
    db.add(team_user)
    db.commit()

    # 2. Create Projects
    project_apollo = Project(
        title="Project Apollo: Cloud Migration & K8s Architecture",
        code="KB-APOLLO",
        description="Complete architectural migration of monolithic billing engine to AWS EKS with Karpenter, Aurora Serverless, and zero-trust service mesh.",
        department="Platform Engineering",
        status="active",
        lead_name="Marcus Vance",
        handover_status="under_review"
    )
    
    project_finpay = Project(
        title="Project FinPay: Payment Gateway V2 & PCI Tokenization",
        code="KB-FINPAY",
        description="Next-generation PCI-DSS Level 1 tokenization gateway with sub-5ms Rust microservices and cross-region DynamoDB replication.",
        department="Financial Systems",
        status="active",
        lead_name="Elena Rostova",
        handover_status="draft"
    )

    db.add(project_apollo)
    db.add(project_finpay)
    db.commit()
    db.refresh(project_apollo)
    db.refresh(project_finpay)

    # 3. Create Documents
    doc_apollo = Document(
        project_id=project_apollo.id,
        filename="Apollo_Cloud_Migration_Handover_Doc.txt",
        original_name="Apollo_Cloud_Migration_Handover_Doc.txt",
        file_type="txt",
        file_size=len(SAMPLE_DOC_APOLLO.encode("utf-8")),
        storage_path="uploads/Apollo_Cloud_Migration_Handover_Doc.txt",
        page_count=4,
        char_count=len(SAMPLE_DOC_APOLLO),
        extracted_text=SAMPLE_DOC_APOLLO,
        is_processed=True
    )
    
    doc_finpay = Document(
        project_id=project_finpay.id,
        filename="FinPay_V2_Security_Architecture.txt",
        original_name="FinPay_V2_Security_Architecture.txt",
        file_type="txt",
        file_size=len(SAMPLE_DOC_FINPAY.encode("utf-8")),
        storage_path="uploads/FinPay_V2_Security_Architecture.txt",
        page_count=1,
        char_count=len(SAMPLE_DOC_FINPAY),
        extracted_text=SAMPLE_DOC_FINPAY,
        is_processed=True
    )

    db.add(doc_apollo)
    db.add(doc_finpay)
    db.commit()
    db.refresh(doc_apollo)
    db.refresh(doc_finpay)

    # 4. Create Apollo Knowledge Items (Realistic synthetic items linked to verified document text)
    apollo_items = [
        # Decisions
        {
            "category": "decision",
            "title": "Standardized on AWS EKS 1.30 with Karpenter Autoscaling",
            "content": "Selected Karpenter over Kubernetes Cluster Autoscaler for node provisioning to optimize bin-packing efficiency and cold-start speed.",
            "priority": "high",
            "assignee": "Marcus Vance",
            "source_excerpt": "Decision: Standardized on AWS EKS 1.30 with Karpenter for cluster autoscaling rather than Cluster Autoscaler.",
            "source_page": "Page 1",
            "status": "approved",
            "confidence_score": 0.98,
            "reviewed_by": "Alex Chen",
            "review_notes": "Verified against Terraform infrastructure code in repo."
        },
        {
            "category": "decision",
            "title": "Selected Aurora Serverless v2 with 15s Multi-AZ Failover",
            "content": "Database tier leverages PostgreSQL Aurora Serverless v2 with auto-scaling ACUs and automated multi-AZ promotion in under 15 seconds.",
            "priority": "critical",
            "assignee": "Tariq Al-Mansoor",
            "source_excerpt": "Decision: Selected PostgreSQL RDS Aurora Serverless v2 for database multi-AZ failover with 15-second RTO.",
            "source_page": "Page 1",
            "status": "approved",
            "confidence_score": 0.96,
            "reviewed_by": "Alex Chen",
            "review_notes": "Benchmark stress tests validated 12s failover in sandbox."
        },
        {
            "category": "decision",
            "title": "Migrated from RabbitMQ to AWS SQS/SNS FIFO Queues",
            "content": "Replaced self-managed RabbitMQ cluster with fully managed SQS FIFO queues to eliminate maintenance overhead and ensure strictly ordered messaging.",
            "priority": "medium",
            "assignee": "Marcus Vance",
            "source_excerpt": "Decision: Decided to deprecate RabbitMQ in favor of AWS SQS + SNS FIFO queues for event-driven processing.",
            "source_page": "Page 1",
            "status": "approved",
            "confidence_score": 0.95,
            "reviewed_by": "Alex Chen"
        },
        # Responsibilities
        {
            "category": "responsibility",
            "title": "Lead Architecture Handover to Elena Rostova",
            "content": "Marcus Vance is stepping down on Nov 15; all architectural approvals and key stakeholder relationships transfer to Elena Rostova.",
            "priority": "critical",
            "assignee": "Elena Rostova",
            "source_excerpt": "Lead: Marcus Vance (Outgoing Principal Architect) - Handing over to Elena Rostova.",
            "source_page": "Page 2",
            "status": "approved",
            "confidence_score": 0.99,
            "reviewed_by": "Alex Chen"
        },
        {
            "category": "responsibility",
            "title": "Authentication Engine Code Ownership",
            "content": "Sarah Jenkins maintains JWT token signing, OAuth2 callbacks, and session revoking services.",
            "priority": "high",
            "assignee": "Sarah Jenkins",
            "source_excerpt": "Code Owner for Auth Engine: Sarah Jenkins (Senior Backend Engineer).",
            "source_page": "Page 2",
            "status": "approved",
            "confidence_score": 0.97,
            "reviewed_by": "Alex Chen"
        },
        # Risks & Blockers
        {
            "category": "risk_blocker",
            "title": "Redis Memory Fragmentation Spikes During Weekend Bursts",
            "content": "Staging Redis instance is single-node, and production memory defragmentation is not dynamically scheduled during weekend batch reconciliations.",
            "priority": "critical",
            "assignee": "Devops Infra Guild",
            "source_excerpt": "High Risk: Redis cache cluster runs on a single node in staging; production cluster lacks automatic memory defragmentation during weekend traffic bursts.",
            "source_page": "Page 2",
            "status": "approved",
            "confidence_score": 0.94,
            "reviewed_by": "Alex Chen",
            "review_notes": "Scheduled for ElastiCache cluster migration in sprint 44."
        },
        {
            "category": "risk_blocker",
            "title": "Third-Party PaySync Webhook 40 req/s Hard Rate Limit",
            "content": "PaySync API drops connections without backoff headers when requests exceed 40/sec, requiring exponential backoff queuing.",
            "priority": "high",
            "assignee": "Elena Rostova",
            "source_excerpt": "Blocker: Third-party Webhook provider (PaySync API) has a hard rate limit of 40 req/sec; batch retries cause cascading timeouts if unthrottled.",
            "source_page": "Page 2",
            "status": "pending_review",
            "confidence_score": 0.93
        },
        # Dependencies
        {
            "category": "dependency",
            "title": "HashiCorp Vault v1.17 for Dynamic DB Credentials",
            "content": "Microservices authenticate to Postgres using short-lived 1-hour credentials generated through Vault Kubernetes Auth method.",
            "priority": "high",
            "assignee": "Tariq Al-Mansoor",
            "source_excerpt": "Dependency: Depends on Vault Enterprise cluster (v1.17) for dynamic database credential generation.",
            "source_page": "Page 3",
            "status": "approved",
            "confidence_score": 0.98,
            "reviewed_by": "Alex Chen"
        },
        # Unresolved Questions
        {
            "category": "unresolved_question",
            "title": "Payment Webhook Architecture: Event Streaming vs REST Proxies",
            "content": "Debate remains unresolved on whether inbound webhook events should be ingested directly into Kafka/Kinesis or mediated via synchronous Envoy gateways.",
            "priority": "medium",
            "assignee": "Elena Rostova",
            "source_excerpt": "Question: Should we migrate legacy payment webhooks to async event streaming or maintain synchronous REST proxies?",
            "source_page": "Page 3",
            "status": "pending_review",
            "confidence_score": 0.91
        },
        # Next Actions
        {
            "category": "next_action",
            "title": "Rotate AWS IAM Credentials and Implement OIDC Actions",
            "content": "Decommission permanent AWS IAM access keys in GitHub Secrets and migrate all release workflows to AWS AssumeRoleWithWebIdentity.",
            "priority": "critical",
            "assignee": "Elena Rostova",
            "source_excerpt": "Immediate Priority: Rotate AWS IAM root credentials and transition all Terraform CI pipelines to OIDC GitHub Actions.",
            "source_page": "Page 4",
            "status": "approved",
            "confidence_score": 0.97,
            "reviewed_by": "Alex Chen"
        },
        {
            "category": "next_action",
            "title": "Execute Disaster Recovery Aurora Read Replica Dry Run",
            "content": "Simulate primary database AZ outage during low-traffic window to confirm client reconnect retry behavior and DNS propagation.",
            "priority": "high",
            "assignee": "Tariq Al-Mansoor",
            "source_excerpt": "Next Action: Conduct disaster recovery dry run for Aurora read replica promotion before Black Friday freeze.",
            "source_page": "Page 4",
            "status": "approved",
            "confidence_score": 0.95,
            "reviewed_by": "Alex Chen"
        }
    ]

    for item_data in apollo_items:
        ki = KnowledgeItem(
            project_id=project_apollo.id,
            document_id=doc_apollo.id,
            category=item_data["category"],
            title=item_data["title"],
            content=item_data["content"],
            priority=item_data["priority"],
            assignee=item_data.get("assignee"),
            source_document_name="Apollo_Cloud_Migration_Handover_Doc.txt",
            source_page=item_data["source_page"],
            source_excerpt=item_data["source_excerpt"],
            status=item_data["status"],
            review_notes=item_data.get("review_notes"),
            reviewed_by=item_data.get("reviewed_by"),
            reviewed_at=datetime.utcnow() - timedelta(hours=2) if item_data.get("reviewed_by") else None,
            evidence_verified=True,
            missing_evidence_flag=False,
            confidence_score=item_data["confidence_score"],
            is_ai_generated=True,
            is_demo_mode=False,
            ai_provider="Gemini 1.5 Flash"
        )
        db.add(ki)

    # 5. Create Apollo Handover Report
    apollo_report_md = f"""# EXECUTIVE KNOWLEDGE HANDOVER REPORT
**Project:** {project_apollo.title} ({project_apollo.code})  
**Department:** {project_apollo.department}  
**Outgoing Lead:** Marcus Vance | **Incoming Lead:** Elena Rostova  
**Generated On:** {datetime.utcnow().strftime('%B %d, %Y')}  
**Verification Status:** Evidence Linked & Verified | Human Review: Complete

---

## 1. EXECUTIVE SUMMARY
Project Apollo successfully migrated the core billing platform to an AWS EKS microservices architecture.
This handover report consolidates 11 critical architectural decisions, infrastructure ownerships, active risks, dependencies, and immediate priorities.

## 2. KEY ARCHITECTURAL DECISIONS (VERIFIED)
1. **AWS EKS 1.30 + Karpenter**: Standardized for node auto-scaling to eliminate cluster-autoscaler latency.
   *Source: Apollo_Cloud_Migration_Handover_Doc.txt (Page 1)*
2. **Aurora Serverless v2 PostgreSQL**: Multi-AZ automated failover with 15s RTO SLA.
   *Source: Apollo_Cloud_Migration_Handover_Doc.txt (Page 1)*
3. **AWS SQS FIFO Queues**: Deprecated RabbitMQ; all payment events ordered through FIFO channels.
   *Source: Apollo_Cloud_Migration_Handover_Doc.txt (Page 1)*

## 3. ACTIVE RISKS & OPERATIONAL BLOCKERS
- **[CRITICAL] Redis Single-Node Staging & Memory Defrag**: Production lacks automatic defrag during peak reconciliation windows.
- **[HIGH] PaySync 40 req/s Hard Rate Limit**: External gateway will reject burst transactions without exponential retry handling.

## 4. CRITICAL DEPENDENCIES
- **HashiCorp Vault Enterprise (v1.17)**: Manages short-lived Kubernetes database tokens.
- **Datadog APM Agent (v7.50)**: Standard telemetry and trace ingestion.

## 5. FIRST 30-DAY PRIORITY ACTIONS
1. **Rotate AWS IAM credentials** and enable OIDC GitHub Actions runner roles (*Assignee: Elena Rostova*).
2. **Execute Aurora read replica failover dry run** prior to Q4 traffic peak (*Assignee: Tariq Al-Mansoor*).
3. **Migrate 3 legacy EC2 cron jobs** to Kubernetes CronJobs (*Assignee: DevOps Infra Guild*).

---
*Report certified by Knowledge Bridge AI Evidence Engine.*
"""

    report = HandoverReport(
        project_id=project_apollo.id,
        title="Project Apollo: Cloud Migration & Architecture Handover Package",
        version="1.0.0",
        executive_summary="Consolidated architectural choices, technical debt, and 30-day action items for the outgoing Apollo leadership handover.",
        status="approved",
        approved_by="Alex Chen",
        approved_at=datetime.utcnow() - timedelta(hours=1),
        stats_json=json.dumps({
            "total_items": 11,
            "approved_items": 9,
            "pending_items": 2,
            "critical_risks": 1,
            "decisions_count": 3,
            "evidence_coverage": "100%"
        }),
        markdown_content=apollo_report_md
    )
    db.add(report)

    # 6. Add initial activity logs
    logs = [
        ActivityLog(project_id=project_apollo.id, user_name="Marcus Vance", action="DOCUMENT_UPLOADED", details="Uploaded Apollo_Cloud_Migration_Handover_Doc.txt (4 pages)"),
        ActivityLog(project_id=project_apollo.id, user_name="AI Knowledge Engine", action="ANALYSIS_COMPLETED", details="Extracted 11 knowledge items across 7 categories with 100% evidence verification"),
        ActivityLog(project_id=project_apollo.id, user_name="Alex Chen", action="REVIEW_COMPLETED", details="Approved 9 critical items and flagged 2 pending review"),
        ActivityLog(project_id=project_apollo.id, user_name="Alex Chen", action="HANDOVER_APPROVED", details="Officially certified Handover Package v1.0.0 for Elena Rostova"),
        ActivityLog(project_id=project_finpay.id, user_name="Elena Rostova", action="PROJECT_CREATED", details="Created Project FinPay workspace with tokenization specs")
    ]
    for log in logs:
        db.add(log)

    db.commit()
    print("Database successfully seeded with synthetic enterprise handover data.")

