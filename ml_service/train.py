"""
Workforce Intelligence - Random Forest Training Script
Trains a Random Forest regressor with chronological train/test split to prevent leakage.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

from preprocessing import clean_workforce_data
from feature_engineering import extract_features, extract_target, FEATURE_COLUMNS
from evaluate import evaluate_model
from generate_dataset import generate_synthetic_workforce_data


def train_model():
    base_dir = os.path.dirname(__file__)
    data_dir = os.path.join(base_dir, 'data')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, 'synthetic_workforce_cycles.csv')
    if not os.path.exists(csv_path):
        print("Data file not found. Generating synthetic workforce dataset...")
        df_raw = generate_synthetic_workforce_data(n_samples=1000)
        df_raw.to_csv(csv_path, index=False)
    else:
        df_raw = pd.read_csv(csv_path)

    # 1. Clean data
    df_clean = clean_workforce_data(df_raw)

    # 2. Chronological Split (prevents future-data leakage)
    # Cycles 1 to 9 -> Train (approx 75%), Cycles 10 to 12 -> Test (approx 25%)
    train_mask = df_clean['cycle_index'] <= 9
    test_mask = df_clean['cycle_index'] > 9

    df_train = df_clean[train_mask]
    df_test = df_clean[test_mask]

    X_train = extract_features(df_train)
    y_train = extract_target(df_train)

    X_test = extract_features(df_test)
    y_test = extract_target(df_test)

    print(f"Training on {len(X_train)} samples across cycles 1-9; Testing on {len(X_test)} samples across cycles 10-12.")

    # 3. Train Random Forest Regressor
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # 4. Predict on Test Set
    y_pred_test = rf.predict(X_test)
    y_baseline_prev = df_test['previous_workload_hours'].to_numpy()

    # 5. Evaluate
    eval_metrics = evaluate_model(
        y_true=y_test,
        y_pred_rf=y_pred_test,
        y_baseline_prev=y_baseline_prev,
        model_version="rf-workload-v1.0"
    )

    print("\n--- Evaluation Results ---")
    print(f"Random Forest MAE:  {eval_metrics['random_forest']['mae']} hours")
    print(f"Random Forest RMSE: {eval_metrics['random_forest']['rmse']} hours")
    print(f"Baseline MAE:       {eval_metrics['persistence_baseline']['mae']} hours")
    print(f"MAE Reduction:      {eval_metrics['relative_improvement']['mae_reduction_pct']}%")

    # Feature Importances
    feature_importances = dict(zip(FEATURE_COLUMNS, [round(float(v), 4) for v in rf.feature_importances_]))
    eval_metrics["feature_importances"] = feature_importances

    # 6. Save Model Artifact and Metadata
    model_path = os.path.join(models_dir, 'random_forest_workload.joblib')
    joblib.dump(rf, model_path)

    metadata_path = os.path.join(models_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(eval_metrics, f, indent=2)

    print(f"\nModel saved to: {model_path}")
    print(f"Metadata saved to: {metadata_path}")
    return eval_metrics


if __name__ == '__main__':
    train_model()
