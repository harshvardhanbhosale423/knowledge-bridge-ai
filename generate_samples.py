import os
import docx

os.makedirs("sample_documents", exist_ok=True)

# 1. Generate sample DOCX
doc = docx.Document()
doc.add_heading("PROJECT TITAN - CORE INFRASTRUCTURE HANDOVER", 0)
p1 = doc.add_paragraph("Lead Architect: Marcus Vance | Confidential Handover Specification | November 2026")

doc.add_heading("1. Architectural Decisions", level=1)
doc.add_paragraph("Decision: Decided to adopt Istio Service Mesh v1.22 for strictly enforced mutual TLS across all microservice namespaces.")
doc.add_paragraph("Decision: Selected Amazon Managed Prometheus (AMP) and Grafana Cloud for multi-cluster metric aggregation.")
doc.add_paragraph("Decision: Agreed to deprecate self-hosted OpenSearch in favor of AWS Serverless OpenSearch.")

doc.add_heading("2. Operational Responsibilities", level=1)
doc.add_paragraph("Lead: Elena Rostova assumes all service mesh and network policy oversight starting Nov 18.")
doc.add_paragraph("Responsible: David Kim is primary contact point for payment gateway token encryption rotation.")

doc.add_heading("3. Technical Debt & Risks", level=1)
doc.add_paragraph("Critical Risk: Vault Enterprise cluster storage quota is at 88% capacity on node us-east-1a.")
doc.add_paragraph("Blocker: Core banking mock simulator times out under concurrency higher than 2,500 simultaneous sessions.")

doc.add_heading("4. Next 30-Day Priorities", level=1)
doc.add_paragraph("Immediate Priority: Upgrade ingress-nginx controller to v1.11 to patch CVE-2024-7646.")
doc.add_paragraph("Next Action: Run automated load test against Tokenizer v2 before Black Friday code freeze.")

doc.save("sample_documents/Titan_Infra_Service_Mesh_Handover.docx")
print("Generated sample_documents/Titan_Infra_Service_Mesh_Handover.docx")

# 2. Generate sample TXT
txt_content = """# PROJECT HELIOS - BIG DATA & KAFKA STREAMING HANDOVER
Author: Dr. Tariq Al-Mansoor | Team: Core Data Platform | Status: Handover Certified

--- [Page 1] ---
1. PIPELINE OVERVIEW
Helios ingests 45,000 transaction events per second into Apache Kafka clusters running on AWS MSK.

2. CRITICAL DECISIONS
- Decision: Standardized on Apache Flink 1.19 for stateful stream processing with exactly-once semantic guarantees.
- Decision: Decided to use Apache Iceberg as our primary data lake table format on AWS S3.
- Decision: Selected Debezium CDC connectors to capture changes from PostgreSQL Aurora with zero impact on replication lag.

--- [Page 2] ---
3. SYSTEM DEPENDENCIES & OWNERS
- Dependency: Depends on AWS Glue Schema Registry for Avro serialization schemas.
- Lead: Sarah Jenkins owns Flink consumer group offset alerting and checkpoint failure alarms.
- Dependency: Integrated with Snowflake Data Cloud via Snowpipe Streaming v2.

4. RISKS & UNRESOLVED QUESTIONS
- High Risk: MSK brokers experience high disk I/O wait during midnight compact topic reconciliations.
- Open Question: Should we migrate historical transaction data older than 3 years to Glacier Deep Archive or keep in Iceberg Standard S3?
- Next Action: Rotate SASL/SCRAM client credentials across all 18 producer microservices before December 1st.
"""

with open("sample_documents/Helios_Kafka_Streaming_Handover.txt", "w", encoding="utf-8") as f:
    f.write(txt_content)

print("Generated sample_documents/Helios_Kafka_Streaming_Handover.txt")

