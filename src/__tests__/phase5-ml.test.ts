import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 5: Random Forest Workload Prediction & Artifacts', () => {
  const modelsDir = path.join(process.cwd(), 'ml_service', 'models');
  const metadataPath = path.join(modelsDir, 'model_metadata.json');
  const modelArtifactPath = path.join(modelsDir, 'random_forest_workload.joblib');

  it('verifies that model artifacts and metadata exist and are valid', () => {
    expect(fs.existsSync(modelsDir)).toBe(true);
    expect(fs.existsSync(metadataPath)).toBe(true);
    expect(fs.existsSync(modelArtifactPath)).toBe(true);

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    expect(metadata.model_version).toBe('rf-workload-v1.0');
    expect(metadata.metric_units).toBe('hours/week');
    expect(metadata.random_forest.mae).toBeGreaterThan(0);
    expect(metadata.random_forest.mae).toBeLessThan(10);
    expect(metadata.random_forest.rmse).toBeGreaterThan(0);
    expect(metadata.is_synthetic_demonstration).toBe(true);
    expect(metadata.demonstration_notice).toContain('demonstration');
  });

  it('verifies feature importances are recorded', () => {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    expect(metadata.feature_importances).toBeDefined();
    expect(metadata.feature_importances['previous_workload_hours']).toBeGreaterThan(0);
  });
});
