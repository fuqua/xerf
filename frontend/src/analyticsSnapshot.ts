export type FeatureImportancePoint = {
  feature: string;
  importance: number;
};

export type CalibrationPoint = {
  predicted_probability: number;
  observed_frequency: number;
};

export type ThresholdMetric = {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
};

export type AnalyticsSnapshot = {
  featureImportance: FeatureImportancePoint[];
  calibrationCurve: CalibrationPoint[];
  thresholdMetrics: ThresholdMetric[];
};

export const ANALYTICS_SNAPSHOT: AnalyticsSnapshot = {
  featureImportance: [
    { feature: "magnitude", importance: 0.0488 },
    { feature: "depth", importance: 0.0559 },
    { feature: "cdi", importance: 0.1634 },
    { feature: "mmi", importance: 0.6511 },
    { feature: "sig", importance: 0.0808 },
  ],
  calibrationCurve: [
    { predicted_probability: 0.0105, observed_frequency: 0 },
    { predicted_probability: 0.1402, observed_frequency: 0 },
    { predicted_probability: 0.2664, observed_frequency: 0.0714 },
    { predicted_probability: 0.3324, observed_frequency: 0 },
    { predicted_probability: 0.4651, observed_frequency: 0.5 },
    { predicted_probability: 0.5364, observed_frequency: 0.6667 },
    { predicted_probability: 0.6561, observed_frequency: 0.75 },
    { predicted_probability: 0.7601, observed_frequency: 0.8889 },
    { predicted_probability: 0.8608, observed_frequency: 0.9667 },
    { predicted_probability: 0.9857, observed_frequency: 0.9918 },
  ],
  thresholdMetrics: [
    { threshold: 0.1, precision: 0.919, recall: 1, f1: 0.958 },
    { threshold: 0.2, precision: 0.957, recall: 1, f1: 0.978 },
    { threshold: 0.3, precision: 0.976, recall: 0.998, f1: 0.987 },
    { threshold: 0.4, precision: 0.983, recall: 0.998, f1: 0.991 },
    { threshold: 0.5, precision: 0.985, recall: 0.997, f1: 0.991 },
    { threshold: 0.6, precision: 0.986, recall: 0.994, f1: 0.99 },
    { threshold: 0.7, precision: 0.989, recall: 0.985, f1: 0.987 },
    { threshold: 0.8, precision: 0.991, recall: 0.972, f1: 0.981 },
    { threshold: 0.9, precision: 0.992, recall: 0.928, f1: 0.959 },
  ],
};
