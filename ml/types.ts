/**
 * ML Module Type Definitions
 * Core data structures for the COW movement prediction system
 */

// ============================================================================
// 1. FEATURE ENGINEERING TYPES
// ============================================================================

/**
 * Represents a single movement event with extracted features
 */
export interface MovementFeatures {
  cowId: string;
  fromLocation: string;
  fromLocationType: string;
  toLocation: string;
  toLocationType: string;
  movedDateTime: Date;
  reachedDateTime: Date;
  idleDays: number;
  movementType: "Half" | "Zero" | "Full" | "Unknown";
  region: string;
  dayOfWeek: number;
  monthOfYear: number;
  quarter: number;
  isWarehouse: boolean;
  isSeasonal: boolean;
  consecutiveMovements: number;
}

/**
 * Aggregated features for a COW over a time window
 */
export interface CowAggregateFeatures {
  cowId: string;
  totalMovements: number;
  averageIdleDays: number;
  averageIdleDaysWarehouse: number;
  averageIdleDaysOffsite: number;
  stdDevIdleDays: number;
  mostCommonFromLocation: string;
  mostCommonToLocation: string;
  mostCommonToWarehouse: string;
  favoriteRegions: Map<string, number>; // region -> frequency
  movementFrequencyPerMonth: number;
  preferredMovementTypes: Map<string, number>; // type -> frequency
  averageStayDurationPattern: number; // days
  lastMovementDaysAgo: number;
  totalStayDaysWarehouse: number;
  totalStayDaysOffsite: number;
  movementConsistency: number; // 0-1, how regular are movements
  hasSeasonalPattern: boolean;
  peakSeasonMonths: number[];
  offPeakSeasonMonths: number[];
}

/**
 * Vector representation for ML models
 */
export interface FeatureVector {
  cowId: string;
  features: number[];
  featureNames: string[];
  normalizedFeatures: number[];
  timestamp: Date;
  metadata: {
    currentLocation?: string;
    currentIdleDays?: number;
    isWarehouseNow?: boolean;
  };
}

// ============================================================================
// 2. TRAINING DATA TYPES
// ============================================================================

/**
 * Training sample for next location prediction (classification)
 */
export interface NextLocationTrainingData {
  cowId: string;
  currentLocation: string;
  currentIdleDays: number;
  features: FeatureVector;
  nextLocation: string; // label
  nextLocationType: string;
  nextIsWarehouse: boolean;
  timestamp: Date;
}

/**
 * Training sample for optimal stay duration prediction (regression)
 */
export interface OptimalStayTrainingData {
  cowId: string;
  fromLocation: string;
  toLocation: string;
  region: string;
  features: FeatureVector;
  actualStayDays: number; // label
  movementType: string;
  timestamp: Date;
}

/**
 * Training sample for COW clustering
 */
export interface ClusteringTrainingData {
  cowId: string;
  features: FeatureVector;
  movements: MovementFeatures[];
  aggregateFeatures: CowAggregateFeatures;
}

/**
 * Full training dataset
 */
export interface TrainingDataset {
  nextLocationSamples: NextLocationTrainingData[];
  optimalStaySamples: OptimalStayTrainingData[];
  clusteringSamples: ClusteringTrainingData[];
  testSetPercentage: number;
  validationSetPercentage: number;
  metadata: {
    totalMovements: number;
    uniqueCows: number;
    uniqueLocations: number;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    dataQualityScore: number; // 0-1
  };
}

// ============================================================================
// 3. MODEL TYPES
// ============================================================================

/**
 * Base model interface
 */
export interface MLModel {
  name: string;
  version: string;
  modelType: ModelType;
  trainingDate: Date;
  hyperparameters: Record<string, any>;
  metrics: ModelMetrics;
  isTrainedAndReady: boolean;
  encode(): string; // For serialization
  decode(data: string): void; // For deserialization
}

/**
 * Next location prediction model
 */
export interface NextLocationModel extends MLModel {
  modelType: "classification";
  predict(
    features: FeatureVector,
    topK?: number,
  ): NextLocationPrediction[];
  train(data: NextLocationTrainingData[]): Promise<void>;
  evaluate(testData: NextLocationTrainingData[]): ClassificationMetrics;
}

/**
 * Optimal stay duration model
 */
export interface OptimalStayModel extends MLModel {
  modelType: "regression";
  predict(features: FeatureVector): OptimalStayPrediction;
  train(data: OptimalStayTrainingData[]): Promise<void>;
  evaluate(testData: OptimalStayTrainingData[]): RegressionMetrics;
}

/**
 * COW clustering model
 */
export interface CowClusteringModel extends MLModel {
  modelType: "clustering";
  numClusters: number;
  predict(features: FeatureVector): ClusterPrediction;
  train(data: ClusteringTrainingData[]): Promise<void>;
  getClusters(): CowCluster[];
  evaluate(testData: ClusteringTrainingData[]): ClusteringMetrics;
}

// ============================================================================
// 4. PREDICTION TYPES
// ============================================================================

/**
 * Prediction result for next location
 */
export interface NextLocationPrediction {
  cowId: string;
  predictions: Array<{
    location: string;
    probability: number;
    confidence: number;
    reasoning: string;
  }>;
  topRecommendation: {
    location: string;
    probability: number;
    rationale: string;
  };
  alternativeOptions: Array<{
    location: string;
    probability: number;
  }>;
  timestamp: Date;
}

/**
 * Prediction result for optimal stay
 */
export interface OptimalStayPrediction {
  cowId: string;
  currentLocation: string;
  predictedStayDays: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  movementReadinessScore: number; // 0-1, when to move
  reasoning: string;
  timestamp: Date;
}

/**
 * Prediction result for clustering
 */
export interface ClusterPrediction {
  cowId: string;
  clusterId: number;
  clusterName: string;
  similarityScore: number;
  clusterCharacteristics: {
    avgIdleDays: number;
    mostCommonPath: string;
    preferredRegion: string;
    typicalStayDuration: number;
  };
  timestamp: Date;
}

// ============================================================================
// 5. METRICS TYPES
// ============================================================================

/**
 * Base model metrics
 */
export interface ModelMetrics {
  trainingLoss: number;
  validationLoss: number;
  trainingAccuracy?: number;
  validationAccuracy?: number;
  overallPerformance: number; // 0-1
  lastUpdated: Date;
}

/**
 * Classification metrics
 */
export interface ClassificationMetrics extends ModelMetrics {
  accuracy: number; // overall accuracy
  precision: Map<string, number>; // per-location precision
  recall: Map<string, number>; // per-location recall
  f1Score: Map<string, number>; // per-location F1
  macroF1: number; // average F1
  confusionMatrix: number[][];
  topKAccuracy: Map<number, number>; // k -> accuracy
}

/**
 * Regression metrics
 */
export interface RegressionMetrics extends ModelMetrics {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  r2Score: number; // Coefficient of determination
  mape: number; // Mean Absolute Percentage Error
  residualAnalysis: {
    mean: number;
    stdDev: number;
    percentageWithin10Percent: number;
  };
}

/**
 * Clustering metrics
 */
export interface ClusteringMetrics extends ModelMetrics {
  silhouetteScore: number; // -1 to 1
  daviesBouldinIndex: number; // lower is better
  calinskiHarabaszScore: number; // higher is better
  inertia: number; // within-cluster sum of squares
  separability: number; // 0-1, how well separated clusters are
  clusterSizes: Map<number, number>; // cluster -> size
  clusterCohesion: Map<number, number>; // cluster -> internal cohesion
}

// ============================================================================
// 6. ENSEMBLE AND RECOMMENDATION TYPES
// ============================================================================

/**
 * Combined recommendation from multiple models
 */
export interface MovementRecommendation {
  cowId: string;
  currentLocation: string;
  currentIdleDays: number;
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    action: "move" | "wait" | "monitor";
    suggestedLocations: Array<{
      location: string;
      probability: number;
      confidence: number;
      estimatedStay: number;
    }>;
    reasoning: string;
    confidenceScore: number;
  }>;
  bestAction: {
    location: string;
    estimatedStay: number;
    priority: string;
    explanation: string;
  };
  riskFactors: string[];
  opportunityFactors: string[];
  timestamp: Date;
}

/**
 * COW cluster information
 */
export interface CowCluster {
  id: number;
  name: string;
  cowIds: string[];
  size: number;
  characteristics: {
    avgMovements: number;
    avgIdleDays: number;
    mostCommonPaths: string[];
    regions: string[];
    seasonalPattern: boolean;
  };
  centroid: FeatureVector;
}

/**
 * Batch prediction result
 */
export interface BatchPredictionResult {
  predictions: Array<{
    cowId: string;
    recommendation: MovementRecommendation;
  }>;
  summary: {
    totalCows: number;
    needsImmediateAction: number;
    readyToMove: number;
    canWait: number;
    criticalCows: string[];
  };
  generatedAt: Date;
  modelVersions: {
    nextLocationModel: string;
    optimalStayModel: string;
    clusteringModel: string;
  };
}

// ============================================================================
// 7. CONFIGURATION TYPES
// ============================================================================

/**
 * ML Pipeline configuration
 */
export interface MLPipelineConfig {
  featureEngineering: {
    timeWindowDays: number;
    lookBackPeriodMonths: number;
    minMovementsPerCow: number;
    includeSeasonalFeatures: boolean;
  };
  models: {
    nextLocation: {
      algorithmType: "knn" | "randomForest" | "neuralNetwork" | "ensemble";
      hyperparameters: Record<string, any>;
      trainTestSplit: number;
    };
    optimalStay: {
      algorithmType: "linearRegression" | "randomForest" | "neuralNetwork";
      hyperparameters: Record<string, any>;
      trainTestSplit: number;
    };
    clustering: {
      algorithmType: "kmeans" | "dbscan" | "hierarchical";
      numClusters?: number;
      hyperparameters: Record<string, any>;
    };
  };
  evaluation: {
    crossValidationFolds: number;
    metricsToTrack: string[];
    hyperparameterTuning: boolean;
  };
  inference: {
    batchSize: number;
    confidenceThreshold: number;
    topKPredictions: number;
  };
}

/**
 * Model type enum
 */
export type ModelType =
  | "classification"
  | "regression"
  | "clustering"
  | "ensemble";

/**
 * Data quality report
 */
export interface DataQualityReport {
  totalRecords: number;
  completenessScore: number; // 0-1
  consistencyScore: number; // 0-1
  validityScore: number; // 0-1
  accuracyScore: number; // 0-1
  overallQualityScore: number; // 0-1
  issues: Array<{
    type: string;
    severity: "critical" | "warning" | "info";
    description: string;
    affectedRecords: number;
    recommendation: string;
  }>;
  recommendations: string[];
}
