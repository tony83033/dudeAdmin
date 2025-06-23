'use client';

import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Clock, Shield, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Account Deletion Request - Ratna Digital",
  description: "Request to delete your account and personal data from Ratna Digital services",
};

export default function DeleteAccountPage() {
  const handleEmailRequest = () => {
    const subject = encodeURIComponent("Account Deletion Request - Ratna Digital");
    const body = encodeURIComponent(`Dear Ratna Digital Support Team,

I am writing to request the deletion of my account and all associated personal data from your services.

Please include the following information in your request:
- Your full name
- Email address associated with your account
- Phone number (if applicable)
- Reason for account deletion (optional)

We will process your request within 30 days as required by data protection regulations.

Thank you for your patience.

Best regards,
[Your Name]`);

    window.open(`mailto:padmavtimarketing5554@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Account Deletion Request
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We respect your privacy and make it easy to request the deletion of your account and personal data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Your Data Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Under data protection regulations, you have the right to request the deletion of your personal data. 
                  We are committed to honoring these requests promptly and securely.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">What happens when you request deletion:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your account will be permanently deactivated</li>
                    <li>• All personal data will be securely deleted</li>
                    <li>• Order history and preferences will be removed</li>
                    <li>• You will lose access to all services</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">Before you proceed:</h3>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• This action is irreversible</li>
                    <li>• You will lose access to all your data</li>
                    <li>• Any active subscriptions will be cancelled</li>
                    <li>• Consider downloading your data first if needed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Request Account Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  To request account deletion, please send us an email with the required information. 
                  We'll process your request within 30 days.
                </p>
                
                <Button 
                  onClick={handleEmailRequest}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Deletion Request Email
                </Button>
                
                <div className="text-sm text-gray-600 text-center">
                  This will open your email client with a pre-filled message
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Processing Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Email Received</p>
                    <p className="text-sm text-gray-600">Within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Verification</p>
                    <p className="text-sm text-gray-600">1-3 business days</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Data Deletion</p>
                    <p className="text-sm text-gray-600">Within 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-indigo-600" />
                  Alternative Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">
                  If you prefer to contact us directly:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> padmavtimarketing5554@gmail.com</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">About Ratna Digital</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We are committed to protecting your privacy and ensuring you have full control over your personal data. 
              This deletion request process complies with data protection regulations and ensures your rights are respected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 