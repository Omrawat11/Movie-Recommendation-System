# CineSense AI

CineSense AI is a content-based movie recommendation system. It processes a dataset of 4,803 movies and suggests the top 5 most similar films based on text metadata similarity.

## System Architecture

```
Frontend (HTML, CSS, Vanilla JS)
       │
       ▼
FastAPI Backend (Python)
       │
       ├─► CountVectorizer + Cosine Similarity (Local Dataset)
       ▼
OMDb API (Poster & Movie Metadata)
```

* **Recommendation Logic**: Recommendations are calculated locally on the backend using standard NLP feature vectorization (`CountVectorizer`) and vector angular distance mapping (`Cosine Similarity`) on the stemmed metadata tags (overview, genres, keywords, cast, and director).
* **Display Data**: OMDb is used exclusively to fetch external metadata (such as posters, plots, and genres) for UI display. OMDb does not generate the recommendations.

---

## Local Setup

### 1. Backend Setup

Open a terminal in the project root directory.

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   ```

2. **Activate Virtual Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     venv\Scripts\activate.bat
     ```
   * **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   * Copy `.env.example` to `.env`.
   * Open `.env` and fill in your OMDb API key:
     ```text
     OMDB_API_KEY=your_real_key_here
     ```

5. **Start the API Server**:
   ```bash
   uvicorn backend.main:app --reload
   ```

6. **View API Documentation**:
   Access the interactive documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### 2. Frontend Setup

1. Open `index.html` in VS Code.
2. Right-click and choose **Open with Live Server** (serves on `http://127.0.0.1:5500` or similar port).
3. The frontend is fully connected to the FastAPI server running on `http://127.0.0.1:8000`.
