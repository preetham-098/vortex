"""
Workforce Intelligence - Feature Engineering Module
Transforms cleaned tabular data into machine-learning ready feature vectors.
"""

import pandas as pd
import numpy as np

DEPARTMENT_MAPPING = {
    'ai & data science': 0,
    'engineering': 1,
    'devops & infrastructure': 2,
    'product': 3,
    'platform': 4,
    'other': 5,
}

FEATURE_COLUMNS = [
    'previous_workload_hours',
    'historical_utilization',
    'active_assignment_count',
    'planned_project_hours',
    'upcoming_deadlines_count',
    'department_code',
    'experience_years',
    'workload_trend',
]


def encode_department(dept_name: str) -> int:
    dept_clean = str(dept_name).strip().lower()
    return DEPARTMENT_MAPPING.get(dept_clean, DEPARTMENT_MAPPING['other'])


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts and scales model features without leaking future data.
    """
    X = pd.DataFrame()
    X['previous_workload_hours'] = df['previous_workload_hours'].astype(float)
    X['historical_utilization'] = df['historical_utilization'].astype(float)
    X['active_assignment_count'] = df['active_assignment_count'].astype(float)
    X['planned_project_hours'] = df['planned_project_hours'].astype(float)
    X['upcoming_deadlines_count'] = df['upcoming_deadlines_count'].astype(float)

    if 'department_code' in df.columns:
        X['department_code'] = df['department_code'].astype(float)
    elif 'department' in df.columns:
        X['department_code'] = df['department'].apply(encode_department).astype(float)
    else:
        X['department_code'] = 1.0

    X['experience_years'] = df['experience_years'].astype(float)
    X['workload_trend'] = df['workload_trend'].astype(float)

    return X[FEATURE_COLUMNS]


def extract_target(df: pd.DataFrame) -> np.ndarray:
    """
    Extracts future workload target hours: L_hat_(i, t+1)
    """
    if 'target_future_workload' not in df.columns:
        raise ValueError("Target column 'target_future_workload' not found in DataFrame.")
    return df['target_future_workload'].to_numpy(dtype=float)
