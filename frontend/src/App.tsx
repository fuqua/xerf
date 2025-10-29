import { useCallback, useEffect, useState } from "react";
import Predict from "./Predict";
import Login from "./Login";
import { wakeBackend } from "./api";

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;

function App() {
  const [isAwake, setIsAwake] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const recordApiRequest = useCallback(() => {
    setLastRequestAt(Date.now());
  }, []);

  const markApiAwake = useCallback(() => {
    setIsAwake(true);
    setLastRequestAt(Date.now());
  }, []);

  useEffect(() => {
    if (!isAwake || lastRequestAt === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsAwake(false);
    }, INACTIVITY_LIMIT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isAwake, lastRequestAt]);

  useEffect(() => {
    if (isAwake) {
      setLoginError(null);
    }
  }, [isAwake]);

  const handleLogin = useCallback(async () => {
    setIsWaking(true);
    setLoginError(null);
    recordApiRequest();

    try {
      const awake = await wakeBackend();
      if (awake) {
        markApiAwake();
      } else {
        setLoginError("The API is still waking up. Please try again.");
      }
    } catch {
      setLoginError("Unable to reach the API. Please try again.");
    } finally {
      setIsWaking(false);
    }
  }, [markApiAwake, recordApiRequest]);

  if (isAwake) {
    return (
      <Predict onApiRequest={recordApiRequest} onApiSuccess={markApiAwake} />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      isLoading={isWaking}
      errorMessage={loginError}
    />
  );
}

export default App;
