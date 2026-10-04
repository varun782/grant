import os
import hashlib
import json
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from typing import Optional
from dotenv import load_dotenv

# New imports for file parsing
from PyPDF2 import PdfReader
from docx import Document

load_dotenv()

app = FastAPI(title="Grant Completeness Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL_NAME = "openai/gpt-oss-120b"

def generate_hash(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

# Helper function to read different file types
async def extract_text(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            return "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".doc"):
            # Note: Legacy .doc is a proprietary binary format. 
            # We fallback to standard decoding, but recommend converting to .docx
            return content.decode("utf-8", errors="ignore")
        else:
            # Default to text
            return content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading {filename}: {str(e)}")

@app.post("/api/extract-requirements")
async def extract_requirements(
    guideline: UploadFile = File(...),
    draft: UploadFile = File(...),
    supporting_metadata: str = Form("")
):
    try:
        # Use the new extraction helper
        guideline_text = await extract_text(guideline)
        draft_text = await extract_text(draft)
        
        # Phase 1: Extract all requirements and required documents
        extraction_prompt = f"""
        Extract grant application requirements from the guideline.
        Output strictly in JSON:
        {{
            "mandatory_requirements": [{{"id": "req_1", "text": "Requirement text"}}],
            "recommended_requirements": [{{"id": "rec_1", "text": "Recommendation text"}}],
            "required_documents": ["List of explicitly required attachments/files mentioned"]
        }}
        Guideline Text:
        {guideline_text}
        """

        ext_res = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a precise data extraction engine. You must not make funding eligibility decisions."},
                {"role": "user", "content": extraction_prompt}
            ],
            model=MODEL_NAME,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        extracted = json.loads(ext_res.choices[0].message.content)
        all_reqs = extracted.get('mandatory_requirements', []) + extracted.get('recommended_requirements', [])

        # Phase 2: Map Application to Requirements
        mapping_prompt = f"""
        Map the draft application to the requirements.
        - Quote the exact text from the draft.
        - Rate status as "strong", "weak", "missing", or "ambiguous".
        - Identify if a claim in the draft is NOT supported by the 'Supplied Documents Metadata'.
        
        Output strictly in JSON:
        {{
            "mappings": [
                {{
                    "req_id": "req_1", 
                    "evidence_quote": "Exact text...", 
                    "status": "strong|weak|missing|ambiguous", 
                    "clarification_question": "If weak/missing/ambiguous, ask a specific question to the applicant.",
                    "unsupported_claim_warning": "If they make a claim but lack the supplied document, describe the gap here. Otherwise null."
                }}
            ]
        }}
        Requirements: {json.dumps(all_reqs)}
        Supplied Documents Metadata: {supporting_metadata if supporting_metadata else 'None provided'}
        Draft Text: {draft_text}
        """

        map_res = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a strict evidence mapping engine."},
                {"role": "user", "content": mapping_prompt}
            ],
            model=MODEL_NAME,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        mapped = json.loads(map_res.choices[0].message.content)

        # Deterministic Missing Document Calculation
        supplied_docs_lower = supporting_metadata.lower()
        missing_docs = [
            doc for doc in extracted.get('required_documents', []) 
            if doc.lower() not in supplied_docs_lower
        ]

        return {
            "hashes": {
                "guideline_hash": generate_hash(guideline_text),
                "draft_hash": generate_hash(draft_text)
            },
            "requirements": extracted,
            "mappings": mapped.get("mappings", []),
            "missing_docs": missing_docs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))