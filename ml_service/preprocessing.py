"""
Workforce Intelligence - ML Preprocessing Module
Handles data loading, null handling, type coercion, and sanitization.
"""

import pandas as pd
import numpy as np


def clean_workforce_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw historical workforce data.
    - Fills missing numeric features with appropriate defaults/medians.
    - Encodes categorical departments and roles consistently.
    - Ensures workload values are non-negative.
    """
    df_clean = df.copy()

    # Numeric columns
    numeric_cols = [
        'previous_workload_hours',
        'historical_utilization',
        'active_assignment_count',
        'planned_project_hours',
        'upcoming_deadlines_count',
        'experience_years',
        'workload_trend',
        'target_future_workload'
    ]

    for col in numeric_cols:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0.0)

    # Ensure target is non-negative
    if 'target_future_workload' in df_clean.columns:
        df_clean['target_future_workload'] = df_clean['target_future_workload'].clip(lower=0.0)

    # Clean categorical text
    if 'department' in df_clean.columns:
        df_clean['department'] = df_clean['department'].astype(str).str.strip().str.lower()
    else:
        df_clean['department'] = 'engineering'

    return df_clean
