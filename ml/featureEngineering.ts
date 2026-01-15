/**
 * Feature Engineering Module
 * Normalizes, transforms, and enriches features for ML models
 */

import type { FeatureVector, MovementFeatures, CowAggregateFeatures } from "./types";

/**
 * Feature engineering and normalization
 */
export class FeatureEngineer {
  private featureScaleMap: Map<string, { min: number; max: number }> = new Map();
  private featureMeanMap: Map<string, number> = new Map();
  private featureStdMap: Map<string, number> = new Map();

  /**
   * Calculate statistics from features for normalization
   */
  fitScaler(vectors: FeatureVector[]): void {
    const allFeatures = new Map<number, number[]>();

    // Collect all feature values by index
    for (const vector of vectors) {
      for (let i = 0; i < vector.features.length; i++) {
        if (!allFeatures.has(i)) {
          allFeatures.set(i, []);
        }
        allFeatures.get(i)!.push(vector.features[i]);
      }
    }

    // Calculate min/max and mean/std for each feature
    for (const [index, values] of allFeatures) {
      const featureName = vectors[0]?.featureNames[index] || `feature_${index}`;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const std = Math.sqrt(variance);

      this.featureScaleMap.set(featureName, { min, max });
      this.featureMeanMap.set(featureName, mean);
      this.featureStdMap.set(featureName, std);
    }
  }

  /**
   * Normalize features using min-max scaling
   */
  normalizeMinMax(vector: FeatureVector): number[] {
    return vector.features.map((value, index) => {
      const featureName =
        vector.featureNames[index] || `feature_${index}`;
      const scale = this.featureScaleMap.get(featureName);

      if (!scale) return value;

      const { min, max } = scale;
      if (max === min) return 0; // Avoid division by zero
      return (value - min) / (max - min);
    });
  }

  /**
   * Standardize features (z-score normalization)
   */
  standardize(vector: FeatureVector): number[] {
    return vector.features.map((value, index) => {
      const featureName =
        vector.featureNames[index] || `feature_${index}`;
      const mean = this.featureMeanMap.get(featureName) || 0;
      const std = this.featureStdMap.get(featureName) || 1;

      if (std === 0) return 0; // Avoid division by zero
      return (value - mean) / std;
    });
  }

  /**
   * Create comprehensive feature vector from movement
   */
  createMovementFeatureVector(
    movement: MovementFeatures,
    aggregateFeatures: CowAggregateFeatures,
  ): FeatureVector {
    const features: number[] = [];
    const featureNames: string[] = [];

    // 1. Time-based features
    features.push(movement.dayOfWeek);
    featureNames.push("dayOfWeek");

    features.push(movement.monthOfYear);
    featureNames.push("monthOfYear");

    features.push(movement.quarter);
    featureNames.push("quarter");

    // 2. Historical features
    features.push(aggregateFeatures.averageIdleDays);
    featureNames.push("avgHistoricalIdleDays");

    features.push(aggregateFeatures.totalMovements);
    featureNames.push("totalHistoricalMovements");

    features.push(aggregateFeatures.movementFrequencyPerMonth);
    featureNames.push("movementFrequencyPerMonth");

    // 3. Current idle time features
    features.push(movement.idleDays);
    featureNames.push("currentIdleDays");

    features.push(movement.idleDays / (aggregateFeatures.averageIdleDays || 1));
    featureNames.push("idleDaysVsAverage");

    // 4. Location type features
    features.push(movement.isWarehouse ? 1 : 0);
    featureNames.push("isWarehouse");

    // 5. Movement type features
    const movementTypeEncoding: Record<string, number> = {
      "Full": 1,
      "Half": 0.5,
      "Zero": 0,
      "Unknown": 0.25,
    };
    features.push(movementTypeEncoding[movement.movementType] || 0);
    featureNames.push("movementTypeEncoded");

    // 6. Consistency features
    features.push(aggregateFeatures.movementConsistency);
    featureNames.push("movementConsistency");

    features.push(aggregateFeatures.stdDevIdleDays);
    featureNames.push("stdDevIdleDays");

    // 7. Seasonal features
    features.push(aggregateFeatures.hasSeasonalPattern ? 1 : 0);
    featureNames.push("hasSeasonalPattern");

    const isInPeakSeason = aggregateFeatures.peakSeasonMonths.includes(
      movement.monthOfYear,
    )
      ? 1
      : 0;
    features.push(isInPeakSeason);
    featureNames.push("isInPeakSeason");

    // 8. Recency features
    features.push(aggregateFeatures.lastMovementDaysAgo);
    featureNames.push("lastMovementDaysAgo");

    // 9. Location affinity features
    const toLocPreference = aggregateFeatures.favoriteRegions.get(
      movement.region,
    ) || 0;
    features.push(
      toLocPreference / Math.max(aggregateFeatures.totalMovements, 1),
    );
    featureNames.push("regionAffinityScore");

    // 10. Warehouse specialization
    const warehouseSpecialization =
      aggregateFeatures.totalStayDaysWarehouse /
      (aggregateFeatures.totalStayDaysWarehouse +
        aggregateFeatures.totalStayDaysOffsite +
        1);
    features.push(warehouseSpecialization);
    featureNames.push("warehouseSpecialization");

    return {
      cowId: movement.cowId,
      features,
      featureNames,
      normalizedFeatures: [], // Will be filled by normalizer
      timestamp: movement.movedDateTime,
      metadata: {
        currentLocation: movement.toLocation,
        currentIdleDays: movement.idleDays,
        isWarehouseNow: movement.isWarehouse,
      },
    };
  }

  /**
   * Create feature vectors for batch of movements
   */
  createBatchFeatureVectors(
    movements: MovementFeatures[],
    aggregateFeatures: Map<string, CowAggregateFeatures>,
  ): FeatureVector[] {
    return movements
      .map((mov) => {
        const aggFeatures = aggregateFeatures.get(mov.cowId);
        if (!aggFeatures) return null;
        return this.createMovementFeatureVector(mov, aggFeatures);
      })
      .filter((v) => v !== null) as FeatureVector[];
  }

  /**
   * Encode categorical variables for location prediction
   */
  encodeLocationAsTarget(
    location: string,
    uniqueLocations: string[],
  ): number {
    return uniqueLocations.indexOf(location);
  }

  /**
   * Decode location from model output
   */
  decodeLocationFromTarget(
    index: number,
    uniqueLocations: string[],
  ): string {
    return uniqueLocations[index] || "Unknown";
  }

  /**
   * Create time-series features (previous N movements)
   */
  createTimeSeriesFeatures(
    movements: MovementFeatures[],
    aggregateFeatures: CowAggregateFeatures,
    lookbackWindow: number = 5,
  ): FeatureVector {
    const sorted = movements.sort(
      (a, b) =>
        new Date(a.movedDateTime).getTime() -
        new Date(b.movedDateTime).getTime(),
    );

    const recent = sorted.slice(Math.max(0, sorted.length - lookbackWindow));

    const features: number[] = [];
    const featureNames: string[] = [];

    // Add features for each movement in the window
    for (let i = 0; i < lookbackWindow; i++) {
      if (i < recent.length) {
        const mov = recent[i];
        features.push(mov.idleDays);
        featureNames.push(`prev_${i + 1}_idleDays`);
        features.push(mov.isWarehouse ? 1 : 0);
        featureNames.push(`prev_${i + 1}_isWarehouse`);
      } else {
        // Pad with average values
        features.push(aggregateFeatures.averageIdleDays);
        featureNames.push(`prev_${i + 1}_idleDays_padded`);
        features.push(0);
        featureNames.push(`prev_${i + 1}_isWarehouse_padded`);
      }
    }

    return {
      cowId: aggregateFeatures.cowId,
      features,
      featureNames,
      normalizedFeatures: [],
      timestamp: new Date(),
      metadata: {
        currentLocation: aggregateFeatures.mostCommonToLocation,
        currentIdleDays: aggregateFeatures.averageIdleDays,
        isWarehouseNow: true,
      },
    };
  }

  /**
   * Extract interaction features
   */
  createInteractionFeatures(
    movement: MovementFeatures,
    aggregateFeatures: CowAggregateFeatures,
  ): FeatureVector {
    const baseVector = this.createMovementFeatureVector(
      movement,
      aggregateFeatures,
    );

    const features = [...baseVector.features];
    const featureNames = [...baseVector.featureNames];

    // Interaction: idle days * warehouse
    features.push(
      movement.idleDays * (movement.isWarehouse ? 1 : 0),
    );
    featureNames.push("idleDays_x_warehouse");

    // Interaction: day of week * is warehouse
    features.push(
      movement.dayOfWeek * (movement.isWarehouse ? 1 : 0) / 7,
    );
    featureNames.push("dayOfWeek_x_warehouse");

    // Interaction: movement frequency * consistency
    features.push(
      aggregateFeatures.movementFrequencyPerMonth *
        aggregateFeatures.movementConsistency,
    );
    featureNames.push("frequency_x_consistency");

    // Interaction: idle days vs average * recency
    features.push(
      (movement.idleDays / (aggregateFeatures.averageIdleDays || 1)) *
        (1 / (aggregateFeatures.lastMovementDaysAgo + 1)),
    );
    featureNames.push("idleVsAvg_x_recency");

    return {
      ...baseVector,
      features,
      featureNames,
    };
  }

  /**
   * Apply polynomial features
   */
  createPolynomialFeatures(vector: FeatureVector): FeatureVector {
    const features = [...vector.features];
    const featureNames = [...vector.featureNames];

    // Add squared terms for numeric features
    const squaredTerms = vector.features.map((f) => f * f);
    features.push(...squaredTerms);
    featureNames.push(
      ...vector.featureNames.map((name) => `${name}_squared`),
    );

    return {
      ...vector,
      features,
      featureNames,
    };
  }
}

/**
 * Feature scaling utility
 */
export class FeatureScaler {
  private minMaxScales: Map<string, { min: number; max: number }> = new Map();

  /**
   * Learn scaling parameters from data
   */
  fit(vectors: FeatureVector[]): void {
    for (let i = 0; i < (vectors[0]?.features.length || 0); i++) {
      const values = vectors.map((v) => v.features[i]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const featureName = vectors[0]?.featureNames[i] || `feature_${i}`;

      this.minMaxScales.set(featureName, { min, max });
    }
  }

  /**
   * Transform vector using learned scales
   */
  transform(vector: FeatureVector): FeatureVector {
    const normalized = vector.features.map((value, index) => {
      const featureName =
        vector.featureNames[index] || `feature_${index}`;
      const scale = this.minMaxScales.get(featureName);

      if (!scale) return value;
      const { min, max } = scale;
      if (max === min) return 0;
      return (value - min) / (max - min);
    });

    return {
      ...vector,
      normalizedFeatures: normalized,
    };
  }

  /**
   * Inverse transform (denormalize)
   */
  inverseTransform(vector: FeatureVector): number[] {
    return vector.normalizedFeatures.map((value, index) => {
      const featureName =
        vector.featureNames[index] || `feature_${index}`;
      const scale = this.minMaxScales.get(featureName);

      if (!scale) return value;
      const { min, max } = scale;
      return value * (max - min) + min;
    });
  }
}

/**
 * Utility to handle missing values
 */
export class MissingValueHandler {
  /**
   * Fill missing values with mean
   */
  static fillWithMean(vectors: FeatureVector[]): FeatureVector[] {
    const means: number[] = [];

    // Calculate means
    for (let i = 0; i < (vectors[0]?.features.length || 0); i++) {
      const values = vectors
        .map((v) => v.features[i])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));
      means.push(
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0,
      );
    }

    // Fill missing values
    return vectors.map((vector) => ({
      ...vector,
      features: vector.features.map((value, i) =>
        value !== null && value !== undefined && !isNaN(value)
          ? value
          : means[i],
      ),
    }));
  }

  /**
   * Fill missing values with forward fill
   */
  static forwardFill(vectors: FeatureVector[]): FeatureVector[] {
    const filled = [...vectors];

    for (let i = 1; i < filled.length; i++) {
      const current = filled[i];
      const previous = filled[i - 1];

      current.features = current.features.map((value, j) =>
        value !== null && value !== undefined && !isNaN(value)
          ? value
          : previous.features[j],
      );
    }

    return filled;
  }

  /**
   * Remove rows with missing values
   */
  static dropMissing(vectors: FeatureVector[]): FeatureVector[] {
    return vectors.filter((vector) =>
      vector.features.every((f) => f !== null && f !== undefined && !isNaN(f)),
    );
  }
}

/**
 * Outlier detection
 */
export class OutlierDetector {
  /**
   * Detect outliers using IQR method
   */
  static detectByIQR(values: number[], multiplier: number = 1.5): boolean[] {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    return values.map((v) => v < lowerBound || v > upperBound);
  }

  /**
   * Detect outliers using Z-score
   */
  static detectByZScore(values: number[], threshold: number = 3): boolean[] {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length,
    );

    return values.map((v) => Math.abs((v - mean) / (std || 1)) > threshold);
  }
}
