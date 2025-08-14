import React, { useState, useEffect } from 'react';
import { 
  Mail, Edit, Save, Eye, Copy, RefreshCw, Plus, Trash2,
  AlertCircle, CheckCircle, Code, Type, Image, Link
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'donation_receipt' | 'campaign_approved' | 'campaign_rejected' | 'welcome' | 'password_reset' | 'campaign_update';
  content: string;
  variables: string[];
  isActive: boolean;
  lastModified: string;
}

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    content: '',
    isActive: true
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Donation Receipt',
        subject: 'Thank you for your donation to {{campaign_title}}',
        type: 'donation_receipt',
        content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Thank You!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your donation makes a real difference</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{donor_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for your generous donation of <strong>€{{donation_amount}}</strong> to support 
      <strong>{{campaign_title}}</strong> organized by {{organizer_name}}.
    </p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Donation Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> €{{donation_amount}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Date:</strong> {{donation_date}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Campaign:</strong> {{campaign_title}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> {{donation_id}}</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your support helps Youth Suicide Prevention Ireland continue our vital work in preventing 
      youth suicide through education, support, and community engagement.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      This email serves as your donation receipt for tax purposes.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{campaign_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Campaign</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      Registered Charity No. CHY 20866<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>`,
        variables: ['donor_name', 'donation_amount', 'campaign_title', 'organizer_name', 'donation_date', 'donation_id', 'campaign_url'],
        isActive: true,
        lastModified: '2025-01-24T10:30:00Z'
      },
      {
        id: '2',
        name: 'Campaign Approved',
        subject: 'Your Coffee Morning campaign has been approved!',
        type: 'campaign_approved',
        content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your campaign is now live</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{organizer_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your Coffee Morning campaign <strong>"{{campaign_title}}"</strong> has been approved 
      and is now live on our platform.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin: 0 0 10px 0;">Campaign Details</h3>
      <p style="margin: 5px 0; color: #374151;"><strong>Title:</strong> {{campaign_title}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Goal:</strong> €{{goal_amount}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Event Date:</strong> {{event_date}}</p>
      <p style="margin: 5px 0; color: #374151;"><strong>Location:</strong> {{event_location}}</p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your campaign is now visible to supporters across Ireland. Start sharing your campaign 
      with friends, family, and your community to maximize your impact.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{campaign_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">View Your Campaign</a>
      <a href="{{share_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Share Campaign</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>`,
        variables: ['organizer_name', 'campaign_title', 'goal_amount', 'event_date', 'event_location', 'campaign_url', 'share_url'],
        isActive: true,
        lastModified: '2025-01-24T09:15:00Z'
      },
      {
        id: '3',
        name: 'Welcome Email',
        subject: 'Welcome to the Coffee Morning Challenge!',
        type: 'welcome',
        content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
    <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Join the Coffee Morning Challenge</p>
  </div>
  
  <div style="padding: 30px; background: white;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear {{user_name}},</p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Welcome to the Youth Suicide Prevention Ireland Coffee Morning Challenge! 
      We're thrilled to have you join our community of changemakers.
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Every coffee morning creates connections that save lives. Whether you're hosting 
      your own event or supporting others, you're making a real difference in the fight 
      against youth suicide.
    </p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #059669; margin: 0 0 15px 0;">Get Started</h3>
      <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
        <li>Browse active coffee morning campaigns</li>
        <li>Support campaigns that resonate with you</li>
        <li>Create your own coffee morning event</li>
        <li>Share campaigns with your network</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{platform_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore Campaigns</a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Youth Suicide Prevention Ireland<br>
      <a href="mailto:admin@yspi.ie" style="color: #059669;">admin@yspi.ie</a> | 1800 828 888
    </p>
  </div>
</div>`,
        variables: ['user_name', 'platform_url'],
        isActive: true,
        lastModified: '2025-01-23T16:20:00Z'
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      isActive: template.isActive
    });
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(prev => prev.map(template =>
        template.id === selectedTemplate.id
          ? {
              ...template,
              name: editForm.name,
              subject: editForm.subject,
              content: editForm.content,
              isActive: editForm.isActive,
              lastModified: new Date().toISOString()
            }
          : template
      ));
      setIsEditing(false);
      
      // Show success toast
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-6 py-3 rounded-lg shadow-lg z-50';
      successToast.innerHTML = '✅ Template saved successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => {
        document.body.removeChild(successToast);
      }, 3000);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
    setIsEditing(false);
  };

  const getPreviewContent = (content: string) => {
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      donor_name: 'John Smith',
      donation_amount: '50.00',
      campaign_title: 'Sarah\'s Coffee Morning for Hope',
      organizer_name: 'Sarah O\'Brien',
      donation_date: new Date().toLocaleDateString(),
      donation_id: 'DON-2025-001',
      campaign_url: '#',
      user_name: 'John Smith',
      platform_url: '#',
      goal_amount: '2,000',
      event_date: '15th March 2025',
      event_location: 'Community Centre, Cork',
      share_url: '#'
    };

    let previewContent = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return previewContent;
  };

  const templateTypes = [
    { value: 'donation_receipt', label: 'Donation Receipt' },
    { value: 'campaign_approved', label: 'Campaign Approved' },
    { value: 'campaign_rejected', label: 'Campaign Rejected' },
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'campaign_update', label: 'Campaign Update' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Email Template Management</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:block hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Email Templates</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{template.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {templateTypes.find(t => t.value === template.type)?.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handlePreview(template)}
                    className="bg-blue-100 text-blue-700 p-1 rounded hover:bg-blue-200 transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="bg-gray-100 text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(template.content)}
                    className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200 transition-colors"
                    title="Copy HTML"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Template Selector */}
        <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value);
              if (template) {
                setSelectedTemplate(template);
                setIsEditing(false);
                setPreviewMode(false);
              }
            }}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.isActive ? 'Active' : 'Inactive'})
              </option>
            ))}
          </select>
          
          {selectedTemplate && (
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handlePreview(selectedTemplate)}
                className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => handleEditTemplate(selectedTemplate)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
        {/* Editor/Preview */}
        <div className="lg:col-span-2">
          {isEditing && selectedTemplate ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Edit: {selectedTemplate.name}</h4>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="border border-gray-300 text-gray-700 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      className="bg-blue-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Template is active
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Use {{variable_name}} for dynamic content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content (HTML)</label>
                  <textarea
                    rows={15}
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="HTML content with {{variable_name}} placeholders"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <Code className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900 mb-2">Available Variables</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable) => (
                          <code key={variable} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {`{{${variable}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : previewMode && selectedTemplate ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Preview: {selectedTemplate.name}</h4>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="border border-gray-300 text-gray-700 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <span className="sm:hidden">Close</span>
                      <span className="hidden sm:inline">Close Preview</span>
                    </button>
                    <button
                      onClick={() => handleEditTemplate(selectedTemplate)}
                      className="bg-blue-600 text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Subject Line:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                    {selectedTemplate.subject.replace(/{{(\w+)}}/g, (match, variable) => {
                      const sampleData: Record<string, string> = {
                        campaign_title: 'Sarah\'s Coffee Morning for Hope',
                        donor_name: 'John Smith',
                        user_name: 'John Smith'
                      };
                      return sampleData[variable] || match;
                    })}
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="bg-white"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent(selectedTemplate.content) }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center h-64 sm:h-96">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h4>
                <p className="text-gray-600 text-sm sm:text-base">Choose a template to edit or preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}