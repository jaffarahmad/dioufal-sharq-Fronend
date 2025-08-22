import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, CheckCircle } from "lucide-react";

export function EmailSettings() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test email");
      }

      return response.json();
    },
    onSuccess: data => {
      toast({
        title: "Test Email Sent",
        description: `Test email sent successfully to ${data.recipient}`,
      });
      setEmailSent(true);

      // Reset the success state after 5 seconds
      setTimeout(() => setEmailSent(false), 5000);
    },
    onError: (error: Error) => {
      toast({
        title: "Email Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    testEmailMutation.mutate();
  };

  return (
    <Card className="border-0 sm:border shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Email Notifications Enabled
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You will receive email notifications for:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• Password changes</li>
              <li>• Email address changes</li>
              <li>• Profile updates</li>
              <li>• Security alerts</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current email address: <strong>{user?.email}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test your email notifications to ensure they're working correctly.
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending}
              className="flex items-center gap-2"
              variant={emailSent ? "secondary" : "default"}
            >
              {emailSent ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Email Sent Successfully
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {testEmailMutation.isPending
                    ? "Sending..."
                    : "Send Test Email"}
                </>
              )}
            </Button>
          </div>

          {emailSent && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Test email sent successfully! Check your inbox at{" "}
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
