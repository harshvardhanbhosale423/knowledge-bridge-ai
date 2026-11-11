import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import User, Project, Document, KnowledgeItem, HandoverReport, ActivityLog

DOC_FALCON = """# FALCON CORE BANKING - NEXTGEN LEDGER & REAL-TIME SETTLEMENT
Document Version: 3.2 | Principal Author: Sarah Lin (VP of Core Systems)
Classification: Highly Confidential Enterprise Specification | Release: Q4 2026

--- [Page 1] ---
1. EXECUTIVE TRANSITION OVERVIEW
Falcon Core Banking replaces the legacy AS400 core ledger with a distributed, multi-region double-entry ledger capable of processing 45,000 transactions per second with sub-10ms latency.
Sarah Lin is transitioning oversight of operational runbooks to David Kim ahead of international clearing integration in December 2026.

2. KEY ARCHITECTURAL DECISIONS
- Decision: Standardized on CockroachDB Multi-Region ACID clusters across US-East and EU-Central with 3-way Raft consensus.
- Decision: Selected Apache Kafka Event Sourcing with strict partition keys to guarantee immutable, replayable audit logs.
- Decision: Enforced mTLS Service Mesh with Envoy sidecars and SPIFFE/SPIRE dynamic cryptographic identities.
- Decision: Implemented ISO-20022 messaging schemas across all inbound and outbound inter-bank wire adapters.

--- [Page 2] ---
3. OPERATIONAL RESPONSIBILITIES & SYSTEM CONTACTS
- Lead Architect: Sarah Lin (VP of Core Systems) - Escalations and clearing sign-offs.
- Consensus Engine Owner: David Kim (Staff Distributed Systems Engineer) - CockroachDB node balancing.
- Regulatory Clearing Specialist: Priya Patel (Senior FinTech Compliance Lead) - FedLine and SWIFT reconciliation.
- Primary On-Call: SRE FinTech Ops Guild (Slack: #falcon-core-oncall, PagerDuty: Falcon-P0).

4. CRITICAL RISKS, TECHNICAL DEBT & MITIGATION
- Critical Risk: Cross-Atlantic fiber latency spikes during undersea maintenance could degrade CockroachDB Raft round-trip consensus past the 25ms SLA.
- Mitigation Plan: Local read-only replicas with asynchronous CDC pipeline ensure zero degradation to domestic retail payment authorizations.
- High Risk: Daily FedLine clearing batch window closes strictly at 17:00 UTC; batch retry queuing must have exponential jitter to prevent cascading drops.
- Blocker: Third-party SWIFT gateway hardware security module (HSM) requires firmware upgrade to v4.2 before November 30.

--- [Page 3] ---
5. TECHNICAL DEPENDENCIES & THIRD-PARTY INTEGRATIONS
- Dependency: Federal Reserve FedLine Direct API for real-time gross settlement (RTGS).
- Dependency: SWIFT ISO-20022 Gateway adapter for cross-border multi-currency wire transfers.
- Security Integration: HashiCorp Vault Enterprise with Thales Luna Cloud HSM for cardholder and account encryption keys.

6. IMMEDIATE NEXT ACTIONS & RUNBOOKS (FIRST 30 DAYS)
- Immediate Action: Execute full Disaster Recovery failover drill for EU-Central CockroachDB cluster before Black Friday freeze.
- Milestone: Complete final certification tests of ISO-20022 XML payment pacs.008 schema validation suite.
- Runbook Task: Automate nightly ledger balance reconciliation scripts in Airflow to detect micro-cent rounding anomalies.
"""

DOC_APOLLO = """# PROJECT APOLLO - CLOUD NATIVE INFRASTRUCTURE & K8S MIGRATION
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

6. RECOMMENDED NEXT ACTIONS (FIRST 30 DAYS)
- Immediate Priority: Rotate AWS IAM root credentials and transition all Terraform CI pipelines to OIDC GitHub Actions.
- Next Action: Conduct disaster recovery dry run for Aurora read replica promotion before Black Friday freeze.
- Milestone: Complete migration of remaining 3 legacy cron jobs from EC2 to Kubernetes CronJobs by November 30.
"""

DOC_NOVA = """# NOVA AI - ENTERPRISE KNOWLEDGE COPILOT & AGENTIC SEARCH
Document Version: 1.8 | Principal Research Lead: Dr. Tariq Al-Mansoor
Status: Architecture Review | Department: AI & Applied Research

--- [Page 1] ---
1. EXECUTIVE SUMMARY & RESEARCH OBJECTIVES
Nova AI is an enterprise-grade agentic knowledge extraction and semantic search platform.
The architecture combines pgvector in PostgreSQL, hybrid reciprocal rank fusion (BM25 + dense embeddings), and local deterministic parsing for complete offline zero-cost execution.

2. KEY ARCHITECTURAL DECISIONS
- Decision: Standardized on PostgreSQL with pgvector and HNSW indexing (m=16, ef_construction=64) to achieve sub-12ms vector search over 5 million chunks.
- Decision: Implemented Hybrid Reciprocal Rank Fusion (RRF) combining sparse BM25 keyword matching with dense multilingual embeddings.
- Decision: Built local deterministic fallback rules engine allowing 100% operational uptime at ₹0.00 cost when commercial LLM quotas expire.
- Decision: Enforced zero-data-retention policy with strict in-memory anonymization for all parsed engineering blueprints.

--- [Page 2] ---
3. OPERATIONAL ROLES & RESPONSIBILITIES
- AI Research Director: Dr. Tariq Al-Mansoor - Model fine-tuning and benchmark validation.
- Vector Pipeline Owner: Elena Rostova - Chunking algorithms, tokenizers, and pgvector schema migrations.
- Guardrails & Safety Lead: Sarah Jenkins - Prompt injection sanitization and zero-hallucination evidence matching.
- Infrastructure POC: DevSecOps Guild (Slack: #nova-ai-ops).

4. CRITICAL RISKS & ROADMAP BLOCKERS
- High Risk: Large 10M vector re-indexing causes temporary memory saturation on 8GB compute nodes without swap space.
- Medium Risk: Embeddings cold-start latency on serverless edge functions can exceed 800ms during initial worker wakeups.
- Blocker: Integration with Confluence enterprise cloud connector requires OAuth 2.0 PKCE gateway approval from IT SecOps.

--- [Page 3] ---
5. TECHNICAL DEPENDENCIES & COMPUTE TOPOLOGY
- Dependency: Neon PostgreSQL with pgvector v0.7.0 extension enabled.
- Dependency: HuggingFace Text Embeddings Inference (TEI) microservice container for private embedding inference.
- Integration: Redis 7.2 cluster for caching query vector embeddings with 24-hour TTL.

6. IMMEDIATE NEXT ACTIONS (SPRINT 48)
- Action Item: Benchmark HNSW index performance at scale with 10M synthetic embeddings.
- Priority Task: Implement token usage throttling middleware to prevent unexpected rate limit exhaustion.
- Goal: Achieve 99.8% precision on evidence quotation matching against uploaded architecture PDFs.
"""

def seed_database(db: Session):
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

    # 2. Project 1: Falcon Core Banking
    p1 = Project(
        title="Falcon Core Banking: NextGen Ledger & Real-Time Settlement",
        code="DEMO-FALCON",
        description="Distributed multi-region double-entry ledger architecture handling 45,000 TPS with sub-10ms ACID compliance, Apache Kafka event sourcing, and automated regulatory reporting.",
        department="Core Infrastructure & Banking Systems",
        status="active",
        lead_name="Sarah Lin",
        handover_status="approved"
    )
    # Project 2: Project Apollo
    p2 = Project(
        title="Project Apollo: Cloud Native Infrastructure & K8s Migration",
        code="DEMO-APOLLO",
        description="Complete enterprise transition of monolithic billing and checkout engines to AWS EKS with Karpenter autoscaling, Aurora Serverless v2 PostgreSQL, and zero-trust service mesh.",
        department="Platform Engineering & SRE",
        status="active",
        lead_name="Marcus Vance",
        handover_status="approved"
    )
    # Project 3: Nova AI
    p3 = Project(
        title="Nova AI: Enterprise Knowledge Copilot & Agentic Search",
        code="DEMO-NOVA",
        description="Sub-second semantic search pipeline with pgvector in PostgreSQL, hybrid BM25 + dense vector reranking, private embeddings, and strict zero-data-retention enterprise privacy gates.",
        department="Artificial Intelligence & Applied Research",
        status="active",
        lead_name="Dr. Tariq Al-Mansoor",
        handover_status="under_review"
    )
    db.add_all([p1, p2, p3])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)

    # Documents
    d1 = Document(
        project_id=p1.id,
        filename="Falcon_Ledger_Architecture_Handover.pdf",
        original_name="Falcon_Ledger_Architecture_Handover.pdf",
        file_type="pdf",
        file_size=len(DOC_FALCON.encode("utf-8")),
        storage_path="uploads/Falcon_Ledger_Architecture_Handover.pdf",
        page_count=3,
        char_count=len(DOC_FALCON),
        extracted_text=DOC_FALCON,
        is_processed=True
    )
    d2 = Document(
        project_id=p2.id,
        filename="Apollo_Cloud_Migration_Handover_Doc.txt",
        original_name="Apollo_Cloud_Migration_Handover_Doc.txt",
        file_type="txt",
        file_size=len(DOC_APOLLO.encode("utf-8")),
        storage_path="uploads/Apollo_Cloud_Migration_Handover_Doc.txt",
        page_count=4,
        char_count=len(DOC_APOLLO),
        extracted_text=DOC_APOLLO,
        is_processed=True
    )
    d3 = Document(
        project_id=p3.id,
        filename="Nova_AI_Semantic_Pipeline_Spec.pdf",
        original_name="Nova_AI_Semantic_Pipeline_Spec.pdf",
        file_type="pdf",
        file_size=len(DOC_NOVA.encode("utf-8")),
        storage_path="uploads/Nova_AI_Semantic_Pipeline_Spec.pdf",
        page_count=3,
        char_count=len(DOC_NOVA),
        extracted_text=DOC_NOVA,
        is_processed=True
    )
    db.add_all([d1, d2, d3])
    db.commit()
    db.refresh(d1)
    db.refresh(d2)
    db.refresh(d3)

    # Handover packages for p1 and p2
    h1 = HandoverReport(
        project_id=p1.id,
        title="Falcon Core Banking: Official NextGen Ledger Handover Package",
        version="3.2.0",
        executive_summary="Official certified handover package codifying CockroachDB multi-region ledger architecture, Apache Kafka event sourcing pipelines, SWIFT ISO-20022 clearing integrations, and operational failover runbooks. Certified by Alex Chen.",
        status="approved",
        approved_by="Alex Chen (Engineering Director)",
        approved_at=datetime.utcnow() - timedelta(days=2),
        stats_json=json.dumps({"total_items": 10, "approved": 10, "critical_risks": 2}),
        markdown_content=f"# FALCON CORE BANKING HANDOVER PACKAGE\nCertified by Alex Chen"
    )
    h2 = HandoverReport(
        project_id=p2.id,
        title="Project Apollo: Cloud Native Infrastructure Handover Package",
        version="2.4.0",
        executive_summary="Official architectural handover package for AWS EKS microservices migration, Aurora Serverless multi-AZ failovers, and SQS/SNS event streaming. Certified by Alex Chen.",
        status="approved",
        approved_by="Alex Chen (Engineering Director)",
        approved_at=datetime.utcnow() - timedelta(days=1),
        stats_json=json.dumps({"total_items": 6, "approved": 6, "critical_risks": 1}),
        markdown_content=f"# PROJECT APOLLO HANDOVER PACKAGE\nCertified by Alex Chen"
    )
    h3 = HandoverReport(
        project_id=p3.id,
        title="Nova AI: Knowledge Copilot & Agentic Search Handover Package",
        version="1.8.0",
        executive_summary="Handover package covering pgvector HNSW indexing, hybrid reciprocal rank fusion search, private TEI embeddings, and offline zero-cost fallback rules. Under review by Alex Chen.",
        status="under_review",
        approved_by=None,
        approved_at=None,
        stats_json=json.dumps({"total_items": 5, "approved": 3, "pending_review": 2}),
        markdown_content=f"# NOVA AI HANDOVER PACKAGE (DRAFT UNDER REVIEW)"
    )
    db.add_all([h1, h2, h3])
    db.commit()
