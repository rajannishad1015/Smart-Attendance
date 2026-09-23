"""
SmartAttend AI - Traditional ML Pipeline Training Script
Trains:
1. Attendance Risk Model (RandomForestClassifier)
2. Performance Prediction Model (RandomForestRegressor)
3. Engagement Prediction Model (RandomForestClassifier)
4. Attendance Anomaly Detection Model (IsolationForest)
5. Student Segmentation Model (KMeans)
6. Content Recommendation TF-IDF Index (TfidfVectorizer)
NO Deep Learning - strictly traditional ML algorithms.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, mean_squared_error, r2_score

from ml.data.generate_dataset import generate_dataset


def train_and_save_models():
    os.makedirs("ml/models", exist_ok=True)
    os.makedirs("ml/data", exist_ok=True)

    data_path = "ml/data/collegiate_student_data.csv"
    if os.path.exists(data_path):
        df = pd.read_csv(data_path)
    else:
        df = generate_dataset(5000)
        df.to_csv(data_path, index=False)

    print(f"Loaded dataset with {len(df)} samples.")

    # -------------------------------------------------------------
    # 1. Attendance Risk Model
    # Features: attendance_percentage, absence_streak, late_count,
    #           attendance_trend, classes_attended, classes_missed,
    #           quiz_average, assignment_average
    # Target: risk_label ('LOW', 'MEDIUM', 'HIGH')
    # -------------------------------------------------------------
    risk_features = [
        "attendance_percentage",
        "absence_streak",
        "late_count",
        "attendance_trend",
        "classes_attended",
        "classes_missed",
        "quiz_average",
        "assignment_average"
    ]
    X_risk = df[risk_features]
    y_risk = df["risk_label"]

    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X_risk, y_risk, test_size=0.2, random_state=42, stratify=y_risk
    )

    risk_clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        random_state=42,
        class_weight="balanced"
    )
    risk_clf.fit(X_train_r, y_train_r)

    y_pred_r = risk_clf.predict(X_test_r)
    print("\n--- 1. Attendance Risk Model Report ---")
    print(classification_report(y_test_r, y_pred_r))

    feature_importances_risk = dict(zip(risk_features, [round(float(val), 4) for val in risk_clf.feature_importances_]))
    joblib.dump({
        "model": risk_clf,
        "features": risk_features,
        "classes": list(risk_clf.classes_),
        "importances": feature_importances_risk
    }, "ml/models/attendance_risk_model.joblib")
    print("Saved: ml/models/attendance_risk_model.joblib")

    # -------------------------------------------------------------
    # 2. Academic Performance Prediction Model
    # Target: predicted_performance (0-100 float)
    # -------------------------------------------------------------
    perf_features = [
        "attendance_percentage",
        "quiz_average",
        "assignment_average",
        "learning_minutes",
        "course_completion",
        "previous_exam_score",
        "recent_score_trend"
    ]
    X_perf = df[perf_features]
    y_perf = df["predicted_performance"]

    X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
        X_perf, y_perf, test_size=0.2, random_state=42
    )

    perf_reg = RandomForestRegressor(
        n_estimators=100,
        max_depth=9,
        random_state=42
    )
    perf_reg.fit(X_train_p, y_train_p)

    y_pred_p = perf_reg.predict(X_test_p)
    mse = mean_squared_error(y_test_p, y_pred_p)
    r2 = r2_score(y_test_p, y_pred_p)
    print(f"\n--- 2. Performance Regressor: RMSE={np.sqrt(mse):.2f}, R2={r2:.3f} ---")

    joblib.dump({
        "model": perf_reg,
        "features": perf_features,
        "rmse": float(np.sqrt(mse))
    }, "ml/models/performance_model.joblib")
    print("Saved: ml/models/performance_model.joblib")

    # -------------------------------------------------------------
    # 3. Student Engagement Model
    # Target: engagement_level ('HIGH', 'MEDIUM', 'LOW')
    # -------------------------------------------------------------
    eng_features = [
        "login_frequency", # synthetic proxy
        "learning_minutes",
        "course_completion",
        "quiz_average",
        "assignment_average",
        "attendance_percentage"
    ]
    # compute synthetic login frequency based on learning minutes
    df_eng = df.copy()
    df_eng["login_frequency"] = np.clip(np.round(df["learning_minutes"] / 25.0), 1, 30)

    X_eng = df_eng[eng_features]
    y_eng = df_eng["engagement_level"]

    X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(
        X_eng, y_eng, test_size=0.2, random_state=42, stratify=y_eng
    )

    eng_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=7,
        random_state=42
    )
    eng_clf.fit(X_train_e, y_train_e)
    print("\n--- 3. Engagement Model Report ---")
    print(classification_report(y_test_e, eng_clf.predict(X_test_e)))

    joblib.dump({
        "model": eng_clf,
        "features": eng_features,
        "classes": list(eng_clf.classes_)
    }, "ml/models/engagement_model.joblib")
    print("Saved: ml/models/engagement_model.joblib")

    # -------------------------------------------------------------
    # 4. Attendance Anomaly Detection Model (Isolation Forest)
    # Detects unusual deviations in attendance and streak behavior
    # -------------------------------------------------------------
    anomaly_features = [
        "attendance_percentage",
        "absence_streak",
        "late_count",
        "attendance_trend"
    ]
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.06,
        random_state=42
    )
    iso_forest.fit(df[anomaly_features])

    joblib.dump({
        "model": iso_forest,
        "features": anomaly_features
    }, "ml/models/anomaly_model.joblib")
    print("Saved: ml/models/anomaly_model.joblib")

    # -------------------------------------------------------------
    # 5. Student Segmentation Model (K-Means Clustering)
    # Clusters: A (High Att + High Perf), B (High Att + Low Perf),
    #           C (Low Att + High Perf), D (Low Att + Low Perf)
    # -------------------------------------------------------------
    cluster_features = ["attendance_percentage", "predicted_performance"]
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    kmeans.fit(df[cluster_features])

    # Name clusters based on cluster centers
    centers = kmeans.cluster_centers_
    cluster_names = {}
    for i, c in enumerate(centers):
        att, perf = c[0], c[1]
        att_str = "High" if att >= 75 else "Low"
        perf_str = "High" if perf >= 70 else "Low"
        cluster_names[i] = f"Cluster {chr(65+i)}: {att_str} Attendance + {perf_str} Performance"

    joblib.dump({
        "model": kmeans,
        "features": cluster_features,
        "cluster_names": cluster_names,
        "centers": centers.tolist()
    }, "ml/models/segmentation_model.joblib")
    print(f"Saved: ml/models/segmentation_model.joblib with clusters: {cluster_names}")

    # -------------------------------------------------------------
    # 6. Personalized Recommendation TF-IDF Model
    # -------------------------------------------------------------
    materials_catalog = [
        {
            "id": 1,
            "title": "Probability Basics",
            "type": "video",
            "duration": "12:34",
            "subject": "Statistics",
            "topic": "Probability",
            "difficulty": "Beginner",
            "description": "Introduction to sample spaces, discrete probability, independent events, and fundamentals of probability theory.",
            "url": "#"
        },
        {
            "id": 2,
            "title": "Bayes Theorem Explained",
            "type": "article",
            "duration": "8 min read",
            "subject": "Statistics",
            "topic": "Probability",
            "difficulty": "Intermediate",
            "description": "Comprehensive explanation of conditional probability, prior belief, likelihood, and applying Bayes Theorem to real-world datasets.",
            "url": "#"
        },
        {
            "id": 3,
            "title": "Practice Quiz: Probability & Statistics",
            "type": "quiz",
            "duration": "20 Questions",
            "subject": "Statistics",
            "topic": "Probability",
            "difficulty": "All Levels",
            "description": "Sharpen your knowledge with 20 targeted probability and statistical inference questions.",
            "url": "#"
        },
        {
            "id": 4,
            "title": "Quick Revision Notes",
            "type": "notes",
            "duration": "PDF • 14 Pages",
            "subject": "Statistics",
            "topic": "Probability",
            "difficulty": "All Levels",
            "description": "High-yield summary formulas, distributions, and probability axioms for quick semester revision.",
            "url": "#"
        },
        {
            "id": 5,
            "title": "Supervised Learning Fundamentals",
            "type": "video",
            "duration": "18:20",
            "subject": "Machine Learning",
            "topic": "Supervised Learning",
            "difficulty": "Beginner",
            "description": "Regression vs Classification, loss functions, gradient descent, and training curves.",
            "url": "#"
        },
        {
            "id": 6,
            "title": "Model Evaluation & Metrics",
            "type": "article",
            "duration": "10 min read",
            "subject": "Machine Learning",
            "topic": "Model Evaluation",
            "difficulty": "Intermediate",
            "description": "Precision, recall, F1-score, ROC-AUC, confusion matrix, and hyperparameter tuning.",
            "url": "#"
        },
        {
            "id": 7,
            "title": "Python Data Structures Mastery",
            "type": "video",
            "duration": "15:45",
            "subject": "Python",
            "topic": "Data Structures",
            "difficulty": "Beginner",
            "description": "Deep dive into lists, dictionaries, sets, tuples, and time complexity in Python.",
            "url": "#"
        },
        {
            "id": 8,
            "title": "SQL Joins and Aggregations",
            "type": "article",
            "duration": "12 min read",
            "subject": "Database Systems",
            "topic": "SQL Queries",
            "difficulty": "Intermediate",
            "description": "Mastering INNER, LEFT, RIGHT, FULL OUTER joins and GROUP BY aggregation clauses.",
            "url": "#"
        }
    ]

    corpus = [f"{m['subject']} {m['topic']} {m['difficulty']} {m['title']} {m['description']}" for m in materials_catalog]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(corpus)

    joblib.dump({
        "vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix,
        "catalog": materials_catalog
    }, "ml/models/recommendation_index.joblib")
    print("Saved: ml/models/recommendation_index.joblib")

    print("\n[OK] All 6 Traditional ML models trained and exported successfully!")

if __name__ == "__main__":
    train_and_save_models()
