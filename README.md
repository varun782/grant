Live Application link : https://grant-application-completeness-assi-beta.vercel.app/

# Grant Application Completeness Assistant

An AI-powered application that reviews draft funding applications against supplied grant guidelines. It uses a decoupled architecture with a Next.js frontend and a FastAPI backend to extract requirements, map evidence, track missing documents, and calculate a deterministic completeness score.

## Features
* **AI Requirements Extraction:** Automatically extracts mandatory and recommended requirements from grant guidelines.
* **Evidence Mapping:** Maps draft application content to requirements, citing exact quotes and identifying weak or missing evidence.
* **Document Tracking:** Cross-references required attachments against user-supplied metadata to flag missing documents.
* **Human-in-the-Loop Review:** AI suggestions remain pending until a human user confirms, corrects, or rejects them.
* **Deterministic Scoring:** The completion percentage is calculated via strict math based on human-confirmed requirements, keeping the AI out of final decision-making.
* **Multi-Format Support:** Accepts `.txt`, `.pdf`, `.docx`, and `.doc` files.

## Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons
* **Backend:** FastAPI (Python), PyPDF2, python-docx
* **AI Engine:** Groq API (`openai/gpt-oss-120b`)

## Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Python](https://www.python.org/downloads/) (3.8 or higher)
* A [Groq API Key](https://console.groq.com/keys)

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/LuckyTaorem/Grant-Application-Completeness-Assistant
cd Grant-Application-Completeness-Assistant
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install the dependencies:
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder and add your Groq API key:
```text
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install the Node dependencies:
```bash
cd frontend
npm install
npm install lucide-react
```

## Running the Application

You need to run both the backend and frontend servers simultaneously in two separate terminal windows.

**Start the Backend (Terminal 1):**
```bash
cd backend
# Ensure venv is activated
uvicorn main:app --reload
```
*The API will run on `http://127.0.0.1:8000`*

**Start the Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```
*The UI will run on `http://localhost:3000`*

## Usage Guide
1. Open your browser and navigate to `http://localhost:3000`.
2. Upload a **Grant Guideline** document (PDF, Word, or TXT).
3. Upload a **Draft Application** document.
4. *(Optional)* Paste metadata for attached documents (e.g., "Attached: tax_return_2023.pdf") into the metadata text area.
5. Click **Run AI Analysis**.
6. Review the AI's proposed mappings. Use the **Confirm**, **Correct**, or **Reject** buttons to finalize the evidence.
7. Click **Generate Reviewed Summary** to export a clean text summary of your application's completeness.

## Disclaimer
This tool provides automated completeness checking based on text analysis. It does not guarantee funding eligibility, legal compliance, or application success.
