/**
 * Machine Learning Models
 * Implements next location, optimal stay, and clustering models
 */

import type {
  NextLocationModel,
  OptimalStayModel,
  CowClusteringModel,
  NextLocationTrainingData,
  OptimalStayTrainingData,
  ClusteringTrainingData,
  NextLocationPrediction,
  OptimalStayPrediction,
  ClusterPrediction,
  FeatureVector,
  ClassificationMetrics,
  RegressionMetrics,
  ClusteringMetrics,
  CowCluster,
} from "./types";

/**
 * KNN-based Next Location Predictor
 * Predicts next warehouse/location for a COW
 */
export class KNNNextLocationModel implements NextLocationModel {
  name = "KNN Next Location Predictor";
  version = "1.0.0";
  modelType = "classification" as const;
  trainingDate: Date = new Date();
  hyperparameters: Record<string, any> = { k: 5, distance: "euclidean" };
  metrics: any = {};
  isTrainedAndReady = false;

  private trainingData: NextLocationTrainingData[] = [];
  private locations: string[] = [];
  private featureScaler: any;

  async train(data: NextLocationTrainingData[]): Promise<void> {
    this.trainingData = data;
    this.locations = Array.from(
      new Set(data.map((d) => d.nextLocation)),
    ).sort();
    this.isTrainedAndReady = true;
    this.trainingDate = new Date();
  }

  predict(features: FeatureVector, topK: number = 3): NextLocationPrediction[] {
    if (!this.isTrainedAndReady || this.trainingData.length === 0) {
      return [];
    }

    const k = this.hyperparameters.k || 5;
    const distances = this.trainingData.map((sample) => ({
      sample,
      distance: this.euclideanDistance(
        features.features,
        sample.features.features,
      ),
    }));

    // Find k nearest neighbors
    const neighbors = distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k)
      .map((d) => d.sample);

    // Count location frequencies among neighbors
    const locationFreq = new Map<string, number>();
    for (const neighbor of neighbors) {
      locationFreq.set(
        neighbor.nextLocation,
        (locationFreq.get(neighbor.nextLocation) || 0) + 1,
      );
    }

    // Calculate probabilities
    const predictions = Array.from(locationFreq.entries())
      .map(([location, count]) => ({
        location,
        probability: count / k,
        confidence: count / k,
        reasoning: `${count} of ${k} nearest neighbors moved to ${location}`,
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, topK);

    const topRecommendation =
      predictions.length > 0
        ? {
            location: predictions[0].location,
            probability: predictions[0].probability,
            rationale: predictions[0].reasoning,
          }
        : {
            location: "Unknown",
            probability: 0,
            rationale: "No predictions available",
          };

    return [
      {
        cowId: features.metadata?.currentLocation || features.cowId,
        predictions,
        topRecommendation,
        alternativeOptions: predictions.slice(1),
        timestamp: features.timestamp,
      },
    ];
  }

  evaluate(testData: NextLocationTrainingData[]): ClassificationMetrics {
    const predictions = testData.map((d) => {
      const pred = this.predict(d.features, 1);
      return pred[0]?.topRecommendation.location || "Unknown";
    });

    const correct = predictions.filter(
      (pred, i) => pred === testData[i].nextLocation,
    ).length;
    const accuracy = correct / testData.length;

    return {
      accuracy,
      precision: new Map(),
      recall: new Map(),
      f1Score: new Map(),
      macroF1: 0,
      confusionMatrix: [],
      topKAccuracy: new Map(),
      trainingLoss: 0,
      validationLoss: 0,
      overallPerformance: accuracy,
      lastUpdated: new Date(),
    };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0),
    );
  }

  encode(): string {
    return JSON.stringify({
      trainingData: this.trainingData,
      locations: this.locations,
      hyperparameters: this.hyperparameters,
    });
  }

  decode(data: string): void {
    const parsed = JSON.parse(data);
    this.trainingData = parsed.trainingData;
    this.locations = parsed.locations;
    this.hyperparameters = parsed.hyperparameters;
    this.isTrainedAndReady = true;
  }
}

/**
 * Linear Regression-based Optimal Stay Duration Predictor
 * Predicts how long a COW should stay at a warehouse
 */
export class LinearRegressionOptimalStayModel implements OptimalStayModel {
  name = "Linear Regression Optimal Stay Predictor";
  version = "1.0.0";
  modelType = "regression" as const;
  trainingDate: Date = new Date();
  hyperparameters: Record<string, any> = { learningRate: 0.01, iterations: 100 };
  metrics: any = {};
  isTrainedAndReady = false;

  private coefficients: number[] = [];
  private intercept = 0;
  private featureMeans: number[] = [];
  private featureStds: number[] = [];

  async train(data: OptimalStayTrainingData[]): Promise<void> {
    if (data.length === 0) return;

    // Normalize features
    const featureCount = data[0].features.features.length;
    this.featureMeans = Array(featureCount).fill(0);
    this.featureStds = Array(featureCount).fill(1);

    // Calculate means and stds
    for (let i = 0; i < featureCount; i++) {
      const values = data.map((d) => d.features.features[i]);
      this.featureMeans[i] =
        values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce(
          (sum, val) =>
            sum +
            Math.pow(val - this.featureMeans[i], 2),
          0,
        ) / values.length;
      this.featureStds[i] = Math.sqrt(variance) || 1;
    }

    // Simple linear regression using normal equation
    const X = data.map((d) => {
      return d.features.features.map(
        (f, i) => (f - this.featureMeans[i]) / this.featureStds[i],
      );
    });

    const y = data.map((d) => d.actualStayDays);

    // Add bias term
    const X_with_bias = X.map((row) => [1, ...row]);

    // Normal equation: β = (X^T X)^-1 X^T y
    this.coefficients = this.simpleLinearFit(X_with_bias, y);
    this.intercept = this.coefficients[0];

    this.isTrainedAndReady = true;
    this.trainingDate = new Date();
  }

  predict(features: FeatureVector): OptimalStayPrediction {
    if (!this.isTrainedAndReady) {
      return {
        cowId: features.cowId,
        currentLocation: features.metadata?.currentLocation || "Unknown",
        predictedStayDays: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        movementReadinessScore: 0,
        reasoning: "Model not trained",
        timestamp: features.timestamp,
      };
    }

    const normalizedFeatures = features.features.map(
      (f, i) => (f - this.featureMeans[i]) / this.featureStds[i],
    );

    const prediction =
      this.intercept +
      normalizedFeatures.reduce(
        (sum, val, i) => sum + val * (this.coefficients[i + 1] || 0),
        0,
      );

    const clampedPrediction = Math.max(1, Math.min(90, prediction)); // Clamp between 1-90 days

    // Calculate movement readiness (how soon should it move)
    const currentIdle = features.metadata?.currentIdleDays || 0;
    const movementReadinessScore = Math.min(
      1,
      currentIdle / clampedPrediction,
    );

    return {
      cowId: features.cowId,
      currentLocation: features.metadata?.currentLocation || "Unknown",
      predictedStayDays: clampedPrediction,
      confidenceInterval: {
        lower: Math.max(1, clampedPrediction * 0.8),
        upper: clampedPrediction * 1.2,
      },
      movementReadinessScore,
      reasoning: `Based on historical patterns, expected stay is ${clampedPrediction.toFixed(1)} days. Currently idle for ${currentIdle} days.`,
      timestamp: features.timestamp,
    };
  }

  evaluate(testData: OptimalStayTrainingData[]): RegressionMetrics {
    const predictions = testData.map((d) => this.predict(d.features));
    const actual = testData.map((d) => d.actualStayDays);
    const pred = predictions.map((p) => p.predictedStayDays);

    const mae =
      pred.reduce((sum, p, i) => sum + Math.abs(p - actual[i]), 0) /
      pred.length;
    const mse =
      pred.reduce((sum, p, i) => sum + Math.pow(p - actual[i], 2), 0) /
      pred.length;
    const rmse = Math.sqrt(mse);

    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const ssRes = actual.reduce(
      (sum, val, i) => sum + Math.pow(val - pred[i], 2),
      0,
    );
    const r2Score = 1 - ssRes / ssTotal;

    const mape =
      pred.reduce(
        (sum, p, i) => sum + Math.abs((actual[i] - p) / (actual[i] || 1)),
        0,
      ) / pred.length;

    return {
      mae,
      mse,
      rmse,
      r2Score,
      mape,
      residualAnalysis: {
        mean: 0,
        stdDev: 0,
        percentageWithin10Percent: 0,
      },
      trainingLoss: mse,
      validationLoss: mse,
      overallPerformance: Math.max(0, r2Score),
      lastUpdated: new Date(),
    };
  }

  private simpleLinearFit(X: number[][], y: number[]): number[] {
    // Simplified least squares fit
    const coefficients: number[] = Array(X[0].length).fill(0);

    // For simplicity, use gradient descent
    for (let iter = 0; iter < 100; iter++) {
      const gradients = Array(coefficients.length).fill(0);

      for (let i = 0; i < X.length; i++) {
        const pred = coefficients.reduce(
          (sum, coef, j) => sum + coef * X[i][j],
          0,
        );
        const error = pred - y[i];

        for (let j = 0; j < coefficients.length; j++) {
          gradients[j] += error * X[i][j];
        }
      }

      // Update coefficients
      const learningRate = 0.001;
      for (let j = 0; j < coefficients.length; j++) {
        coefficients[j] -= (learningRate * gradients[j]) / X.length;
      }
    }

    return coefficients;
  }

  encode(): string {
    return JSON.stringify({
      coefficients: this.coefficients,
      intercept: this.intercept,
      featureMeans: this.featureMeans,
      featureStds: this.featureStds,
    });
  }

  decode(data: string): void {
    const parsed = JSON.parse(data);
    this.coefficients = parsed.coefficients;
    this.intercept = parsed.intercept;
    this.featureMeans = parsed.featureMeans;
    this.featureStds = parsed.featureStds;
    this.isTrainedAndReady = true;
  }
}

/**
 * K-Means Clustering Model
 * Groups COWs with similar movement patterns
 */
export class KMeansClusteringModel implements CowClusteringModel {
  name = "K-Means COW Clustering";
  version = "1.0.0";
  modelType = "clustering" as const;
  trainingDate: Date = new Date();
  hyperparameters: Record<string, any> = { k: 3, maxIterations: 100 };
  metrics: any = {};
  isTrainedAndReady = false;

  numClusters: number = 3;
  private centroids: FeatureVector[] = [];
  private assignments: Map<string, number> = new Map();

  async train(data: ClusteringTrainingData[]): Promise<void> {
    const k = this.hyperparameters.k || 3;
    this.numClusters = k;

    if (data.length === 0) return;

    // Initialize centroids randomly
    const indices = Array.from(
      { length: Math.min(k, data.length) },
      () => Math.floor(Math.random() * data.length),
    );

    this.centroids = indices.map((i) => ({
      ...data[i].features,
      cowId: `centroid_${i}`,
    }));

    // Iterate until convergence
    for (let iter = 0; iter < (this.hyperparameters.maxIterations || 100); iter++) {
      // Assign points to nearest centroid
      const newAssignments = new Map<string, number>();
      for (const sample of data) {
        let minDistance = Infinity;
        let bestCluster = 0;

        for (let c = 0; c < this.centroids.length; c++) {
          const distance = this.euclideanDistance(
            sample.features.features,
            this.centroids[c].features,
          );
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = c;
          }
        }

        newAssignments.set(sample.cowId, bestCluster);
      }

      this.assignments = newAssignments;

      // Update centroids
      const clusters: number[][] = Array(k)
        .fill(null)
        .map(() => []);

      for (const sample of data) {
        const cluster = this.assignments.get(sample.cowId) || 0;
        clusters[cluster].push(...sample.features.features);
      }

      for (let c = 0; c < k; c++) {
        if (clusters[c].length > 0) {
          const featureCount =
            data[0]?.features.features.length || 0;
          const newCentroid = Array(featureCount).fill(0);

          for (let i = 0; i < featureCount; i++) {
            const values = [];
            for (let j = 0; j < clusters[c].length; j += featureCount) {
              if (clusters[c][j + i] !== undefined) {
                values.push(clusters[c][j + i]);
              }
            }
            newCentroid[i] =
              values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;
          }

          this.centroids[c] = {
            ...this.centroids[c],
            features: newCentroid,
          };
        }
      }
    }

    this.isTrainedAndReady = true;
    this.trainingDate = new Date();
  }

  predict(features: FeatureVector): ClusterPrediction {
    if (!this.isTrainedAndReady) {
      return {
        cowId: features.cowId,
        clusterId: 0,
        clusterName: "Unassigned",
        similarityScore: 0,
        clusterCharacteristics: {
          avgIdleDays: 0,
          mostCommonPath: "Unknown",
          preferredRegion: "Unknown",
          typicalStayDuration: 0,
        },
        timestamp: features.timestamp,
      };
    }

    let minDistance = Infinity;
    let bestCluster = 0;

    for (let c = 0; c < this.centroids.length; c++) {
      const distance = this.euclideanDistance(
        features.features,
        this.centroids[c].features,
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestCluster = c;
      }
    }

    const similarityScore = 1 / (1 + minDistance);

    return {
      cowId: features.cowId,
      clusterId: bestCluster,
      clusterName: `Cluster_${bestCluster}`,
      similarityScore,
      clusterCharacteristics: {
        avgIdleDays: features.features[0] || 0,
        mostCommonPath: "See cluster details",
        preferredRegion: "See cluster details",
        typicalStayDuration: features.features[0] || 0,
      },
      timestamp: features.timestamp,
    };
  }

  getClusters(): CowCluster[] {
    const clusters: CowCluster[] = [];

    // Group COWs by cluster
    const clusterMap = new Map<number, string[]>();
    for (const [cowId, clusterId] of this.assignments) {
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, []);
      }
      clusterMap.get(clusterId)!.push(cowId);
    }

    for (const [clusterId, cowIds] of clusterMap) {
      clusters.push({
        id: clusterId,
        name: `Cluster ${clusterId}`,
        cowIds,
        size: cowIds.length,
        characteristics: {
          avgMovements: 0,
          avgIdleDays: 0,
          mostCommonPaths: [],
          regions: [],
          seasonalPattern: false,
        },
        centroid: this.centroids[clusterId] || this.centroids[0],
      });
    }

    return clusters;
  }

  evaluate(testData: ClusteringTrainingData[]): ClusteringMetrics {
    // Simple silhouette score calculation
    let silhouetteSum = 0;

    for (const sample of testData) {
      const clusterId = this.assignments.get(sample.cowId) || 0;
      const centroid = this.centroids[clusterId];

      const intraClusterDist = this.euclideanDistance(
        sample.features.features,
        centroid.features,
      );

      let minInterClusterDist = Infinity;
      for (let c = 0; c < this.centroids.length; c++) {
        if (c !== clusterId) {
          const dist = this.euclideanDistance(
            sample.features.features,
            this.centroids[c].features,
          );
          minInterClusterDist = Math.min(minInterClusterDist, dist);
        }
      }

      const silhouette =
        (minInterClusterDist - intraClusterDist) /
        Math.max(intraClusterDist, minInterClusterDist);
      silhouetteSum += silhouette;
    }

    const silhouetteScore = silhouetteSum / testData.length;

    return {
      silhouetteScore,
      daviesBouldinIndex: 0,
      calinskiHarabaszScore: 0,
      inertia: 0,
      separability: Math.max(0, silhouetteScore),
      clusterSizes: new Map(),
      clusterCohesion: new Map(),
      trainingLoss: 0,
      validationLoss: 0,
      overallPerformance: Math.max(0, silhouetteScore),
      lastUpdated: new Date(),
    };
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0),
    );
  }

  encode(): string {
    return JSON.stringify({
      centroids: this.centroids,
      assignments: Array.from(this.assignments.entries()),
      numClusters: this.numClusters,
    });
  }

  decode(data: string): void {
    const parsed = JSON.parse(data);
    this.centroids = parsed.centroids;
    this.assignments = new Map(parsed.assignments);
    this.numClusters = parsed.numClusters;
    this.isTrainedAndReady = true;
  }
}
