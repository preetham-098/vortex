"""
Workforce Intelligence - Synthetic Workload Dataset Generator
Generates realistic historical workforce time-series cycles for training Random Forest models.
Explicitly labeled as synthetic demonstration data.
"""

import numpy as np
import pandas as pd
import os

def generate_synthetic_workforce_data(n_samples: int = 800, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)

    # Departments
    departments = ['ai & data science', 'engineering', 'devops & infrastructure', 'product', 'platform']
    dept_choices = np.random.choice(departments, size=n_samples, p=[0.25, 0.40, 0.15, 0.10, 0.10])

    # Experience years: 1 to 15
    experience_years = np.random.gamma(shape=3.0, scale=1.8, size=n_samples).clip(1.0, 15.0)

    # Active assignment count: 0 to 4
    active_assignments = np.random.poisson(lam=1.8, size=n_samples).clip(0, 5)

    # Previous workload hours: mean 32h, std 10h
    previous_workload = np.random.normal(loc=30.0, scale=8.0, size=n_samples).clip(5.0, 55.0)

    # Historical utilization percentage: (previous_workload / 40.0) * 100
    historical_utilization = (previous_workload / 40.0) * 100.0

    # Planned project hours added
    planned_hours = (active_assignments * np.random.uniform(5.0, 12.0, size=n_samples)).clip(0.0, 35.0)

    # Upcoming project deadlines in next 30 days: 0 to 3
    upcoming_deadlines = np.random.binomial(n=3, p=0.35, size=n_samples)

    # Workload trend (-10h to +10h shift)
    workload_trend = np.random.normal(loc=0.0, scale=3.5, size=n_samples).clip(-12.0, 12.0)

    # True future workload function with realistic noise and business dynamics
    # L_target = 0.55*L_prev + 0.35*H_planned + 2.5*deadlines + 0.8*trend + noise
    noise = np.random.normal(loc=0.0, scale=2.8, size=n_samples)
    target_workload = (
        0.52 * previous_workload +
        0.38 * planned_hours +
        2.2 * upcoming_deadlines +
        0.75 * workload_trend +
        noise
    ).clip(0.0, 60.0)

    # Cycle timestamp (chronological simulation across 12 cycles)
    cycle_indices = np.sort(np.random.randint(1, 13, size=n_samples))

    df = pd.DataFrame({
        'cycle_index': cycle_indices,
        'department': dept_choices,
        'experience_years': np.round(experience_years, 1),
        'active_assignment_count': active_assignments,
        'previous_workload_hours': np.round(previous_workload, 1),
        'historical_utilization': np.round(historical_utilization, 1),
        'planned_project_hours': np.round(planned_hours, 1),
        'upcoming_deadlines_count': upcoming_deadlines,
        'workload_trend': np.round(workload_trend, 2),
        'target_future_workload': np.round(target_workload, 1),
    })

    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    df = generate_synthetic_workforce_data()
    csv_path = os.path.join(data_dir, 'synthetic_workforce_cycles.csv')
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} synthetic workforce cycles saved to {csv_path}")
