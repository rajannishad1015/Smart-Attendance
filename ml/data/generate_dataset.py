"""
SmartAttend AI - Synthetic Collegiate Dataset Generator
Generates realistic academic and attendance features for traditional ML model training.
"""

import numpy as np
import pandas as pd
import os

def generate_dataset(num_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # 1. Attendance features
    attendance_rate = np.random.beta(a=7, b=2, size=num_samples) * 100  # skewed towards higher attendance
    attendance_rate = np.clip(attendance_rate, 25.0, 100.0)

    total_classes = np.random.randint(40, 60, size=num_samples)
    classes_attended = np.round(total_classes * (attendance_rate / 100.0)).astype(int)
    classes_missed = total_classes - classes_attended

    # Streak of recent absences
    absence_streak = []
    for att, missed in zip(attendance_rate, classes_missed):
        if att < 60:
            streak = np.random.choice([2, 3, 4, 5, 6], p=[0.2, 0.3, 0.25, 0.15, 0.1])
        elif att < 75:
            streak = np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1])
        else:
            streak = np.random.choice([0, 1], p=[0.85, 0.15])
        absence_streak.append(streak)
    absence_streak = np.array(absence_streak)

    late_count = np.random.poisson(lam=2.5, size=num_samples)
    late_count = np.clip(late_count, 0, 15)

    # Attendance trend: negative means declining, positive means improving
    attendance_trend = np.random.normal(loc=0.0, scale=0.3, size=num_samples)
    attendance_trend = np.clip(attendance_trend, -1.0, 1.0)
    # Correlate trend with low attendance
    attendance_trend = np.where(attendance_rate < 70, attendance_trend - 0.25, attendance_trend + 0.1)
    attendance_trend = np.clip(attendance_trend, -1.0, 1.0)

    # 2. Learning and Quiz features
    # Quiz scores somewhat correlate with attendance but have individual variance
    quiz_average = attendance_rate * 0.5 + np.random.normal(loc=35, scale=12, size=num_samples)
    quiz_average = np.clip(quiz_average, 20.0, 98.0)

    assignment_average = attendance_rate * 0.45 + np.random.normal(loc=40, scale=10, size=num_samples)
    assignment_average = np.clip(assignment_average, 25.0, 99.0)

    learning_minutes_weekly = (attendance_rate * 2.5) + (quiz_average * 1.5) + np.random.normal(loc=50, scale=40, size=num_samples)
    learning_minutes_weekly = np.clip(learning_minutes_weekly, 20.0, 600.0)

    course_completion = (attendance_rate * 0.4) + (assignment_average * 0.4) + np.random.normal(loc=15, scale=8, size=num_samples)
    course_completion = np.clip(course_completion, 15.0, 100.0)

    previous_exam_score = (quiz_average * 0.6) + (assignment_average * 0.3) + np.random.normal(loc=8, scale=7, size=num_samples)
    previous_exam_score = np.clip(previous_exam_score, 30.0, 100.0)

    recent_score_trend = np.random.normal(loc=0.02, scale=0.25, size=num_samples)
    recent_score_trend = np.clip(recent_score_trend, -1.0, 1.0)

    # 3. Derive ground truth targets based on logical rules with probabilistic noise
    # Risk Score (0 - 100 continuous)
    risk_score = (
        (100 - attendance_rate) * 0.35 +
        (absence_streak * 7.0) +
        (100 - quiz_average) * 0.25 +
        (100 - assignment_average) * 0.20 +
        (-attendance_trend * 15.0) +
        np.random.normal(0, 5, size=num_samples)
    )
    risk_score = np.clip(risk_score, 0, 100)

    # Risk Label
    risk_labels = []
    for r in risk_score:
        if r >= 55.0:
            risk_labels.append("HIGH")
        elif r >= 32.0:
            risk_labels.append("MEDIUM")
        else:
            risk_labels.append("LOW")

    # Final Expected Performance (0 - 100)
    performance = (
        attendance_rate * 0.20 +
        quiz_average * 0.35 +
        assignment_average * 0.25 +
        previous_exam_score * 0.15 +
        course_completion * 0.05 +
        np.random.normal(0, 3.5, size=num_samples)
    )
    performance = np.clip(performance, 20.0, 99.0)

    # Engagement Level
    engagement_metric = (
        (learning_minutes_weekly / 6.0) * 0.35 +
        attendance_rate * 0.30 +
        course_completion * 0.20 +
        assignment_average * 0.15 +
        np.random.normal(0, 5, size=num_samples)
    )
    engagement_labels = []
    for e in engagement_metric:
        if e >= 70.0:
            engagement_labels.append("HIGH")
        elif e >= 45.0:
            engagement_labels.append("MEDIUM")
        else:
            engagement_labels.append("LOW")

    # Anomaly indicator (e.g. 5% anomalies: student who was 95% attendance suddenly had 5 absence streaks, or high performer with 0 learning time)
    is_anomaly = np.ones(num_samples, dtype=int)
    anomaly_indices = np.random.choice(num_samples, size=int(num_samples * 0.06), replace=False)
    for idx in anomaly_indices:
        # Invert or corrupt a pattern to make it an anomaly
        is_anomaly[idx] = -1
        if np.random.rand() > 0.5:
            # high attendance but sudden max absence streak
            absence_streak[idx] = 8
            attendance_trend[idx] = -0.95
        else:
            # zero learning time but 99% quiz score
            learning_minutes_weekly[idx] = 10.0
            quiz_average[idx] = 98.0

    df = pd.DataFrame({
        "attendance_percentage": np.round(attendance_rate, 1),
        "absence_streak": absence_streak,
        "late_count": late_count,
        "attendance_trend": np.round(attendance_trend, 3),
        "classes_attended": classes_attended,
        "classes_missed": classes_missed,
        "quiz_average": np.round(quiz_average, 1),
        "assignment_average": np.round(assignment_average, 1),
        "learning_minutes": np.round(learning_minutes_weekly, 1),
        "course_completion": np.round(course_completion, 1),
        "previous_exam_score": np.round(previous_exam_score, 1),
        "recent_score_trend": np.round(recent_score_trend, 3),
        "risk_label": risk_labels,
        "predicted_performance": np.round(performance, 1),
        "engagement_level": engagement_labels,
        "is_anomaly": is_anomaly
    })

    return df

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    dataset = generate_dataset(5000)
    output_path = "ml/data/collegiate_student_data.csv"
    dataset.to_csv(output_path, index=False)
    print(f"Generated synthetic collegiate dataset with {len(dataset)} records -> {output_path}")
    print("Risk breakdown:")
    print(dataset["risk_label"].value_counts())
    print("\nEngagement breakdown:")
    print(dataset["engagement_level"].value_counts())
