"""
Workforce Intelligence - ML Evaluation Module
Computes MAE and RMSE on held-out predictions and compares with simple baselines.
"""

import numpy as np
from typing import Dict, Any


def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    MAE = (1/N) * sum(abs(L_i - L_hat_i))
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0:
        return 0.0
    return float(np.mean(np.abs(y_t - y_p)))


def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    RMSE = sqrt((1/N) * sum((L_i - L_hat_i)^2))
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)
    if len(y_t) == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.square(y_t - y_p))))


def evaluate_model(
    y_true: np.ndarray,
    y_pred_rf: np.ndarray,
    y_baseline_prev: np.ndarray,
    model_version: str = "rf-workload-v1.0"
) -> Dict[str, Any]:
    """
    Comprehensive evaluation comparing Random Forest against historical persistence baseline.
    """
    mae_rf = calculate_mae(y_true, y_pred_rf)
    rmse_rf = calculate_rmse(y_true, y_pred_rf)

    mae_baseline = calculate_mae(y_true, y_baseline_prev)
    rmse_baseline = calculate_rmse(y_true, y_baseline_prev)

    improvement_mae = ((mae_baseline - mae_rf) / mae_baseline * 100) if mae_baseline > 0 else 0.0
    improvement_rmse = ((rmse_baseline - rmse_rf) / rmse_baseline * 100) if rmse_baseline > 0 else 0.0

    return {
        "model_version": model_version,
        "metric_units": "hours/week",
        "sample_size": len(y_true),
        "random_forest": {
            "mae": round(mae_rf, 3),
            "rmse": round(rmse_rf, 3),
        },
        "persistence_baseline": {
            "mae": round(mae_baseline, 3),
            "rmse": round(rmse_baseline, 3),
        },
        "relative_improvement": {
            "mae_reduction_pct": round(improvement_mae, 2),
            "rmse_reduction_pct": round(improvement_rmse, 2),
        },
        "is_synthetic_demonstration": True,
        "demonstration_notice": "Trained on synthetic enterprise telemetry data for hackathon demonstration. Do not present as real-world accuracy."
    }
