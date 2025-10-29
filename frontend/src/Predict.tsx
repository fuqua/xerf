import { type FormEvent, type ChangeEvent, useEffect, useState } from "react";
import {
  predictEarthquakeRisk,
  type PredictionPayload,
  type PredictionResponse,
} from "./api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, TrendingUp } from "lucide-react";

export type PredictProps = {
  onApiRequest: () => void;
  onApiSuccess: () => void;
};

type FormState = {
  magnitude: string;
  depth: string;
  cdi: string;
  mmi: string;
  sig: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  magnitude: "",
  depth: "",
  cdi: "",
  mmi: "",
  sig: "",
};

const riskConfig = {
  low: {
    label: "Low Risk",
    headlineColor: "text-emerald-300",
    borderColor: "border-emerald-500/30",
    chipBg: "bg-emerald-500/20",
    chipText: "text-emerald-200",
    meterColor: "bg-emerald-500",
    description: "Stable seismic activity. Continue routine monitoring.",
  },
  medium: {
    label: "Medium Risk",
    headlineColor: "text-amber-300",
    borderColor: "border-amber-500/30",
    chipBg: "bg-amber-500/20",
    chipText: "text-amber-200",
    meterColor: "bg-amber-500",
    description:
      "Elevated activity detected. Review readiness plans and monitor closely.",
  },
  high: {
    label: "High Risk",
    headlineColor: "text-rose-300",
    borderColor: "border-rose-500/30",
    chipBg: "bg-rose-500/20",
    chipText: "text-rose-200",
    meterColor: "bg-rose-500",
    description:
      "High alert. Trigger emergency protocols and contingency measures immediately.",
  },
} as const;

type RiskKey = keyof typeof riskConfig;

const SIGNIFICANCE_USGS_MIN = 0;
const SIGNIFICANCE_USGS_MAX = 1000;
const SIGNIFICANCE_MODEL_MIN = -128;
const SIGNIFICANCE_MODEL_MAX = 127;

const convertSignificanceToModelScale = (value: number) => {
  const normalized =
    (value - SIGNIFICANCE_USGS_MIN) /
    (SIGNIFICANCE_USGS_MAX - SIGNIFICANCE_USGS_MIN);
  return (
    normalized * (SIGNIFICANCE_MODEL_MAX - SIGNIFICANCE_MODEL_MIN) +
    SIGNIFICANCE_MODEL_MIN
  );
};

function Predict({ onApiRequest, onApiSuccess }: PredictProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const helperTexts: Record<keyof FormState, string> = {
    magnitude: "Range: 0-10",
    depth: "Range: 0-700",
    cdi: "Community Decimal Intensity: 0-12",
    mmi: "Modified Mercalli Intensity: 0-12",
    sig: "USGS significance score (0-1000) - Automatically normalized for the model",
  };

  useEffect(() => {
    if (hasSubmitted && result !== null) {
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const validateFieldValue = (
    field: keyof FormState,
    value: string
  ): string | null => {
    const numValue = Number(value);

    if (value === "") {
      return null;
    }

    if (!Number.isFinite(numValue)) {
      return "Invalid value - must be a number";
    }

    switch (field) {
      case "magnitude":
        if (numValue < 0 || numValue > 10) {
          return "Invalid value - must be between 0 and 10";
        }
        break;
      case "depth":
        if (numValue < 0 || numValue > 700) {
          return "Invalid value - must be between 0 and 700";
        }
        break;
      case "cdi":
        if (numValue < 0 || numValue > 12) {
          return "Invalid value - must be between 0 and 12";
        }
        break;
      case "mmi":
        if (numValue < 0 || numValue > 12) {
          return "Invalid value - must be between 0 and 12";
        }
        break;
      case "sig":
        if (
          numValue < SIGNIFICANCE_USGS_MIN ||
          numValue > SIGNIFICANCE_USGS_MAX
        ) {
          return "Invalid value - must be between 0 and 1000";
        }
        break;
    }

    return null;
  };

  const handleChange =
    (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));

      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    };

  const handleBlur = (field: keyof FormState) => () => {
    const value = form[field];
    const errorMessage = validateFieldValue(field, value);

    if (errorMessage) {
      setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
    } else {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const convertedSigDisplay = (() => {
    const value = Number(form.sig);
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value < SIGNIFICANCE_USGS_MIN || value > SIGNIFICANCE_USGS_MAX) {
      return null;
    }
    return convertSignificanceToModelScale(value).toFixed(1);
  })();

  const parsePayload = (): PredictionPayload => {
    const magnitude = Number(form.magnitude);
    const depth = Number(form.depth);
    const cdi = Number(form.cdi);
    const mmi = Number(form.mmi);
    const sig = Number(form.sig);

    if (!Number.isFinite(magnitude) || magnitude < 0 || magnitude > 10) {
      throw new Error("Magnitude must be a number between 0 and 10.");
    }
    if (!Number.isFinite(depth) || depth < 0 || depth > 700) {
      throw new Error("Depth must be a number between 0 and 700 km.");
    }
    if (!Number.isFinite(cdi) || cdi < 0 || cdi > 12) {
      throw new Error("CDI must be a number between 0 and 12.");
    }
    if (!Number.isFinite(mmi) || mmi < 0 || mmi > 12) {
      throw new Error("MMI must be a number between 0 and 12.");
    }
    if (
      !Number.isFinite(sig) ||
      sig < SIGNIFICANCE_USGS_MIN ||
      sig > SIGNIFICANCE_USGS_MAX
    ) {
      throw new Error("Significance must be between 0 and 1000.");
    }
    const sigScaled = convertSignificanceToModelScale(sig);

    return {
      magnitude,
      depth,
      cdi,
      mmi,
      sig: sigScaled,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    let payload: PredictionPayload;
    try {
      payload = parsePayload();
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Invalid input provided."
      );
      return;
    }

    setIsLoading(true);
    setHasSubmitted(true);
    onApiRequest();

    try {
      const response = await predictEarthquakeRisk(payload);
      onApiSuccess();
      setResult(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to reach prediction service."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setForm(emptyForm);
    setError(null);
    setResult(null);
    setHasSubmitted(false);
  };

  const isFormValid =
    form.magnitude && form.depth && form.cdi && form.mmi && form.sig;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-4 ring-1 ring-blue-500/20">
            <TrendingUp className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-3">
            XYZ Earthquake Risk Forecaster
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Enter seismic parameters to predict alert levels using machine
            learning analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-2xl border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Seismic Parameters
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter earthquake data for risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                onReset={handleReset}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="magnitude">Magnitude</Label>
                    <Input
                      id="magnitude"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={form.magnitude}
                      onChange={handleChange("magnitude")}
                      onBlur={handleBlur("magnitude")}
                      placeholder="e.g. 7.0"
                      className={
                        fieldErrors.magnitude
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      required
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors.magnitude
                          ? "text-red-400"
                          : "text-slate-500"
                      }`}
                    >
                      {fieldErrors.magnitude || helperTexts.magnitude}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (km)</Label>
                    <Input
                      id="depth"
                      type="number"
                      step="0.1"
                      min="0"
                      max="700"
                      value={form.depth}
                      onChange={handleChange("depth")}
                      onBlur={handleBlur("depth")}
                      placeholder="e.g. 50"
                      className={
                        fieldErrors.depth
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      required
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors.depth ? "text-red-400" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors.depth || helperTexts.depth}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cdi">CDI</Label>
                    <Input
                      id="cdi"
                      type="number"
                      step="0.1"
                      min="0"
                      max="12"
                      value={form.cdi}
                      onChange={handleChange("cdi")}
                      onBlur={handleBlur("cdi")}
                      placeholder="e.g. 8.0"
                      className={
                        fieldErrors.cdi
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      required
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors.cdi ? "text-red-400" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors.cdi || helperTexts.cdi}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mmi">MMI</Label>
                    <Input
                      id="mmi"
                      type="number"
                      step="0.1"
                      min="0"
                      max="12"
                      value={form.mmi}
                      onChange={handleChange("mmi")}
                      onBlur={handleBlur("mmi")}
                      placeholder="e.g. 6.5"
                      className={
                        fieldErrors.mmi
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      required
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors.mmi ? "text-red-400" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors.mmi || helperTexts.mmi}
                    </p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="sig">Significance</Label>
                    <Input
                      id="sig"
                      type="number"
                      step="1"
                      min={SIGNIFICANCE_USGS_MIN}
                      max={SIGNIFICANCE_USGS_MAX}
                      value={form.sig}
                      onChange={handleChange("sig")}
                      onBlur={handleBlur("sig")}
                      placeholder="e.g. 500"
                      className={
                        fieldErrors.sig
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                      required
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors.sig ? "text-red-400" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors.sig || helperTexts.sig}
                    </p>
                    {convertedSigDisplay !== null && (
                      <p className="text-xs text-slate-400">
                        Model scale significance: {convertedSigDisplay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button type="reset" variant="outline" disabled={isLoading}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={!isFormValid || isLoading}>
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Predicting
                      </span>
                    ) : (
                      "Predict"
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Prediction error</p>
                      <p className="text-sm text-red-100/80">{error}</p>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-slate-800 bg-slate-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Prediction Output
              </CardTitle>
              <CardDescription className="text-slate-400">
                Interpret the model prediction and recommended actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <PredictionResult result={result} />
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400">
                  <TrendingUp className="h-12 w-12 mb-4 text-slate-500" />
                  <p className="text-lg font-semibold text-slate-200">
                    Prediction will appear here
                  </p>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    Submit seismic parameters to view the model's risk
                    classification, probability score, and action guidance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PredictionResult({ result }: { result: PredictionResponse }) {
  const riskKey = result.risk_category as RiskKey;
  const config = riskConfig[riskKey];
  const probabilityPercent = Math.round(result.probability * 1000) / 10;
  const clampedPercent = Math.min(100, Math.max(0, probabilityPercent));
  const meterWidth = `${clampedPercent}%`;
  const markerOffset = `calc(${clampedPercent}% - 6px)`;

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} bg-slate-950/70 p-6 text-slate-100 shadow-inner`}
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p
            className={`text-xs font-semibold tracking-[0.35em] uppercase ${config.headlineColor}`}
          >
            {config.label}
          </p>
          <p className="text-4xl font-bold text-slate-50">
            {probabilityPercent.toFixed(1)}%
          </p>
        </div>
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center text-sm font-semibold uppercase ${config.chipBg} ${config.chipText} ring-2 ring-slate-900/60`}
        >
          {riskKey}
        </div>
      </div>

      <div className="relative mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full ${config.meterColor}`}
            style={{ width: meterWidth }}
          />
        </div>
        <div
          className={`absolute -top-1.5 h-3 w-3 rounded-full border border-slate-950/70 ${config.meterColor}`}
          style={{ left: markerOffset }}
        />
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-300">{config.description}</p>

      <div className="mt-6 grid gap-4 text-sm text-slate-300">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="font-semibold text-slate-100">Operational guidance</p>
          <ul className="mt-3 list-disc list-inside space-y-1 text-slate-400">
            <li>Share the assessment with incident response leads.</li>
            <li>Confirm readiness checklists with affected regions.</li>
            <li>Monitor incoming seismic updates for significant shifts.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="font-semibold text-slate-100">Model transparency</p>
          <p className="mt-2 text-slate-400">
            Probability reflects likelihood of significant impact based on
            magnitude, depth, intensity measures, and significance. Scores
            update automatically with each submission.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Predict;
