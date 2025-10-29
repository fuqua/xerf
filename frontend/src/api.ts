export type PredictionPayload = {
  magnitude: number;
  depth: number;
  cdi: number;
  mmi: number;
  sig: number;
};

export type PredictionResponse = {
  probability: number;
  risk_category: "low" | "medium" | "high";
};

type WakeResponse = {
  is_awake: boolean;
};

type ApiError = {
  detail: string;
};

const DEFAULT_BASE_URL = "http://localhost:8000";

export const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (typeof url === "string" && url.trim().length > 0) {
    return url.trim().replace(/\/$/, "");
  }
  return DEFAULT_BASE_URL;
};

export async function predictEarthquakeRisk(
  payload: PredictionPayload
): Promise<PredictionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody?.detail) {
        errorMessage = errorBody.detail;
      }
    } catch {
      // ignore JSON parsing errors and fall back to default message
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as PredictionResponse;
  return data;
}

export async function wakeBackend(): Promise<boolean> {
  const response = await fetch(`${getApiBaseUrl()}/wakeup`);

  if (!response.ok) {
    throw new Error(`Wakeup request failed with status ${response.status}`);
  }

  try {
    const data = (await response.json()) as WakeResponse;
    return Boolean(data?.is_awake);
  } catch {
    throw new Error("Wakeup response could not be parsed.");
  }
}
