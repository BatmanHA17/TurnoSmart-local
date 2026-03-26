import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RLSTestResult {
  test_name: string;
  result: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

export const useRLSVerification = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<RLSTestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = useCallback(async () => {
    if (!user) {
      setTestResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('test_rls_access');

      if (error) {
        console.error("Error running RLS tests:", error);
        setError(error.message);
        setTestResults([]);
      } else {
        setTestResults(data as RLSTestResult[]);
      }
    } catch (err: any) {
      console.error("Unexpected error running RLS tests:", err);
      setError(err.message);
      setTestResults([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      runTests();
    }
  }, [user, runTests]);

  const getPassCount = () => testResults.filter(t => t.result === 'PASS').length;
  const getFailCount = () => testResults.filter(t => t.result === 'FAIL').length;
  const getWarnCount = () => testResults.filter(t => t.result === 'WARN').length;

  return {
    testResults,
    loading,
    error,
    runTests,
    getPassCount,
    getFailCount,
    getWarnCount,
    totalTests: testResults.length,
  };
};