# COW Movement ML Module - Example Usage

## Complete Working Example

This document provides step-by-step examples of how to use the ML module in different scenarios.

## Scenario 1: One-Time Training and Prediction

```typescript
import {
  DataPreparationPipeline,
  KNNNextLocationModel,
  LinearRegressionOptimalStayModel,
  KMeansClusteringModel,
  ModelTrainingPipeline,
  FeatureEngineer,
  MovementRecommendationEngine,
} from "./ml";
import { movements, locations } from "./data";

async function trainAndPredict() {
  // Step 1: Prepare data
  console.log("📊 Preparing data...");
  const pipeline = new DataPreparationPipeline(movements, locations);
  
  // Check data quality
  const quality = pipeline.assessDataQuality();
  console.log(`Data Quality: ${(quality.overallQualityScore * 100).toFixed(1)}%`);
  
  if (quality.issues.length > 0) {
    console.warn("Data issues found:");
    quality.issues.forEach((issue) => {
      console.warn(`  - ${issue.type}: ${issue.description}`);
    });
  }

  // Create training dataset
  const dataset = pipeline.createTrainingDataset();
  console.log(
    `✓ Prepared ${dataset.nextLocationSamples.length} location samples`
  );
  console.log(
    `✓ Prepared ${dataset.optimalStaySamples.length} stay duration samples`
  );
  console.log(
    `✓ Prepared ${dataset.clusteringSamples.length} clustering samples`
  );

  // Step 2: Train models
  console.log("\n🤖 Training models...");

  const nextLocationModel = new KNNNextLocationModel();
  const optimalStayModel = new LinearRegressionOptimalStayModel();
  const clusteringModel = new KMeansClusteringModel();

  const { bestModel: locationModel, metrics: locationMetrics } =
    await ModelTrainingPipeline.trainNextLocationModel(
      nextLocationModel,
      dataset,
      5
    );
  console.log(`✓ Next Location Model - Accuracy: ${(locationMetrics[0]?.accuracy * 100).toFixed(1)}%`);

  const { bestModel: stayModel, metrics: stayMetrics } =
    await ModelTrainingPipeline.trainOptimalStayModel(
      optimalStayModel,
      dataset,
      5
    );
  console.log(`✓ Optimal Stay Model - R² Score: ${(stayMetrics[0]?.r2Score * 100).toFixed(1)}%`);

  const { model: clusterModel, metrics: clusterMetrics } =
    await ModelTrainingPipeline.trainClusteringModel(clusteringModel, dataset);
  console.log(
    `✓ Clustering Model - Silhouette: ${(clusterMetrics.silhouetteScore).toFixed(3)}`
  );

  // Step 3: Generate recommendations
  console.log("\n💡 Generating recommendations...");

  const engine = new MovementRecommendationEngine();
  engine.setModels(locationModel, stayModel, clusterModel);

  const engineer = new FeatureEngineer();
  engineer.fitScaler(dataset.nextLocationSamples.map((s) => s.features));

  // Get COWs that need action (just examples)
  const cowsToAnalyze = [
    {
      cowId: "COW_001",
      features: dataset.nextLocationSamples[0].features,
      currentLocation: "WH_RIYADH",
      currentIdleDays: 35,
    },
    {
      cowId: "COW_002",
      features: dataset.nextLocationSamples[1].features,
      currentLocation: "WH_JEDDAH",
      currentIdleDays: 45,
    },
  ];

  const recommendations = engine.recommendBatch(cowsToAnalyze);

  // Step 4: Display results
  console.log("\n📋 Results:");
  const report = engine.generateReport(recommendations);
  console.log(report);

  // Step 5: Export data
  const csv = engine.exportAsCSV(recommendations);
  const json = engine.exportAsJSON(recommendations);

  console.log("\n✅ Training complete!");
  console.log(`Summary: ${recommendations.summary.needsImmediateAction} COWs need action`);

  return { engine, models: { locationModel, stayModel, clusterModel } };
}

// Run the example
trainAndPredict().catch(console.error);
```

## Scenario 2: Daily Batch Processing

```typescript
// server/routes/daily-ml-batch.ts
import * as cron from "node-cron";
import {
  DataPreparationPipeline,
  MovementRecommendationEngine,
  FeatureEngineer,
  ModelPersistence,
} from "../ml";
import { getMovementsFromDB, getLocationsFromDB } from "../db";
import { sendRecommendationEmail } from "../email";

// Load pre-trained models at startup
let engine: MovementRecommendationEngine;
let engineer: FeatureEngineer;

function loadModels() {
  const locationModel = ModelPersistence.loadModel("location_model_v1");
  const stayModel = ModelPersistence.loadModel("stay_model_v1");
  const clusterModel = ModelPersistence.loadModel("cluster_model_v1");

  if (locationModel && stayModel && clusterModel) {
    // Decode and setup engine
    engine = new MovementRecommendationEngine();
    // Setup with loaded models
  } else {
    throw new Error("Models not found. Please train models first.");
  }
}

// Schedule daily batch run at 8 AM
cron.schedule("0 8 * * *", async () => {
  try {
    console.log("[BATCH] Starting daily COW analysis...");

    const movements = await getMovementsFromDB();
    const locations = await getLocationsFromDB();

    // Get current COW state
    const cowsData = await getCowsStateFromDB();

    // Prepare features
    const pipeline = new DataPreparationPipeline(movements, locations);
    const aggregateFeatures = pipeline.calculateCowAggregateFeatures(
      pipeline.extractMovementFeatures()
    );

    // Generate batch recommendations
    const cowsBatch = cowsData.map((cow) => ({
      cowId: cow.id,
      features: engineer.createMovementFeatureVector(
        cow.lastMovement,
        aggregateFeatures.get(cow.id)
      ),
      currentLocation: cow.location,
      currentIdleDays: cow.idleDays,
    }));

    const recommendations = engine.recommendBatch(cowsBatch);

    // Save recommendations to DB
    await saveRecommendationsToDb(recommendations);

    // Send email to operations team
    const csv = engine.exportAsCSV(recommendations);
    await sendRecommendationEmail({
      to: "operations@company.com",
      subject: `Daily COW Movement Recommendations - ${new Date().toDateString()}`,
      body: engine.generateReport(recommendations),
      attachment: csv,
    });

    console.log(`[BATCH] Completed: ${recommendations.summary.totalCows} COWs analyzed`);
  } catch (error) {
    console.error("[BATCH] Error:", error);
  }
});

loadModels();
```

## Scenario 3: Real-time API with Caching

```typescript
// server/routes/realtime-predictions.ts
import express from "express";
import {
  MovementRecommendationEngine,
  RealtimePredictionService,
  FeatureEngineer,
} from "../ml";

const router = express.Router();

let predictionService: RealtimePredictionService;
let engineer: FeatureEngineer;

// Initialize services (call once at startup)
export function initializeRealtimeML(engine: MovementRecommendationEngine) {
  predictionService = new RealtimePredictionService(engine);
  engineer = new FeatureEngineer();
}

// Endpoint: Get prediction for a single COW
router.get("/api/ml/predict/:cowId", async (req, res) => {
  try {
    const { cowId } = req.params;

    // Get COW data
    const cow = await getCowFromDb(cowId);
    const movements = await getCowMovementsFromDb(cowId);
    const locations = await getLocationsFromDb();

    // Create features
    const pipeline = new DataPreparationPipeline(movements, locations);
    const aggregateFeatures = pipeline.calculateCowAggregateFeatures(
      pipeline.extractMovementFeatures()
    );

    const features = engineer.createMovementFeatureVector(
      cow.lastMovement,
      aggregateFeatures.get(cowId)
    );

    // Get cached recommendation
    const recommendation = predictionService.getRecommendation(
      cowId,
      features,
      cow.currentLocation,
      cow.idleDays
    );

    res.json({
      success: true,
      data: recommendation,
      cached: true, // Indicates if result was cached
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Endpoint: Force cache refresh
router.post("/api/ml/refresh-cache", (req, res) => {
  predictionService.clearCache();
  res.json({ success: true, message: "Cache cleared" });
});

// Endpoint: Get cache stats
router.get("/api/ml/cache-stats", (req, res) => {
  const stats = predictionService.getCacheStats();
  res.json(stats);
});

export default router;
```

## Scenario 4: Hyperparameter Tuning

```typescript
import {
  DataPreparationPipeline,
  KNNNextLocationModel,
  ModelTrainingPipeline,
} from "./ml";

async function tuneModels() {
  console.log("🔧 Starting hyperparameter tuning...");

  const pipeline = new DataPreparationPipeline(movements, locations);
  const dataset = pipeline.createTrainingDataset();

  const model = new KNNNextLocationModel();

  // Define parameter grid
  const paramGrid = {
    k: [3, 5, 7, 9, 11],
    distance: ["euclidean"],
  };

  // Run grid search
  const results = await ModelTrainingPipeline
    .tuneNextLocationHyperparameters(model, dataset, paramGrid);

  console.log("\nTuning Results:");
  console.log("===============");
  console.log(`Best Parameters: k=${results.bestParams.k}, distance=${results.bestParams.distance}`);
  console.log(`Best Score: ${(results.bestScore * 100).toFixed(2)}%`);
  console.log("\nTop 5 Parameter Combinations:");

  results.results.slice(0, 5).forEach((result, index) => {
    console.log(
      `${index + 1}. k=${result.params.k} → ${(result.score * 100).toFixed(2)}%`
    );
  });

  return results;
}

tuneModels();
```

## Scenario 5: Model Monitoring and Updates

```typescript
// server/tasks/monthly-model-retraining.ts
import {
  DataPreparationPipeline,
  KNNNextLocationModel,
  LinearRegressionOptimalStayModel,
  KMeansClusteringModel,
  ModelTrainingPipeline,
  ModelPersistence,
  CrossValidator,
  LearningCurveAnalysis,
} from "../ml";

async function retrainModelsMonthly() {
  console.log("[RETRAIN] Starting monthly model retraining...");

  // Get latest movements from DB
  const movements = await getMovementsFromDB({
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
  });
  const locations = await getLocationsFromDB();

  // Prepare data
  const pipeline = new DataPreparationPipeline(movements, locations);
  const quality = pipeline.assessDataQuality();

  if (quality.overallQualityScore < 0.8) {
    console.warn("[RETRAIN] Data quality too low, skipping retraining");
    return;
  }

  const dataset = pipeline.createTrainingDataset();

  // Train new models
  console.log("[RETRAIN] Training new models...");

  const locationModel = new KNNNextLocationModel();
  const stayModel = new LinearRegressionOptimalStayModel();
  const clusterModel = new KMeansClusteringModel();

  const { bestModel: locModel, metrics: locMetrics } =
    await ModelTrainingPipeline.trainNextLocationModel(locationModel, dataset);

  const { bestModel: stayModelTrained, metrics: stayMetrics } =
    await ModelTrainingPipeline.trainOptimalStayModel(stayModel, dataset);

  const { model: clusterModelTrained, metrics: clusterMetrics } =
    await ModelTrainingPipeline.trainClusteringModel(clusterModel, dataset);

  // Check for overfitting
  console.log("[RETRAIN] Analyzing model performance...");

  const learningCurve = await LearningCurveAnalysis.generateLearningCurve(
    locationModel,
    dataset
  );

  const isOverfitting = LearningCurveAnalysis.detectOverfitting(learningCurve);

  if (isOverfitting) {
    console.warn("[RETRAIN] Warning: Model shows signs of overfitting");
  }

  // Report CV results
  const cvReport = CrossValidator.reportCVResults(
    locMetrics,
    "Next Location Model"
  );
  console.log(cvReport);

  // Compare with current models
  const oldLocationModel = ModelPersistence.loadModel("location_model_v1");
  const oldMetrics = oldLocationModel?.metrics || {};

  const newAccuracy = locMetrics[0]?.accuracy || 0;
  const oldAccuracy = oldMetrics.overallPerformance || 0;

  console.log(
    `[RETRAIN] Performance: Old=${(oldAccuracy * 100).toFixed(1)}% vs New=${(newAccuracy * 100).toFixed(1)}%`
  );

  if (newAccuracy > oldAccuracy) {
    console.log("[RETRAIN] New model is better! Saving...");

    // Save new models
    ModelPersistence.saveModel(locModel, "location_model_v2");
    ModelPersistence.saveModel(stayModelTrained, "stay_model_v2");
    ModelPersistence.saveModel(clusterModelTrained, "cluster_model_v2");

    // Update active models
    await updateActiveModels({
      locationModel: "location_model_v2",
      stayModel: "stay_model_v2",
      clusteringModel: "cluster_model_v2",
    });

    console.log("[RETRAIN] Models updated successfully");

    // Send notification
    await sendNotification({
      type: "MODEL_UPDATE",
      message: `ML models updated. Location accuracy improved to ${(newAccuracy * 100).toFixed(1)}%`,
    });
  } else {
    console.log("[RETRAIN] New model is not better, keeping current models");
  }

  console.log("[RETRAIN] Monthly retraining complete");
}

// Run monthly on the first day
cron.schedule("0 0 1 * *", () => {
  retrainModelsMonthly().catch(console.error);
});
```

## Scenario 6: Frontend Dashboard Integration

```typescript
// client/pages/MLAnalytics.tsx
import { useState, useEffect } from "react";
import { useMLPredictions } from "../hooks/useMLPredictions";

export function MLAnalyticsDashboard() {
  const [cowsData, setCowsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getPredictions, recommendations, exportCSV, error } =
    useMLPredictions();

  useEffect(() => {
    // Fetch COWs data on mount
    fetchCowsData();
  }, []);

  const fetchCowsData = async () => {
    const response = await fetch("/api/cows");
    const data = await response.json();
    setCowsData(data);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    await getPredictions(cowsData, new Map());
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">ML Movement Analytics</h1>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze All COWs"}
      </button>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {recommendations && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total COWs"
            value={recommendations.summary.totalCows}
          />
          <StatCard
            label="Need Action"
            value={recommendations.summary.needsImmediateAction}
            color="red"
          />
          <StatCard
            label="Ready to Move"
            value={recommendations.summary.readyToMove}
            color="yellow"
          />
          <StatCard
            label="Can Wait"
            value={recommendations.summary.canWait}
            color="green"
          />
        </div>
      )}

      {recommendations && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recommendations</h2>
          <button
            onClick={() => exportCSV(recommendations)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export as CSV
          </button>

          <div className="space-y-2 max-h-96 overflow-y-auto">
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

function StatCard({ label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-900",
    red: "bg-red-100 text-red-900",
    yellow: "bg-yellow-100 text-yellow-900",
    green: "bg-green-100 text-green-900",
  };

  return (
    <div className={`p-6 rounded-lg ${colors[color]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function RecommendationCard({ cowId, recommendation }) {
  const rec = recommendation.recommendations[0];
  const location = rec?.suggestedLocations[0];

  return (
    <div className="p-4 border rounded-lg hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold">{cowId}</p>
          <p className="text-sm text-gray-600">
            Currently at {recommendation.currentLocation} ({recommendation.currentIdleDays} days idle)
          </p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-bold ${
          rec?.priority === "high" ? "bg-red-200 text-red-900" :
          rec?.priority === "medium" ? "bg-yellow-200 text-yellow-900" :
          "bg-green-200 text-green-900"
        }`}>
          {rec?.priority?.toUpperCase()}
        </span>
      </div>
      {location && (
        <div className="mt-3 p-3 bg-white rounded">
          <p className="text-sm">
            <strong>Recommended:</strong> {location.location}
          </p>
          <p className="text-sm">
            <strong>Confidence:</strong> {(location.confidence * 100).toFixed(0)}%
          </p>
          <p className="text-sm">
            <strong>Est. Stay:</strong> {location.estimatedStay.toFixed(1)} days
          </p>
        </div>
      )}
    </div>
  );
}
```

## Scenario 7: Data Quality Monitoring

```typescript
import { DataPreparationPipeline } from "./ml";

async function monitorDataQuality() {
  const movements = await getMovementsFromDB();
  const locations = await getLocationsFromDB();

  const pipeline = new DataPreparationPipeline(movements, locations);
  const report = pipeline.assessDataQuality();

  // Log quality metrics
  console.log("📊 Data Quality Report");
  console.log("=====================");
  console.log(`Total Records: ${report.totalRecords}`);
  console.log(`Completeness: ${(report.completenessScore * 100).toFixed(1)}%`);
  console.log(`Consistency: ${(report.consistencyScore * 100).toFixed(1)}%`);
  console.log(`Validity: ${(report.validityScore * 100).toFixed(1)}%`);
  console.log(`Accuracy: ${(report.accuracyScore * 100).toFixed(1)}%`);
  console.log(`Overall: ${(report.overallQualityScore * 100).toFixed(1)}%`);

  // Alert if quality drops
  if (report.overallQualityScore < 0.8) {
    await sendAlert({
      level: "warning",
      message: "Data quality dropped below 80%",
      issues: report.issues.filter((i) => i.severity === "critical"),
    });
  }

  // Save report
  await saveQualityReportToDB(report);
}

// Run daily
cron.schedule("0 9 * * *", () => {
  monitorDataQuality().catch(console.error);
});
```

## Running These Examples

### Prerequisites

```bash
npm install typescript ts-node
```

### Execute Examples

```bash
# One-time training
ts-node ml-pipeline-example.ts

# Run monitoring script
ts-node monitor-quality.ts

# Start server with all routes
npm run dev
```

## Notes

- All examples assume data is available via async functions
- Adjust paths based on your project structure
- Add error handling for production use
- Monitor model performance regularly
- Retrain models monthly or when data distribution changes

## Next Steps

1. Integrate into your application
2. Set up monitoring and alerts
3. Configure automated retraining
4. Build dashboards for stakeholders
5. Gather feedback for model improvements
