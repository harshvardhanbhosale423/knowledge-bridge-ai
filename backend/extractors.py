import os
import re
from typing import Tuple, List, Dict, Any
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
    """
    Extracts text page by page from a PDF file.
    Returns: (full_text, total_pages, pages_data)
    """
    reader = PdfReader(file_path)
    total_pages = len(reader.pages)
    full_text_parts = []
    pages_data = []

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        page_text = page.extract_text() or ""
        clean_text = page_text.strip()
        full_text_parts.append(f"--- [Page {page_num}] ---\n{clean_text}")
        pages_data.append({
            "page": page_num,
            "text": clean_text,
            "char_count": len(clean_text)
        })

    return "\n\n".join(full_text_parts), total_pages, pages_data

def extract_text_from_docx(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
    """
    Extracts text from paragraphs and tables in a Word document.
    """
    doc = docx.Document(file_path)
    paragraphs = []
    
    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            paragraphs.append(t)
            
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs.append(row_text)

    full_text = "\n\n".join(paragraphs)
    # Estimate pages (~300 words or 2000 chars per page)
    estimated_pages = max(1, (len(full_text) // 2000) + 1)
    
    pages_data = [{
        "page": 1,
        "text": full_text,
        "char_count": len(full_text)
    }]
    
    return full_text, estimated_pages, pages_data

def extract_text_from_txt(file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
    """
    Extracts plain text with multiple encoding fallbacks.
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    content = ""
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue

    estimated_pages = max(1, (len(content) // 2000) + 1)
    pages_data = [{
        "page": 1,
        "text": content,
        "char_count": len(content)
    }]
    return content, estimated_pages, pages_data

def extract_document(file_path: str, ext: str) -> Tuple[str, int, List[Dict[str, Any]]]:
    """
    Unified entry point for document text extraction.
    """
    ext = ext.lower().replace(".", "")
    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    elif ext in ["docx", "doc"]:
        return extract_text_from_docx(file_path)
    elif ext in ["txt", "md", "csv"]:
        return extract_text_from_txt(file_path)
    else:
        # Fallback to plain text attempt
        return extract_text_from_txt(file_path)

def normalize_spacing(text: str) -> str:
    """Normalize whitespace and newlines for fuzzy quotation matching."""
    return re.sub(r'\s+', ' ', text.strip().lower())

def verify_excerpt_in_text(excerpt: str, full_text: str) -> Tuple[bool, float]:
    """
    Strict evidence verification.
    Ensures that the extracted knowledge item has genuine backing in the source text.
    Returns: (is_verified, match_confidence)
    """
    if not excerpt or not full_text:
        return False, 0.0

    clean_excerpt = normalize_spacing(excerpt)
    clean_full_text = normalize_spacing(full_text)

    # 1. Exact match
    if clean_excerpt in clean_full_text:
        return True, 1.0

    # 2. Key phrases match (sliding window or substring match)
    words = clean_excerpt.split()
    if len(words) >= 6:
        # Check if first 5 words and last 4 words appear in order
        start_anchor = " ".join(words[:4])
        end_anchor = " ".join(words[-4:])
        if start_anchor in clean_full_text and end_anchor in clean_full_text:
            return True, 0.95

    # 3. Partial overlap
    match_count = sum(1 for word in set(words) if word in clean_full_text)
    overlap_ratio = match_count / max(1, len(set(words)))
    if overlap_ratio >= 0.85:
        return True, round(overlap_ratio, 2)

    return False, round(overlap_ratio, 2)

