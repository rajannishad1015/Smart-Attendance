# SmartAttend AI 🎓📡

**Intelligent Student Attendance & Personalized Learning Platform**

SmartAttend AI connects physical classroom presence (via mmWave/beacon radar signals) with academic engagement and traditional machine learning analytics.

- **Apps**: Student Web App (`frontend/student-app`) + Teacher Web App (`frontend/teacher-app`)
- **Backend**: FastAPI + SQLite/PostgreSQL (SQLAlchemy) + OpenCV Image Processing (`backend`)
- **Machine Learning**: Traditional Machine Learning only (Scikit-learn, XGBoost, Random Forest, Isolation Forest, K-Means, TF-IDF). **Deep Learning is strictly NOT used**.
- **Radar Hardware/Simulation**: Interactive simulator & gateway (`radar/simulator.py`)

---

## 🏛️ System Architecture

```
                         SMARTATTEND AI
                               │
              ┌────────────────┴────────────────┐
              │                                 │
     STUDENT WEB APP                    TEACHER WEB APP
   (http://localhost:3000)            (http://localhost:3001)
              │                                 │
              └──────────────┬──────────────────┘
                             ↓
                      FASTAPI BACKEND
                   (http://127.0.0.1:8000)
                             │
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
    Attendance API      Learning API       Analytics API
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
                     Database (SQLite / Postgres)
                             │
                    TRADITIONAL ML PIPELINE
                             │
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
    Risk Model        Performance Model     Anomaly Model
 (Random Forest)       (Regressor Range)   (Isolation Forest)
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
              Personalized Recommendations (TF-IDF)
                             ↓
                     AI Study Planner
```

### Core Principle
- **Radar** = Presence Signal (Detected 🟢, Weak Signal 🟡, Not Detected 🔴)
- **Student** = Attendance Request (+ optional OpenCV selfie evidence validation)
- **Teacher** = Final Approval (Individual mark, Mark All Detected Present, Audit logging)
- **ML** = Prediction & Intelligence (Explainable risk attribution, performance bounds)

---

## 📸 Application Preview

| Student Web App | Teacher Command Center |
|:---:|:---:|
| ![Student Portal](studentUI.png) | ![Teacher Portal](TeacherUI.png) |

---

## 🚀 Getting Started

### ⚡ 1. Initial Setup (First Time Only)
Double-click `setup.bat` (or run in cmd):
```cmd
setup.bat
```
This automatically verifies Python & Node.js, installs all backend & frontend dependencies, initializes the database, and verifies the ML models.

---

### ⚡ 2. Universal 1-Click Launch
Double-click `start.bat` or `run_all.bat`:
```cmd
run_all.bat
```

**This automatically:**
1. Starts the **FastAPI Backend** (Port `8000`).
2. Starts the **Student Web App** (Port `3000`).
3. Starts the **Teacher Web App** (Port `3001`).
4. Automatically opens both portals in your default browser!

To stop all services cleanly anytime, double-click:
```cmd
stop_all.bat
```

---

### 🔬 Option C: Faculty Demonstration & ML Evaluation Notebooks (Jupyter)
For presenting in front of teachers, project review panels, or viva examiners:
- **Clean Official Academic Demo**: [`SmartAttend_AI_Project_Demonstration.ipynb`](SmartAttend_AI_Project_Demonstration.ipynb) *(Pure technical explanations, no student scripts)*
- **Presentation & Viva Prep Version**: [`SmartAttend_AI_Teacher_Presentation.ipynb`](SmartAttend_AI_Teacher_Presentation.ipynb) *(Includes speaking scripts & viva defense guide)*
- **Demo Dataset**: [`student_demo_dataset.csv`](student_demo_dataset.csv) *(Works locally & in Google Colab)*

**What it showcases:**
1. **Live Data Ingestion**: Imports collegiate records from `student_demo_dataset.csv`.
2. **Attendance Risk Classification**: Predicts `LOW`, `MEDIUM`, `HIGH` risk with **~89.2% Accuracy**, detailed precision/recall/F1 table, Confusion Matrix, and Feature Importance attribution.
3. **Grade Forecasting Regressor**: Predicts final examination score with **$R^2 \approx 0.86$**, **$\text{RMSE} \approx 3.8$ marks**, and confidence bands.
4. **Pedagogical Personas (K-Means)**: Groups students into 4 teaching personas (*Star Performers*, *At-Risk Inconsistent*, *Dedicated Improvers*, *Disengaged*).
5. **Anomaly Detection (Isolation Forest)**: Flags proxy or suspicious presence anomalies.
6. **Interactive Live Predictor**: Enter any student Roll No. (e.g. `S101`, `S102`) or custom values to generate an instant multi-model evaluation card with targeted interventions.
*(All outputs and charts are already pre-rendered in the notebook for immediate presentation!)*

---

### 🛠️ Option B: Manual Command Line Launch

#### 1. Backend API (FastAPI)
```bash
# Navigate to project root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Student Web App
```bash
cd frontend/student-app
npm run dev
```
- Student Portal: `http://localhost:3000`
- Demo User: **Rahul Sharma (S101 • CSE)**

### 3. Teacher Web App
```bash
cd frontend/teacher-app
npm run dev
```
- Teacher Portal: `http://localhost:3001`
- Demo User: **Prof. Aniket Deshmukh (Computer Science Dept.)**

### 4. Retrain Traditional ML Models (Optional)
```bash
python ml/train_all.py
```
Trains and outputs 6 `.joblib` model binaries in `ml/models/`.

### 5. Run Standalone Radar Simulator (CLI)
```bash
python radar/simulator.py
```
Simulates classroom entry and fires radar presence events to the backend.

---

## 👥 Demo Credentials

| Role | Name | Identifier (Email or Roll No.) | Password |
|---|---|---|---|
| **Student 1** | Rahul Sharma | `S101` or `rahul@smartattend.edu` | `password123` |
| **Student 2** | Aditi Patil | `S102` or `aditi@smartattend.edu` | `password123` |
| **Student 3** | Sneha Iyer | `S104` or `sneha@smartattend.edu` | `password123` |
| **Teacher** | Prof. Aniket Deshmukh | `teacher@smartattend.edu` | `password123` |
| **Admin** | Administrator | `admin@smartattend.edu` | `password123` |

---

## 🧠 Traditional Machine Learning Models

1. **Attendance Risk Model (`RandomForestClassifier`)**
   - Predicts: `LOW`, `MEDIUM`, `HIGH` risk with probability.
   - Explainability: Identifies leading contributing factors (e.g. declining streak, quiz drop).
2. **Performance Prediction (`RandomForestRegressor`)**
   - Yields 95% confidence estimated band (e.g., `68% - 74%`).
3. **Engagement Prediction (`RandomForestClassifier`)**
   - Classifies engagement into `HIGH`, `MEDIUM`, or `LOW`.
4. **Attendance Anomaly Detection (`IsolationForest`)**
   - Flags sudden behavioral shifts (contamination = 0.06).
5. **Student Segmentation (`KMeans`, 4 Clusters)**
   - Clusters students into behavioral archetypes (e.g., High Attendance + High Performance).
6. **Recommendation Engine (`TfidfVectorizer` + `cosine_similarity`)**
   - Maps weak topics (e.g., "Probability") to videos, notes, articles, and quizzes.

---

## 📷 OpenCV Selfie Quality Check (No Deep Learning)
- Uses classical computer vision algorithms:
  - **Laplacian Variance** ($Var > 40$) for blur & motion sharpness.
  - **Grayscale Luminance Histogram** ($30 \le \mu \le 235$) for exposure/brightness.
  - **Haar Cascade Frontal Face Classifier** for human face presence.
- Does **NOT** perform facial recognition or store biometric vectors.
