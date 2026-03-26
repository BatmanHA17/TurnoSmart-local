import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function DebugEmailButton() {
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSimpleSignup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("Testing simple-signup function...");
      
      const { data, error } = await supabase.functions.invoke('simple-signup', {
        body: {
          email: testEmail,
          password: "test-password-123"
        }
      });

      console.log("Response:", { data, error });
      
      setResult({ 
        type: 'simple-signup',
        data, 
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });

      if (error) {
        toast.error(`Error: ${error.message}`);
      } else if (data?.success) {
        toast.success("Email enviado correctamente!");
      } else {
        toast.error(`Error: ${data?.error || 'Unknown error'}`);
      }

    } catch (err: any) {
      console.error("Test error:", err);
      setResult({ 
        type: 'simple-signup',
        data: null, 
        error: err.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBasicEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("Testing basic email function...");
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          email: testEmail
        }
      });

      console.log("Response:", { data, error });
      
      setResult({ 
        type: 'test-email',
        data, 
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });

      if (error) {
        toast.error(`Error: ${error.message}`);
      } else if (data?.success) {
        toast.success("Email básico enviado correctamente!");
      } else {
        toast.error(`Error: ${data?.error || 'Unknown error'}`);
      }

    } catch (err: any) {
      console.error("Test error:", err);
      setResult({ 
        type: 'test-email',
        data: null, 
        error: err.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testVerificationEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("Testing send-verification-email function...");
      
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: testEmail,
          code: "123456"
        }
      });

      console.log("Response:", { data, error });
      
      setResult({ 
        type: 'verification-email',
        data, 
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });

      if (error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.success("Email de verificación enviado!");
      }

    } catch (err: any) {
      console.error("Test error:", err);
      setResult({ 
        type: 'verification-email',
        data: null, 
        error: err.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Debug Email Functions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Email para pruebas</Label>
          <Input
            id="test-email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={testSimpleSignup}
            disabled={loading || !testEmail}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Test Simple Signup
          </Button>

          <Button 
            onClick={testVerificationEmail}
            disabled={loading || !testEmail}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
          Test Verification Email
          </Button>

          <Button 
            onClick={testBasicEmail}
            disabled={loading || !testEmail}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Test Basic Email (Resend)
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Resultado:</h4>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}