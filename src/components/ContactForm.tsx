import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { emailService } from '../services/emailService';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple captcha verification
    if (!captchaVerified) {
      setError('Please complete the verification');
      setLoading(false);
      return;
    }

    try {
      // Send email to admin
      const adminEmailResult = await emailService.sendContactForm({
        senderName: formData.name,
        senderEmail: formData.email,
        senderMobile: formData.mobile,
        message: formData.message
      });

      if (!adminEmailResult.success) {
        throw new Error(adminEmailResult.error || 'Failed to send message to admin');
      }

      // Send confirmation email to sender
      const confirmationResult = await emailService.sendContactConfirmation({
        senderEmail: formData.email,
        senderName: formData.name,
        message: formData.message
      });

      if (!confirmationResult.success) {
        console.warn('Failed to send confirmation email:', confirmationResult.error);
        // Don't fail the whole process if confirmation email fails
      }

      setSuccess(true);
      setFormData({ name: '', email: '', mobile: '', message: '' });
      setCaptchaVerified(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error sending contact form:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaVerify = () => {
    // Simple math captcha
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = prompt(`Please solve: ${num1} + ${num2} = ?`);
    
    if (answer && parseInt(answer) === num1 + num2) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
      setError('Verification failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600 mb-4">
          Thank you for contacting us. We'll get back to you within 24 hours.
        </p>
        <p className="text-sm text-gray-500">
          You should receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          Full Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#009ca3] focus:border-transparent"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Mail className="inline h-4 w-4 mr-1" />
          Email Address *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#009ca3] focus:border-transparent"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="inline h-4 w-4 mr-1" />
          Mobile Number (Optional)
        </label>
        <input
          type="tel"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#009ca3] focus:border-transparent"
          placeholder="+353 87 123 4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline h-4 w-4 mr-1" />
          Message *
        </label>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#009ca3] focus:border-transparent"
          placeholder="How can we help you with your coffee morning?"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900 font-medium">Verification Required</span>
          </div>
          <button
            type="button"
            onClick={handleCaptchaVerify}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              captchaVerified 
                ? 'bg-green-100 text-green-800 cursor-default' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={captchaVerified}
          >
            {captchaVerified ? '✓ Verified' : 'Verify'}
          </button>
        </div>
        <p className="text-blue-800 text-sm mt-2">
          Click verify to complete a simple math problem
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !captchaVerified}
        className="w-full bg-[#009ca3] text-white px-6 py-4 rounded-xl hover:bg-[#007a7f] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            <span>Send Message</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        By submitting this form, you agree to our privacy policy. 
        We'll respond within 24 hours during business days.
      </p>
    </form>
  );
}