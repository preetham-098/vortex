"""
Unit tests for Python ML Workforce Prediction Module
"""

import unittest
import numpy as np
import pandas as pd
import os
import json

from preprocessing import clean_workforce_data
from feature_engineering import extract_features, encode_department
from evaluate import calculate_mae, calculate_rmse
from train import train_model
from predict import predict_workload


class TestMLWorkforcePrediction(unittest.TestCase):

    def test_mae_and_rmse_calculations(self):
        y_true = np.array([20.0, 30.0, 40.0])
        y_pred = np.array([22.0, 28.0, 45.0])
        # Errors: |22-20|=2, |28-30|=2, |45-40|=5
        # MAE = (2 + 2 + 5) / 3 = 9 / 3 = 3.0
        # Squared errors: 4, 4, 25 -> mean = 33/3 = 11.0 -> RMSE = sqrt(11) = 3.3166
        mae = calculate_mae(y_true, y_pred)
        rmse = calculate_rmse(y_true, y_pred)

        self.assertAlmostEqual(mae, 3.0, places=2)
        self.assertAlmostEqual(rmse, np.sqrt(11.0), places=2)

    def test_preprocessing_and_feature_engineering(self):
        raw_data = pd.DataFrame([{
            'previous_workload_hours': '35.5',
            'historical_utilization': 88.75,
            'active_assignment_count': 2,
            'planned_project_hours': 10,
            'upcoming_deadlines_count': 1,
            'department': 'Engineering',
            'experience_years': 4.5,
            'workload_trend': -2.0,
            'target_future_workload': 38.0
        }])

        cleaned = clean_workforce_data(raw_data)
        X = extract_features(cleaned)

        self.assertEqual(len(X), 1)
        self.assertEqual(X['previous_workload_hours'].iloc[0], 35.5)
        self.assertEqual(X['department_code'].iloc[0], 1.0) # Engineering code is 1.0

    def test_train_and_predict_pipeline(self):
        # Run training
        eval_metrics = train_model()
        self.assertIn('random_forest', eval_metrics)
        self.assertLess(eval_metrics['random_forest']['mae'], 6.0)
        self.assertLess(eval_metrics['random_forest']['rmse'], 8.0)

        # Run inference
        sample = {
            "previous_workload_hours": 30.0,
            "historical_utilization": 75.0,
            "active_assignment_count": 2,
            "planned_project_hours": 10.0,
            "upcoming_deadlines_count": 1,
            "department": "engineering",
            "experience_years": 5.0,
            "workload_trend": 1.0,
        }

        pred_result = predict_workload(sample)
        self.assertEqual(pred_result['status'], 'trained_model')
        self.assertIsNotNone(pred_result['predicted_workload_hours'])
        self.assertGreater(pred_result['predicted_workload_hours'], 0)
        self.assertIsInstance(pred_result['confidence_interval'], list)
        self.assertTrue(pred_result['evaluation_metrics']['is_synthetic_demonstration'])


if __name__ == '__main__':
    unittest.main()
