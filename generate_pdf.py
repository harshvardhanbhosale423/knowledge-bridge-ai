def create_simple_pdf(filename, content_lines):
    # Construct a valid PDF 1.4 with text objects
    stream_content = "BT\n/F1 12 Tf\n50 750 Td\n16 TL\n"
    for line in content_lines:
        safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream_content += f"({safe_line}) '\n"
    stream_content += "ET"
    
    stream_bytes = stream_content.encode("latin-1")
    stream_len = len(stream_bytes)
    
    pdf_template = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {stream_len} >>
stream
{stream_content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
438
%%EOF"""

    with open(filename, "wb") as f:
        f.write(pdf_template.encode("latin-1"))

if __name__ == "__main__":
    lines = [
        "PROJECT AURA - MICROSERVICES ARCHITECTURE HANDOVER",
        "Author: Sarah Jenkins | Date: November 2026",
        "",
        "1. ARCHITECTURAL DECISIONS",
        "Decision: Decided to adopt gRPC with Protobuf v3 for internal microservice communication.",
        "Decision: Selected Redis Cluster with multi-region replication for distributed session caching.",
        "",
        "2. ROLES AND RESPONSIBILITIES",
        "Lead: Sarah Jenkins is stepping down as Auth Lead; handing over to Elena Rostova.",
        "Responsible: Tariq Al-Mansoor maintains database migrations and connection pool sizing.",
        "",
        "3. CRITICAL RISKS AND BLOCKERS",
        "Critical Risk: Gateway token bucket rate limiter causes thread starvation under 5,000 req/sec bursts.",
        "Blocker: Third-party Identity Provider does not support OIDC backchannel logout.",
        "",
        "4. NEXT ACTIONS",
        "Next Action: Complete load testing of the session eviction worker before December 1.",
        "Immediate Priority: Rotate TLS private keys across all ingress proxies."
    ]
    create_simple_pdf("sample_documents/Aura_Microservices_Handover.pdf", lines)
    print("Created sample_documents/Aura_Microservices_Handover.pdf")
    
    # Verify with pypdf
    from pypdf import PdfReader
    reader = PdfReader("sample_documents/Aura_Microservices_Handover.pdf")
    print("Read pages:", len(reader.pages))
    extracted = reader.pages[0].extract_text()
    print("Extracted preview:", extracted[:150])
    assert "PROJECT AURA" in extracted
    print("PDF GENERATION AND EXTRACTION TEST PASSED 100%!")

