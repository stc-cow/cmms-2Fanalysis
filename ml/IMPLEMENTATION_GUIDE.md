# COW Movement Prediction ML Module - Implementation Guide

## Overview

This machine learning module predicts which COWs (Cell On Wheels) need to be moved and where they should go based on historical movement patterns. The system uses three complementary models:

1. **Next Location Predictor** (KNN Classification) - Predicts the next warehouse/location
2. **Optimal Stay Duration Predictor** (Linear Regression) - Predicts how long a COW should stay
3. **COW Clustering Model** (K-Means) - Groups COWs with similar movement patterns

## Module Structure

```
ml/
├── types.ts                    # TypeScript interfaces and types
├── dataPreparation.ts          # Data loading and preprocessing
├── featureEngineering.ts       # Feature extraction and normalization
├── models.ts                   # ML model implementations
├── training.ts                 # Training pipelines and utilities
├── inference.ts                # Prediction and recommendation engine
├── IMPLEMENTATION_GUIDE.md     # This file
└── index.ts                    # Main entry point (see section below)
```

## Installation

### Step 1: Copy the ML Module

Copy the entire `ml/` directory to your project root:

```
your-project/
├── ml/                    # Copy entire directory here
├── client/
├── server/
├── shared/
└── ...
```

### Step 2: Create Index File

Create `ml/index.ts` to export all functionality:

```typescript
// ml/index.ts
export * from "./types";
export * from "./dataPreparation";
export * from "./featureEngineering";
export * from "./models";
export * from "./training";
export * from "./inference";
```

### Step 3: Update Import Paths (if needed)

If your project structure differs, update imports in files. Key changes:

```typescript
// Current (assumes your structure):
import { CowMovementsFact, DimLocation } from "@shared/models";

// If different, update to:
import { CowMovementsFact, DimLocation } from "../path-to-shared/models";
```

## Quick Start

### 1. Prepare Training Data

```typescript
import {
  DataPreparationPipeline,
  assessDataQuality,
} from "./ml";
import { movements, locations } from "./data";

// Create pipeline
const pipeline = new DataPreparationPipeline(movements, locations);

// Check data quality first
const quality = pipeline.assessDataQuality();
console.log("Data Quality Report:", quality);

// Prepare training dataset
const dataset = pipeline.createTrainingDataset();
```

### 2. Train Models

```typescript
import {
  KNNNextLocationModel,
  LinearRegressionOptimalStayModel,
  KMeansClusteringModel,
  ModelTrainingPipeline,
} from "./ml";

// Create models
const nextLocationModel = new KNNNextLocationModel();
const optimalStayModel = new LinearRegressionOptimalStayModel();
const clusteringModel = new KMeansClusteringModel();

// Train with cross-validation
const { bestModel: locationModel } = 
  await ModelTrainingPipeline.trainNextLocationModel(
    nextLocationModel,
    dataset,
    5 // 5-fold cross-validation
  );

const { bestModel: stayModel } = 
  await ModelTrainingPipeline.trainOptimalStayModel(
    optimalStayModel,
    dataset,
    5
  );

const { model: clusterModel } = 
  await ModelTrainingPipeline.trainClusteringModel(
    clusteringModel,
    dataset
  );
```

### 3. Generate Recommendations

```typescript
import {
  MovementRecommendationEngine,
  FeatureEngineer,
} from "./ml";

// Create inference engine
const engine = new MovementRecommendationEngine();
engine.setModels(locationModel, stayModel, clusterModel);

// Create feature engineer
const engineer = new FeatureEngineer();

// Get recommendations for batch of COWs
const recommendations = engine.recommendBatch(
  cowsData.map((cow) => ({
    cowId: cow.id,
    features: engineer.createMovementFeatureVector(
      movement,
      aggregateFeatures.get(cow.id)
    ),
    currentLocation: cow.location,
    currentIdleDays: cow.idleDays,
  }))
);

// Export results
const report = engine.generateReport(recommendations);
console.log(report);

const csv = engine.exportAsCSV(recommendations);
// Save to file or send to client
```

## Detailed Usage

### Data Quality Assessment

Before training, always assess data quality:

```typescript
import { DataPreparationPipeline } from "./ml";

const pipeline = new DataPreparationPipeline(movements, locations);
const report = pipeline.assessDataQuality();

if (report.overallQualityScore < 0.8) {
  console.warn("Data quality is below threshold!");
  console.warn("Issues:", report.issues);
}
```

### Feature Engineering

#### Create Single Feature Vector

```typescript
import { FeatureEngineer } from "./ml";

const engineer = new FeatureEngineer();

// Create feature vector from movement and aggregate features
const features = engineer.createMovementFeatureVector(
  movement,
  aggregateFeatures.get(cowId)
);

// Normalize features
engineer.fitScaler([features]); // Learn scaling from data
const normalized = engineer.normalizeMinMax(features);

// Standardize (z-score normalization)
const standardized = engineer.standardize(features);
```

#### Create Time-Series Features

```typescript
// Use last 5 movements as features
const timeSeriesFeatures = engineer.createTimeSeriesFeatures(
  movements,
  aggregateFeatures,
  5 // lookback window
);
```

#### Create Interaction Features

```typescript
// Add feature interactions
const withInteractions = engineer.createInteractionFeatures(
  movement,
  aggregateFeatures
);

// Add polynomial features
const withPolynomial = engineer.createPolynomialFeatures(
  withInteractions
);
```

### Model Training with Hyperparameter Tuning

```typescript
import { ModelTrainingPipeline } from "./ml";

// Define hyperparameter grid
const paramGrid = {
  k: [3, 5, 7, 9],
  distance: ["euclidean", "manhattan"],
};

// Run grid search
const tuningResults = await ModelTrainingPipeline
  .tuneNextLocationHyperparameters(
    nextLocationModel,
    dataset,
    paramGrid
  );

console.log("Best parameters:", tuningResults.bestParams);
console.log("Best score:", tuningResults.bestScore);
```

### Cross-Validation and Learning Curves

```typescript
import { LearningCurveAnalysis, CrossValidator } from "./ml";

// Generate learning curve
const learningCurve = await LearningCurveAnalysis
  .generateLearningCurve(
    nextLocationModel,
    dataset,
    [0.1, 0.3, 0.5, 0.7, 0.9]
  );

// Detect overfitting
const isOverfitting = LearningCurveAnalysis.detectOverfitting(
  learningCurve,
  0.1 // threshold
);

if (isOverfitting) {
  console.warn("Model is overfitting!");
}

// Report CV results
const report = CrossValidator.reportCVResults(
  metrics,
  "Next Location Model"
);
```

### Model Persistence

```typescript
import { ModelPersistence } from "./ml";

// Save model
ModelPersistence.saveModel(nextLocationModel, "next_location_v1");

// Load model
const loaded = ModelPersistence.loadModel("next_location_v1");

// Export for sharing
const exported = ModelPersistence.exportModel(nextLocationModel);
// Save exported to file

// Import model
const imported = ModelPersistence.importModel(jsonString);
nextLocationModel.decode(imported.data);
```

### Real-time Predictions

```typescript
import { RealtimePredictionService } from "./ml";

// Create prediction service with caching
const predictionService = new RealtimePredictionService(engine);

// Get recommendation (cached for 1 hour)
const recommendation = predictionService.getRecommendation(
  cowId,
  features,
  currentLocation,
  currentIdleDays
);

// Clear cache when data updates
predictionService.clearCache();

// Check cache stats
console.log(predictionService.getCacheStats());
```

## Integration with Your Application

### Backend Integration (Express/Netlify)

```typescript
// server/routes/ml-predictions.ts
import express from "express";
import {
  DataPreparationPipeline,
  KNNNextLocationModel,
  LinearRegressionOptimalStayModel,
  KMeansClusteringModel,
  ModelTrainingPipeline,
  MovementRecommendationEngine,
  FeatureEngineer,
} from "../ml";

const router = express.Router();

let engine: MovementRecommendationEngine;
let engineer: FeatureEngineer;

// Initialize on startup
async function initializeML(movements, locations) {
  // Prepare data
  const pipeline = new DataPreparationPipeline(movements, locations);
  const dataset = pipeline.createTrainingDataset();

  // Create and train models
  const locationModel = new KNNNextLocationModel();
  const stayModel = new LinearRegressionOptimalStayModel();
  const clusterModel = new KMeansClusteringModel();

  const { bestModel: locModel } = await ModelTrainingPipeline
    .trainNextLocationModel(locationModel, dataset, 5);
  
  const { bestModel: stayModelTrained } = await ModelTrainingPipeline
    .trainOptimalStayModel(stayModel, dataset, 5);
  
  const { model: clusterModelTrained } = await ModelTrainingPipeline
    .trainClusteringModel(clusterModel, dataset);

  // Setup engine
  engine = new MovementRecommendationEngine();
  engine.setModels(locModel, stayModelTrained, clusterModelTrained);
  
  engineer = new FeatureEngineer();
}

// API endpoint for predictions
router.post("/api/ml/predict", async (req, res) => {
  try {
    const { cowsData, aggregateFeatures } = req.body;

    const batchData = cowsData.map((cow) => ({
      cowId: cow.id,
      features: engineer.createMovementFeatureVector(
        cow.lastMovement,
        aggregateFeatures.get(cow.id)
      ),
      currentLocation: cow.location,
      currentIdleDays: cow.idleDays,
    }));

    const recommendations = engine.recommendBatch(batchData);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API endpoint for CSV export
router.post("/api/ml/export-csv", async (req, res) => {
  try {
    const { recommendations } = req.body;
    const csv = engine.exportAsCSV(recommendations);

    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", 'attachment; filename="recommendations.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
});

// Initialize ML models when server starts
export async function setupML(movements, locations) {
  await initializeML(movements, locations);
}

export default router;
```

### Frontend Integration (React)

```typescript
// client/hooks/useMLPredictions.ts
import { useState, useCallback } from "react";

export function useMLPredictions() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const getPredictions = useCallback(
    async (cowsData, aggregateFeatures) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ml/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cowsData,
            aggregateFeatures: Object.fromEntries(aggregateFeatures),
          }),
        });

        if (!response.ok) throw new Error("Prediction failed");

        const result = await response.json();
        setRecommendations(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const exportCSV = useCallback(async (recommendations) => {
    try {
      const response = await fetch("/api/ml/export-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendations }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recommendations.csv";
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  return {
    loading,
    recommendations,
    error,
    getPredictions,
    exportCSV,
  };
}
```

```typescript
// client/components/MLRecommendations.tsx
import { useMLPredictions } from "../hooks/useMLPredictions";

export function MLRecommendationsPanel({ movements, locations, aggregateFeatures }) {
  const { loading, recommendations, error, getPredictions, exportCSV } =
    useMLPredictions();

  const handleGenerateRecommendations = async () => {
    // Prepare COW data for API
    const cowsData = movements.map((mov) => ({
      id: mov.COW_ID,
      location: mov.To_Location_ID,
      idleDays: calculateIdleDays(mov),
      lastMovement: mov,
    }));

    await getPredictions(cowsData, aggregateFeatures);
  };

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">ML Movement Recommendations</h2>

      <button
        onClick={handleGenerateRecommendations}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Recommendations"}
      </button>

      {error && <div className="mt-4 p-4 bg-red-100 text-red-700">{error}</div>}

      {recommendations && (
        <div className="mt-4">
          <div className="mb-4 p-4 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">Summary</h3>
            <p>Total COWs: {recommendations.summary.totalCows}</p>
            <p>
              Needs Action: {recommendations.summary.needsImmediateAction}
            </p>
            <p>Ready to Move: {recommendations.summary.readyToMove}</p>
          </div>

          <button
            onClick={() => exportCSV(recommendations)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export as CSV
          </button>

          <div className="mt-4 max-h-96 overflow-y-auto">
            {recommendations.predictions.map(({ cowId, recommendation }) => (
              <RecommendationCard
                key={cowId}
                cowId={cowId}
                recommendation={recommendation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Model Evaluation

### Metrics Interpretation

#### Classification Metrics (Next Location)

```typescript
const metrics = model.evaluate(testData);

console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
console.log(`Macro F1: ${(metrics.macroF1 * 100).toFixed(2)}%`);
console.log(`Top-3 Accuracy: ${(metrics.topKAccuracy.get(3) * 100).toFixed(2)}%`);
```

- **Accuracy**: % of correct predictions
- **Precision**: Of predicted locations, how many were correct
- **Recall**: Of actual locations, how many were predicted
- **F1 Score**: Harmonic mean of precision and recall
- **Top-K Accuracy**: % correct in top K predictions

#### Regression Metrics (Optimal Stay)

```typescript
const metrics = model.evaluate(testData);

console.log(`RMSE: ${metrics.rmse.toFixed(2)} days`);
console.log(`R² Score: ${(metrics.r2Score * 100).toFixed(2)}%`);
console.log(`MAPE: ${(metrics.mape * 100).toFixed(2)}%`);
```

- **RMSE**: Average prediction error in days
- **R² Score**: How well model explains variance (0-1)
- **MAPE**: Mean Absolute Percentage Error
- **MAE**: Average absolute error in days

#### Clustering Metrics

```typescript
const metrics = model.evaluate(testData);

console.log(`Silhouette Score: ${metrics.silhouetteScore.toFixed(3)}`);
console.log(`Separability: ${(metrics.separability * 100).toFixed(2)}%`);
```

- **Silhouette Score**: -1 to 1 (higher is better)
- **Separability**: How distinct clusters are (0-1)
- **Inertia**: Within-cluster compactness

## Performance Optimization

### Batch Predictions

```typescript
// Process multiple COWs efficiently
const batchResults = engine.recommendBatch(cowsList);

// Predictions are cached internally
console.log("Batch completed in", new Date() - startTime, "ms");
```

### Caching

```typescript
const predictionService = new RealtimePredictionService(engine);

// Subsequent requests use cache (1 hour default)
const rec1 = predictionService.getRecommendation(...);
const rec2 = predictionService.getRecommendation(...); // Much faster

// Clear when data updates
predictionService.clearCache();
```

### Feature Normalization

```typescript
const scaler = new FeatureScaler();
scaler.fit(allFeatureVectors); // Learn statistics

// Transform all vectors
const normalized = vectors.map((v) => scaler.transform(v));

// Ensure model trains on normalized features
await model.train(normalized);
```

## Troubleshooting

### Issue: Low Prediction Accuracy

**Solution:**

1. Check data quality:
   ```typescript
   const quality = pipeline.assessDataQuality();
   if (quality.overallQualityScore < 0.8) {
     // Clean data first
   }
   ```

2. Increase training data size
3. Tune hyperparameters
4. Add more features

### Issue: Overfitting

**Solution:**

```typescript
const learningCurve = await LearningCurveAnalysis
  .generateLearningCurve(model, dataset);

const isOverfitting = LearningCurveAnalysis
  .detectOverfitting(learningCurve, 0.15);

// Add regularization or reduce model complexity
```

### Issue: Slow Predictions

**Solution:**

1. Use caching:
   ```typescript
   const predictionService = new RealtimePredictionService(engine);
   ```

2. Reduce feature vector size
3. Use batch predictions for multiple COWs

## Advanced Features

### Ensemble Predictions

```typescript
import { ModelEnsemble } from "./ml";

// Get predictions from multiple models
const pred1 = model1.predict(features, 3);
const pred2 = model2.predict(features, 3);
const pred3 = model3.predict(features, 3);

// Combine using voting
const ensemble = ModelEnsemble.voteEnsemble([
  pred1[0].predictions,
  pred2[0].predictions,
  pred3[0].predictions,
]);

console.log("Ensemble predictions:", ensemble);
```

### Outlier Detection

```typescript
import { OutlierDetector } from "./ml";

const values = [1, 2, 3, 100]; // 100 is outlier

const outliers = OutlierDetector.detectByIQR(values);
// [false, false, false, true]

// Use Z-score method
const outliers2 = OutlierDetector.detectByZScore(values, 2);
```

### Missing Value Handling

```typescript
import { MissingValueHandler } from "./ml";

// Fill with mean
const filled = MissingValueHandler.fillWithMean(vectors);

// Forward fill (time-series)
const ffilled = MissingValueHandler.forwardFill(vectors);

// Remove rows with missing values
const clean = MissingValueHandler.dropMissing(vectors);
```

## Production Checklist

- [ ] Data quality score > 0.85
- [ ] All models trained and validated
- [ ] Cross-validation performed (5-fold minimum)
- [ ] No overfitting detected
- [ ] Models exported and saved
- [ ] Backend API endpoints tested
- [ ] Frontend integration tested
- [ ] Caching configured
- [ ] Error handling implemented
- [ ] Monitoring/logging in place
- [ ] Documentation updated
- [ ] Performance tested with full dataset

## Support and Updates

For issues, improvements, or model updates:

1. Check data quality first
2. Re-train models with latest data monthly
3. Evaluate metrics to detect degradation
4. Update feature engineering as movement patterns change
5. Monitor prediction accuracy in production

## License and Attribution

This ML module is part of the COW Dashboard system.
