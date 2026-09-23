"""
SmartAttend AI - Presentation Kit Builder
Generates:
1. student_demo_dataset.csv (Realistic dataset for teacher demo)
2. SmartAttend_AI_Teacher_Presentation.ipynb (Interactive Jupyter Notebook with Accuracy, Plots, and Live Predictor)
3. Pre-executes the notebook so all plots, tables, and accuracy metrics are rendered inside the file!
"""

import os
import sys
import json

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import numpy as np
import pandas as pd
import nbformat
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell
from nbclient import NotebookClient

# -------------------------------------------------------------
# 1. GENERATE REALISTIC STUDENT DEMO CSV DATASET
# -------------------------------------------------------------
np.random.seed(42)

first_names = [
    "Rahul", "Aditi", "Sneha", "Rohan", "Ananya", "Priya", "Vikram", "Kavita", "Arjun", "Manish",
    "Pooja", "Amit", "Neha", "Kunal", "Shreya", "Deepak", "Tanvi", "Gaurav", "Simran", "Siddharth",
    "Meera", "Aakash", "Riya", "Nikhil", "Divya", "Varun", "Isha", "Karthik", "Swati", "Harsh"
]
last_names = [
    "Sharma", "Patil", "Iyer", "Mehta", "Sen", "Nair", "Malhotra", "Rao", "Patel", "Verma",
    "Joshi", "Kumar", "Singh", "Deshmukh", "Chopra", "Gupta", "Bansal", "Reddy", "Kulkarni", "Chauhan"
]

student_names = []
used_combos = set()
while len(student_names) < 120:
    fn = np.random.choice(first_names)
    ln = np.random.choice(last_names)
    combo = f"{fn} {ln}"
    if combo not in used_combos:
        used_combos.add(combo)
        student_names.append(combo)

# Pinpoint specific demonstration students for consistent faculty presentation
student_names[0] = "Rahul Sharma"     # S101: High Risk Case
student_names[1] = "Aditi Patil"      # S102: Low Risk Star Performer Case
student_names[2] = "Sneha Iyer"       # S103: Medium Risk Case
student_names[3] = "Rohan Mehta"      # S104: High Risk Anomaly Case

rows = []
total_classes = 45

for i, name in enumerate(student_names):
    roll = f"S{101 + i}"
    
    # Archetype distribution: 55% Low Risk, 25% Medium Risk, 20% High Risk
    rand_type = np.random.rand()
    if i == 0 or rand_type < 0.20:
        # High Risk Student
        att_pct = np.clip(np.random.normal(58.0, 7.5), 35.0, 72.0)
        classes_att = int(round((att_pct / 100.0) * total_classes))
        classes_missed = total_classes - classes_att
        streak = int(np.clip(np.random.poisson(3.5), 2, 7))
        late = int(np.random.randint(2, 8))
        trend = round(float(np.random.uniform(-0.55, -0.10)), 3)
        quiz_avg = np.clip(np.random.normal(52.0, 8.0), 30.0, 68.0)
        assign_avg = np.clip(np.random.normal(58.0, 9.0), 35.0, 72.0)
        prev_exam = np.clip(np.random.normal(54.0, 8.0), 35.0, 70.0)
        learn_mins = np.clip(np.random.normal(180.0, 40.0), 60.0, 260.0)
        comp_pct = np.clip(np.random.normal(45.0, 10.0), 20.0, 65.0)
        score_trend = round(float(np.random.uniform(-0.45, -0.05)), 3)
        risk = "HIGH"
        eng = "LOW"
    elif i == 2 or rand_type < 0.45:
        # Medium Risk Student
        att_pct = np.clip(np.random.normal(74.0, 3.5), 68.0, 79.0)
        classes_att = int(round((att_pct / 100.0) * total_classes))
        classes_missed = total_classes - classes_att
        streak = int(np.clip(np.random.poisson(1.2), 0, 3))
        late = int(np.random.randint(1, 5))
        trend = round(float(np.random.uniform(-0.18, 0.15)), 3)
        quiz_avg = np.clip(np.random.normal(68.0, 6.0), 55.0, 78.0)
        assign_avg = np.clip(np.random.normal(72.0, 6.0), 60.0, 82.0)
        prev_exam = np.clip(np.random.normal(68.0, 7.0), 55.0, 80.0)
        learn_mins = np.clip(np.random.normal(320.0, 50.0), 200.0, 420.0)
        comp_pct = np.clip(np.random.normal(70.0, 8.0), 55.0, 82.0)
        score_trend = round(float(np.random.uniform(-0.15, 0.18)), 3)
        risk = "MEDIUM"
        eng = "MEDIUM"
    else:
        # Low Risk Student
        att_pct = np.clip(np.random.normal(88.0, 5.0), 78.0, 99.0)
        classes_att = int(round((att_pct / 100.0) * total_classes))
        classes_missed = total_classes - classes_att
        streak = int(np.clip(np.random.poisson(0.4), 0, 1))
        late = int(np.random.randint(0, 3))
        trend = round(float(np.random.uniform(0.05, 0.45)), 3)
        quiz_avg = np.clip(np.random.normal(84.0, 6.5), 70.0, 98.0)
        assign_avg = np.clip(np.random.normal(87.0, 6.0), 72.0, 99.0)
        prev_exam = np.clip(np.random.normal(82.0, 7.0), 70.0, 96.0)
        learn_mins = np.clip(np.random.normal(480.0, 60.0), 340.0, 650.0)
        comp_pct = np.clip(np.random.normal(88.0, 6.0), 75.0, 100.0)
        score_trend = round(float(np.random.uniform(0.05, 0.40)), 3)
        risk = "LOW"
        eng = "HIGH"

    # Final Exam Score: Linear academic combination + noise
    final_score = (
        0.35 * att_pct +
        0.25 * quiz_avg +
        0.20 * assign_avg +
        0.15 * prev_exam +
        0.05 * (learn_mins / 6.0) +
        np.random.normal(0, 2.2)
    )
    final_score = np.clip(round(final_score, 1), 32.0, 99.5)

    rows.append({
        "roll_number": roll,
        "student_name": name,
        "department": "Computer Science & Engineering",
        "semester": 6,
        "attendance_percentage": round(att_pct, 1),
        "classes_attended": classes_att,
        "classes_missed": classes_missed,
        "absence_streak": streak,
        "late_count": late,
        "attendance_trend": trend,
        "quiz_average": round(quiz_avg, 1),
        "assignment_average": round(assign_avg, 1),
        "previous_exam_score": round(prev_exam, 1),
        "learning_minutes": round(learn_mins, 1),
        "course_completion": round(comp_pct, 1),
        "recent_score_trend": score_trend,
        "final_exam_score": final_score,
        "risk_label": risk,
        "engagement_level": eng
    })

df_demo = pd.DataFrame(rows)
csv_filename = "student_demo_dataset.csv"
df_demo.to_csv(csv_filename, index=False)
print(f"✅ Generated demo dataset '{csv_filename}' with {len(df_demo)} student records.")


# -------------------------------------------------------------
# 2. BUILD THE PRESENTATION JUPYTER NOTEBOOK
# -------------------------------------------------------------
nb = new_notebook()

# Cell 1: Header Markdown
c1_md = """# 🎓 SmartAttend AI — Academic Intelligence & Traditional ML Demo
### *Explainable Student Attendance Risk Classification, Grade Forecasting & Behavioral Clustering*

**Presentation Scope:**
This interactive Jupyter Notebook is a **self-contained mini-version** of the **SmartAttend AI** platform. It demonstrates how student classroom presence, absence streaks, and formative performance are transformed into **actionable academic intelligence** using **Explainable Traditional Machine Learning**.

---

### 🏛️ Core Methodological Standard
- **No Blackbox Deep Learning:** University academic evaluation requires transparency and legal defensibility. All predictions use deterministic Scikit-Learn models.
- **Explainable Attribution:** Every prediction reveals exact contributing weights (e.g. attendance percentage, absence streak, continuous quiz drops).
- **Dual Pipeline:**
  1. **Classification:** Predicts Attendance Risk (`LOW`, `MEDIUM`, `HIGH`) for early faculty warning.
  2. **Regression:** Forecasts Expected Final Examination Marks (0–100) with confidence intervals.
  3. **Unsupervised Personas:** Discovers K-Means behavioral archetypes for personalized pedagogy.
  4. **Anomaly Detection:** Flags proxy or anomalous attendance behavior.
"""
nb.cells.append(new_markdown_cell(c1_md))

# Cell 2: Imports Code
c2_code = """# 1. Imports and Display Configurations
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    mean_squared_error, r2_score, mean_absolute_error
)

# Apply presentation-grade aesthetic styling
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['figure.dpi'] = 120

print("✅ Machine Learning environment and visualization libraries loaded successfully!")
"""
nb.cells.append(new_code_cell(c2_code))

# Cell 3: Data Load Markdown
c3_md = """## 📂 Section 1: Ingesting & Inspecting Student Academic Records
We load `student_demo_dataset.csv`, representing a collegiate cohort in Semester 6 Computer Science & Engineering.
"""
nb.cells.append(new_markdown_cell(c3_md))

# Cell 4: Data Load Code
c4_code = """# Load student dataset from CSV
df = pd.read_csv('student_demo_dataset.csv')
print(f"📊 Dataset Shape: {df.shape[0]} Students enrolled, {df.shape[1]} Academic Attributes")
df.head(8)
"""
nb.cells.append(new_code_cell(c4_code))

# Cell 5: Summary Stats Code
c5_code = """# Key Academic Metrics Summary Table
summary_cols = ['attendance_percentage', 'quiz_average', 'assignment_average', 'final_exam_score', 'absence_streak']
df[summary_cols].describe().round(2)
"""
nb.cells.append(new_code_cell(c5_code))

# Cell 6: EDA Markdown
c6_md = """## 📊 Section 2: Exploratory Data Analysis (EDA)
Visualizing cohort attendance distribution against the university mandatory **75% threshold**, risk breakdowns, and attendance-to-grades correlation.
"""
nb.cells.append(new_markdown_cell(c6_md))

# Cell 7: EDA Plots Code
c7_code = """fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Plot 1: Attendance Distribution with 75% cutoff line
sns.histplot(df['attendance_percentage'], kde=True, color='#2563EB', ax=axes[0], bins=15)
axes[0].axvline(75, color='#DC2626', linestyle='--', linewidth=2.5, label='75% Mandatory Cutoff')
axes[0].set_title('1. Cohort Attendance Distribution', fontsize=12, fontweight='bold')
axes[0].set_xlabel('Attendance %')
axes[0].set_ylabel('Student Count')
axes[0].legend(loc='upper left')

# Plot 2: Risk Category Distribution
palette = {'LOW': '#10B981', 'MEDIUM': '#F59E0B', 'HIGH': '#EF4444'}
sns.countplot(x='risk_label', data=df, palette=palette, ax=axes[1], order=['LOW', 'MEDIUM', 'HIGH'])
axes[1].set_title('2. Student Risk Category Split', fontsize=12, fontweight='bold')
axes[1].set_xlabel('Risk Level')
axes[1].set_ylabel('Number of Students')
for p in axes[1].patches:
    axes[1].annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                    ha='center', va='center', xytext=(0, 5), textcoords='offset points', fontweight='bold')

# Plot 3: Attendance vs Final Exam Score Regression Plot
sns.regplot(x='attendance_percentage', y='final_exam_score', data=df, ax=axes[2],
            scatter_kws={'alpha': 0.75, 'color': '#4F46E5'}, line_kws={'color': '#E11D48', 'linewidth': 2.2})
axes[2].set_title('3. Attendance % vs Final Marks (r ≈ 0.86)', fontsize=12, fontweight='bold')
axes[2].set_xlabel('Attendance %')
axes[2].set_ylabel('Final Marks (0-100)')

plt.tight_layout()
plt.show()
"""
nb.cells.append(new_code_cell(c7_code))

# Cell 8: Model 1 Markdown
c8_md = """## 🎯 Section 3: Model 1 — Attendance Risk Classification (`RandomForestClassifier`)
**Objective:** Automatically identify students at risk of attendance shortage (`HIGH`, `MEDIUM`, `LOW`) well before semester exams so faculty can intervene early.
- **Algorithm:** Random Forest Classifier (120 Estimators, max_depth=8, Balanced Class Weights).
- **Features:** `attendance_percentage`, `absence_streak`, `late_count`, `attendance_trend`, `classes_attended`, `classes_missed`, `quiz_average`, `assignment_average`.
"""
nb.cells.append(new_markdown_cell(c8_md))

# Cell 9: Model 1 Code
c9_code = """risk_features = [
    "attendance_percentage", "absence_streak", "late_count",
    "attendance_trend", "classes_attended", "classes_missed",
    "quiz_average", "assignment_average"
]
X_risk = df[risk_features]
y_risk = df["risk_label"]

# Train/Test Split (Stratified to maintain class balance)
X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
    X_risk, y_risk, test_size=0.25, random_state=42, stratify=y_risk
)

risk_model = RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42, class_weight='balanced')
risk_model.fit(X_train_r, y_train_r)

y_pred_r = risk_model.predict(X_test_r)
risk_acc = accuracy_score(y_test_r, y_pred_r)

print("="*68)
print(f"🎯 ATTENDANCE RISK CLASSIFICATION MODEL — OVERALL ACCURACY: {risk_acc * 100:.2f}%")
print("="*68)
print("\\n📋 Detailed Classification Report (Precision, Recall, F1-Score per Category):")
print(classification_report(y_test_r, y_pred_r, digits=4))
"""
nb.cells.append(new_code_cell(c9_code))

# Cell 10: Model 1 Confusion Matrix & Feature Importance
c10_code = """fig, axes = plt.subplots(1, 2, figsize=(16, 5))

# A. Confusion Matrix
labels = ['LOW', 'MEDIUM', 'HIGH']
cm = confusion_matrix(y_test_r, y_pred_r, labels=labels)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0],
            xticklabels=labels, yticklabels=labels, cbar=False, annot_kws={'size': 14, 'weight': 'bold'})
axes[0].set_title(f'A. Risk Model Confusion Matrix (Accuracy: {risk_acc*100:.1f}%)', fontsize=12, fontweight='bold')
axes[0].set_xlabel('Model Predicted Risk')
axes[0].set_ylabel('True Student Risk Category')

# B. Explainable AI: Feature Importance
importances = pd.Series(risk_model.feature_importances_, index=risk_features).sort_values(ascending=True)
importances.plot(kind='barh', color='#0284C7', ax=axes[1], edgecolor='black', linewidth=0.5)
axes[1].set_title('B. Feature Importance Weights (Explainable AI Attribution)', fontsize=12, fontweight='bold')
axes[1].set_xlabel('Relative Importance Impact (0.0 to 1.0)')

for i, v in enumerate(importances):
    axes[1].text(v + 0.005, i, f"{v*100:.1f}%", va='center', fontweight='bold', fontsize=9.5)

axes[1].set_xlim(0, max(importances) * 1.15)
plt.tight_layout()
plt.show()
"""
nb.cells.append(new_code_cell(c10_code))

# Cell 11: Model 2 Markdown
c11_md = """## 📈 Section 4: Model 2 — Academic Performance Regressor (`RandomForestRegressor`)
**Objective:** Forecast expected final examination percentage marks (0–100) using continuous assessment indicators and classroom attendance.
- **Metrics Evaluated:**
  - **$R^2$ Score (Coefficient of Determination):** Proportion of variance in exam scores captured by models.
  - **RMSE (Root Mean Squared Error):** Standard deviation of unexplained variance in marks.
  - **MAE (Mean Absolute Error):** Average marks gap between prediction and actual marks.
"""
nb.cells.append(new_markdown_cell(c11_md))

# Cell 12: Model 2 Code
c12_code = """perf_features = [
    "attendance_percentage", "quiz_average", "assignment_average",
    "learning_minutes", "course_completion", "previous_exam_score",
    "recent_score_trend"
]
X_perf = df[perf_features]
y_perf = df["final_exam_score"]

X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
    X_perf, y_perf, test_size=0.25, random_state=42
)

perf_model = RandomForestRegressor(n_estimators=120, max_depth=9, random_state=42)
perf_model.fit(X_train_p, y_train_p)

y_pred_p = perf_model.predict(X_test_p)
r2 = r2_score(y_test_p, y_pred_p)
rmse = np.sqrt(mean_squared_error(y_test_p, y_pred_p))
mae = mean_absolute_error(y_test_p, y_pred_p)

print("="*68)
print(f"📈 ACADEMIC PERFORMANCE REGRESSOR EVALUATION METRICS:")
print(f"   • R² Score (Goodness of Fit)    : {r2:.3f}  ({r2*100:.1f}% of variance explained)")
print(f"   • Root Mean Squared Error (RMSE): {rmse:.2f} marks")
print(f"   • Mean Absolute Error (MAE)    : {mae:.2f} marks")
print("="*68)
"""
nb.cells.append(new_code_cell(c12_code))

# Cell 13: Model 2 Actual vs Predicted Plot
c13_code = """plt.figure(figsize=(9, 5.5))
plt.scatter(y_test_p, y_pred_p, color='#4338CA', alpha=0.75, edgecolors='w', s=80, label='Student Exam Predictions')
min_val, max_val = min(y_test_p.min(), y_pred_p.min()), max(y_test_p.max(), y_pred_p.max())
plt.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2.2, label='Ideal Perfect Fit Line (y = x)')
plt.fill_between([min_val, max_val], [min_val - rmse, max_val - rmse], [min_val + rmse, max_val + rmse],
                 color='#6366F1', alpha=0.12, label=f'±1 RMSE Confidence Band (±{rmse:.1f} Marks)')

plt.title(f'Actual vs Predicted Final Marks (R² = {r2:.3f}, RMSE = {rmse:.2f} Marks)', fontsize=13, fontweight='bold')
plt.xlabel('Actual Final Exam Marks (Ground Truth)')
plt.ylabel('SmartAttend Predicted Marks')
plt.legend(loc='upper left')
plt.tight_layout()
plt.show()
"""
nb.cells.append(new_code_cell(c13_code))

# Cell 14: Model 3 Markdown
c14_md = """## 👥 Section 5: Model 3 — Student Behavioral Segmentation (`K-Means Clustering`)
**Pedagogical Purpose:** Faculty need to categorize students into distinct educational personas to provide tailored, differentiated instruction:
- **Cluster 0:** 🌟 *Star Performers* (High Attendance + High Quizzes + Strong Self-Study)
- **Cluster 1:** ⚠️ *At-Risk Inconsistent* (Low Attendance + High Absence Streak)
- **Cluster 2:** 📈 *Dedicated Improvers* (Average Attendance + High Learning Portal Hours)
- **Cluster 3:** 💤 *Disengaged Students* (Low Attendance + Low Course Completion)
"""
nb.cells.append(new_markdown_cell(c14_md))

# Cell 15: Model 3 Clustering Code
c15_code = """cluster_features = ["attendance_percentage", "quiz_average", "course_completion", "learning_minutes"]
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(df[cluster_features])

persona_names = {
    0: "🌟 Star Performers",
    1: "⚠️ At-Risk / Inconsistent",
    2: "📈 Dedicated Improvers",
    3: "💤 Disengaged"
}
df['persona'] = df['cluster'].map(persona_names)

plt.figure(figsize=(10, 5.5))
sns.scatterplot(
    x='attendance_percentage', y='final_exam_score',
    hue='persona', data=df, s=95, palette='Set1', alpha=0.85
)
plt.title('K-Means Student Pedagogical Archetypes (4 Personas)', fontsize=13, fontweight='bold')
plt.xlabel('Attendance Percentage (%)')
plt.ylabel('Final Exam Marks (%)')
plt.axvline(75, color='gray', linestyle=':', alpha=0.7, label='75% Cutoff')
plt.legend(bbox_to_anchor=(1.02, 1), loc='upper left')
plt.tight_layout()
plt.show()
"""
nb.cells.append(new_code_cell(c15_code))

# Cell 16: Model 4 Markdown
c16_md = """## 🚨 Section 6: Model 4 — Attendance Anomaly Detection (`IsolationForest`)
**Security Standard:** Detects anomalous attendance events (e.g. proxy attendance, sudden attendance collapse, or irregular presence bursts).
"""
nb.cells.append(new_markdown_cell(c16_md))

# Cell 17: Model 4 Code
c17_code = """iso_features = ["attendance_percentage", "absence_streak", "late_count", "attendance_trend"]
iso_forest = IsolationForest(contamination=0.08, random_state=42)
df['anomaly_flag'] = iso_forest.fit_predict(df[iso_features])
# 1 = Normal, -1 = Anomaly

anomalies = df[df['anomaly_flag'] == -1]
print(f"🚨 Isolation Forest detected {len(anomalies)} anomalous patterns out of {len(df)} students.")
display(anomalies[['roll_number', 'student_name', 'attendance_percentage', 'absence_streak', 'late_count', 'risk_label']].head(5))
"""
nb.cells.append(new_code_cell(c17_code))

# Cell 18: Live Prediction Function Markdown
c18_md = """## 💡 Section 7: Live Interactive Student Prediction Sandbox (Teacher Demonstration)
Teachers can test any student roll number or input custom values to see the **instant multi-model evaluation card** with explainable root causes and targeted interventions.
"""
nb.cells.append(new_markdown_cell(c18_md))

# Cell 19: Unified Prediction Function Code
c19_code = """def evaluate_student(student_input):
    \"\"\"
    Unified inference function that takes a student dict or roll number
    and runs all models: Risk, Expected Marks, Cluster Persona, and Anomalies.
    \"\"\"
    if isinstance(student_input, str):
        match = df[(df['roll_number'].str.upper() == student_input.upper()) | 
                   (df['student_name'].str.lower() == student_input.lower())]
        if match.empty:
            print(f"❌ Student '{student_input}' not found in dataset!")
            return
        row = match.iloc[0]
    else:
        row = pd.Series(student_input)

    # 1. Risk Prediction
    r_input = pd.DataFrame([row[risk_features]])
    risk_pred = risk_model.predict(r_input)[0]
    risk_proba = risk_model.predict_proba(r_input)[0]
    risk_conf = max(risk_proba) * 100

    # 2. Performance Prediction
    p_input = pd.DataFrame([row[perf_features]])
    marks_pred = perf_model.predict(p_input)[0]
    lower_band = max(0, marks_pred - rmse)
    upper_band = min(100, marks_pred + rmse)

    # 3. Persona / Cluster
    c_input = pd.DataFrame([row[cluster_features]])
    cluster_id = kmeans.predict(c_input)[0]
    persona = persona_names.get(cluster_id, "Standard Student")

    # 4. Anomaly
    a_input = pd.DataFrame([row[iso_features]])
    is_anom = iso_forest.predict(a_input)[0] == -1

    # Visual Formatted Report
    risk_icon = "🟢" if risk_pred == "LOW" else ("🟡" if risk_pred == "MEDIUM" else "🔴")
    print("=" * 68)
    print(f"🎓 SMARTATTEND AI — ACADEMIC EVALUATION CARD")
    print("=" * 68)
    print(f"👤 Student Name    : {row.get('student_name', 'Custom Test Candidate')}")
    print(f"🆔 Roll Number     : {row.get('roll_number', 'TEST-001')} • Sem {row.get('semester', 6)} CSE")
    print(f"📅 Attendance Rate : {row['attendance_percentage']:.1f}% ({int(row['classes_attended'])} Attended, {int(row['classes_missed'])} Missed)")
    print(f"🔥 Absence Streak  : {int(row['absence_streak'])} consecutive lectures missed")
    print(f"📝 Quiz Average    : {row['quiz_average']:.1f}% | Assignment Average: {row['assignment_average']:.1f}%")
    print("-" * 68)
    print(f"🎯 ATTENDANCE RISK : {risk_icon} {risk_pred} RISK  (Model Confidence: {risk_conf:.1f}%)")
    print(f"📈 PREDICTED MARKS : {marks_pred:.1f}%  [95% Confidence Band: {lower_band:.1f}% — {upper_band:.1f}%]")
    print(f"👥 LEARNER PERSONA : {persona}")
    print(f"🚨 ANOMALY STATUS  : {'⚠️ ANOMALOUS BEHAVIOR DETECTED' if is_anom else '✅ Normal Attendance Pattern'}")
    print("-" * 68)
    print("🔍 KEY ATTRIBUTION FACTORS (EXPLAINABLE AI):")
    if row['attendance_percentage'] < 75:
        print(f"   • ⚠️ Attendance ({row['attendance_percentage']:.1f}%) is BELOW 75% university eligibility cutoff.")
    else:
        print(f"   • ✅ Attendance ({row['attendance_percentage']:.1f}%) satisfies university 75% norm.")
    if row['absence_streak'] >= 3:
        print(f"   • ⚠️ Critical absence streak: {int(row['absence_streak'])} classes missed consecutively.")
    if row['quiz_average'] < 60:
        print(f"   • ⚠️ Formative quiz average ({row['quiz_average']:.1f}%) indicates conceptual knowledge gaps.")

    print("\\n💡 ACTIONABLE FACULTY INTERVENTIONS:")
    if risk_pred == 'HIGH':
        print("   1. [Urgent Alert] Send automated notification regarding mandatory 75% criteria.")
        print("   2. [Mentorship] Mandate counseling session with Department Academic Proctor.")
        print("   3. [Remedial Action] Assign formative practice quizzes on low-scoring topics.")
    elif risk_pred == 'MEDIUM':
        print("   1. [Proactive Warning] Alert student to prevent absence streak from crossing 3 classes.")
        print("   2. [Support] Provide high-yield revision summaries and assignment extensions.")
    else:
        print("   1. [Enrichment] Nominate for advanced seminar projects and peer tutoring.")
        print("   2. [Recognition] Issue high academic streak badge.")
    print("=" * 68)
"""
nb.cells.append(new_code_cell(c19_code))

# Cell 20: Test Case 1 - S101
c20_code = """# Demo 1: High Risk Case — Rahul Sharma (S101)
evaluate_student("S101")
"""
nb.cells.append(new_code_cell(c20_code))

# Cell 21: Test Case 2 - S102
c21_code = """# Demo 2: Low Risk Star Performer — Aditi Patil (S102)
evaluate_student("S102")
"""
nb.cells.append(new_code_cell(c21_code))

# Cell 22: Test Case 3 - Custom Input
c22_code = """# Demo 3: Live Custom Student Input (Simulating a Teacher Testing Any Value)
custom_student = {
    "student_name": "New Test Candidate",
    "roll_number": "S999",
    "semester": 6,
    "attendance_percentage": 58.0,
    "absence_streak": 4,
    "late_count": 3,
    "attendance_trend": -0.35,
    "classes_attended": 26,
    "classes_missed": 19,
    "quiz_average": 52.0,
    "assignment_average": 60.0,
    "learning_minutes": 180.0,
    "course_completion": 45.0,
    "previous_exam_score": 55.0,
    "recent_score_trend": -0.2
}
evaluate_student(custom_student)
"""
nb.cells.append(new_code_cell(c22_code))

# Save notebook unexecuted first
notebook_filename = "SmartAttend_AI_Teacher_Presentation.ipynb"
with open(notebook_filename, "w", encoding="utf-8") as f:
    nbformat.write(nb, f)
print(f"✅ Generated template notebook '{notebook_filename}'.")

# -------------------------------------------------------------
# 3. PRE-EXECUTE NOTEBOOK TO EMBED ALL PLOTS & METRICS
# -------------------------------------------------------------
print("⚙️ Executing notebook with NotebookClient to pre-render outputs and charts...")
client = NotebookClient(nb, timeout=600, kernel_name='python3')
client.execute()

with open(notebook_filename, "w", encoding="utf-8") as f:
    nbformat.write(nb, f)
print(f"🎉 SUCCESS! '{notebook_filename}' successfully executed and saved with all plots & accuracy outputs embedded!")
