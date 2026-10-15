"""
Workforce Intelligence - ML Prediction Interface
Loads trained Random Forest model and performs inference with tree variance estimation.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

from feature_engineering import extract_features, FEATURE_COLUMNS


def load_model_and_metadata():
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, 'models', 'random_forest_workload.joblib')
    metadata_path = os.path.join(base_dir, 'models', 'model_metadata.json')

    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        return None, None

    try:
        model = joblib.load(model_path)
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        return model, metadata
    except Exception as e:
        print(f"Error loading model artifacts: {e}", file=sys.stderr)
        return None, None


def predict_workload(features_dict: dict) -> dict:
    """
    Predicts future workload hours L_hat_(i, t+1)
    """
    model, metadata = load_model_and_metadata()

    if model is None:
        # Transparent disclosure when model is unavailable
        return {
            "status": "unavailable",
            "message": "Random Forest model is not trained yet. Run train.py or train via API.",
            "predicted_workload_hours": None,
            "confidence_interval": None,
            "model_version": None,
            "evaluation_metrics": None,
        }

    # Prepare DataFrame
    df = pd.DataFrame([features_dict])
    X = extract_features(df)

    # Point prediction
    pred = float(model.predict(X)[0])
    pred_clipped = round(max(0.0, pred), 1)

    # Confidence interval from ensemble tree distribution
    tree_preds = [tree.predict(X.to_numpy())[0] for tree in model.estimators_]
    lower_bound = round(max(0.0, float(np.percentile(tree_preds, 10))), 1)
    upper_bound = round(max(lower_bound, float(np.percentile(tree_preds, 90))), 1)

    return {
        "status": "trained_model",
        "predicted_workload_hours": pred_clipped,
        "confidence_interval": [lower_bound, upper_bound],
        "model_version": metadata.get("model_version", "rf-workload-v1.0"),
        "evaluation_metrics": {
            "mae": metadata["random_forest"]["mae"],
            "rmse": metadata["random_forest"]["rmse"],
            "sample_size": metadata.get("sample_size", 0),
            "is_synthetic_demonstration": metadata.get("is_synthetic_demonstration", True),
            "demonstration_notice": metadata.get("demonstration_notice", ""),
        },
        "period": "Next Operating Cycle (t+1)",
    }


if __name__ == '__main__':
    # Can receive JSON argument via CLI
    if len(sys.argv) > 1:
        try:
            arg = json.loads(sys.argv[1])
            res = predict_workload(arg)
            print(json.dumps(res))
        except Exception as err:
            print(json.dumps({"error": str(err), "status": "error"}))
    else:
        # Sample test prediction
        sample = {
            "previous_workload_hours": 32.0,
            "historical_utilization": 80.0,
            "active_assignment_count": 2,
            "planned_project_hours": 15.0,
            "upcoming_deadlines_count": 1,
            "department": "engineering",
            "experience_years": 5.0,
            "workload_trend": 2.5,
        }
        res = predict_workload(sample)
        print(json.dumps(res, indent=2))
