import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { TrendingUp } from "lucide-react";

type LoginProps = {
  onLogin: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
};

function Login({ onLogin, isLoading, errorMessage }: LoginProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-900/70 border-slate-800 shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/30">
            <TrendingUp className="h-6 w-6 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-100">
            XYZ Earthquake Risk Forecaster
          </CardTitle>
          <CardDescription className="text-slate-400">
            Wake the API to start forecasting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-center">
            {isLoading ? (
              <div className="space-y-3">
                <Spinner className="mx-auto text-blue-400" size="lg" />
                <p className="text-sm text-slate-300">
                  The API is restarting, this might take a minute.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Click Login to wake the backend and continue to the predictor.
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-red-400" role="alert">
                {errorMessage}
              </p>
            )}
            <Button
              onClick={onLogin}
              disabled={isLoading}
              className="w-full"
              type="button"
            >
              {isLoading ? "Waking..." : "Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
