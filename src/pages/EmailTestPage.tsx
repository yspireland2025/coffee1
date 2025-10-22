import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const supabaseUrl = 'https://cdohoaiqioakaksxkdlu.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkb2hvYWlxaW9ha2Frc3hrZGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDY3MjQsImV4cCI6MjA3MDMyMjcyNH0.cJOY3-PgROVH6S3GYU7fI-dQcehsdSL2cQdZCk9mL0w';

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'admin@yspi.ie',
          subject: 'Test Email - SMTP Configuration Check',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">SMTP Test Email</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Email delivery test</p>
              </div>

              <div style="padding: 30px; background: white;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  This is a test email to verify that the SMTP configuration is working correctly.
                </p>

                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                  <h3 style="color: #059669; margin: 0 0 10px 0;">Test Details</h3>
                  <p style="margin: 5px 0; color: #374151;"><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Recipient:</strong> admin@yspi.ie</p>
                  <p style="margin: 5px 0; color: #374151;"><strong>Purpose:</strong> SMTP configuration verification</p>
                </div>

                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                  If you receive this email, your SMTP service is configured correctly and sending emails successfully.
                </p>
              </div>

              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Youth Suicide Prevention Ireland<br>
                  <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
                </p>
              </div>
            </div>
          `,
          templateType: 'test_email',
          templateData: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult({
        success: true,
        message: 'Test email sent successfully! Check admin@yspi.ie inbox.'
      });
      console.log('Email sent:', data);
    } catch (error: any) {
      console.error('Email test failed:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 text-center">
          <div className="bg-white/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Email Test Page
          </h1>
          <p className="text-green-100">
            SMTP Configuration Verification
          </p>
        </div>

        <div className="p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-800 text-sm">
              This will send a test email to <strong>admin@yspi.ie</strong> to verify the SMTP configuration is working correctly.
            </p>
          </div>

          {result && (
            <div className={`border rounded-xl p-4 mb-6 ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={sendTestEmail}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Sending Test Email...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>

          <div className="mt-6 text-sm text-gray-600 space-y-2">
            <p><strong>What this tests:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Edge function connectivity</li>
              <li>SMTP server configuration</li>
              <li>Email delivery pipeline</li>
              <li>Template rendering</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/#admin"
              className="text-green-700 hover:text-green-800 font-medium text-sm"
            >
              Back to Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
