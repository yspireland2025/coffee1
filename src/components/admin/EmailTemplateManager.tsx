import React, { useState, useEffect } from 'react';
import {
  Mail, Edit, Save, Eye, Copy, RefreshCw, Plus, Trash2,
  AlertCircle, CheckCircle, Code, Type, Image, Link
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
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

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedTemplates: EmailTemplate[] = data.map((template: any) => ({
          id: template.id,
          name: template.name,
          subject: template.subject,
          type: template.type,
          content: template.html_content,
          variables: template.variables || [],
          isActive: template.is_active,
          lastModified: template.updated_at
        }));
        setTemplates(formattedTemplates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const showToast = (message: string, isError: boolean = false) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${isError ? 'bg-red-100 border-red-200 text-red-800' : 'bg-green-100 border-green-200 text-green-800'} border px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editForm.name,
          subject: editForm.subject,
          html_content: editForm.content,
          is_active: editForm.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      await loadTemplates();
      setIsEditing(false);
      showToast('Template saved successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      showToast('Failed to save template', true);
    }
  };


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