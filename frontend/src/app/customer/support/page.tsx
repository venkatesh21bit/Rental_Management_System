'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supportService, SupportTicket } from '../../../services/supportService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function CustomerSupport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'tickets' | 'faq'>('create');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Load support tickets on component mount
  useEffect(() => {
    if (user && activeTab === 'tickets') {
      loadSupportTickets();
    }
  }, [user, activeTab]);

  const loadSupportTickets = async () => {
    try {
      setTicketsLoading(true);
      const response = await supportService.getTickets();
      
      if (response.success) {
        setTickets(response.data?.results || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load support tickets:', error);
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const faqItems = [
    {
      question: 'How do I place a rental order?',
      answer: 'Browse our product catalog, select the items you need, choose your rental dates, and proceed to checkout. You can pay online or arrange payment upon delivery.'
    },
    {
      question: 'What happens if I damage a rented item?',
      answer: 'Minor wear and tear is expected, but significant damage may result in repair charges. We recommend purchasing our damage protection plan for peace of mind.'
    },
    {
      question: 'Can I extend my rental period?',
      answer: 'Yes, you can extend your rental period subject to availability. Contact us or use the extend option in your order details before the return date.'
    },
    {
      question: 'How do returns work?',
      answer: 'Items can be returned to our location or we can arrange pickup. Please ensure items are clean and in the same condition as received.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, bank transfers, and PayPal. Some orders may require a security deposit.'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Call real API to create support ticket
      const response = await supportService.createTicket({
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
      });

      if (response.success && response.data) {
        toast.success('Support ticket created successfully! We\'ll get back to you soon.');
        setFormData({
          subject: '',
          category: 'GENERAL',
          priority: 'MEDIUM',
          description: '',
        });
        // Add the new ticket to the list if data exists
        if (response.data) {
          setTickets(prev => [response.data!, ...prev]);
        }
        setActiveTab('tickets');
      } else {
        const errorMessage = response.errors ? 
          Object.values(response.errors).flat().join(', ') : 
          'Failed to create support ticket. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Support ticket error:', error);
      toast.error('Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />;
      case 'CLOSED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-2">Customer Support</h1>
              <p className="text-body mt-1">Get help with your orders, account, or any questions</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-1" />
                1-800-RENTALS
              </div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                support@rentals.com
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-padding py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Ticket
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Tickets
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faq'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FAQ
            </button>
          </nav>
        </div>

        {/* Create Ticket Tab */}
        {activeTab === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 input-field"
                    >
                      <option value="GENERAL">General Inquiry</option>
                      <option value="ORDER">Order Issues</option>
                      <option value="BILLING">Billing & Payments</option>
                      <option value="TECHNICAL">Technical Support</option>
                      <option value="DAMAGE">Damage Claims</option>
                      <option value="RETURN">Returns & Extensions</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="mt-1 input-field"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`mt-1 input-field ${errors.subject ? 'input-error' : ''}`}
                    placeholder="Brief description of your issue"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-error-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    className={`mt-1 input-field ${errors.description ? 'input-error' : ''}`}
                    placeholder="Please provide detailed information about your issue..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-600">{errors.description}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* My Tickets Tab */}
        {activeTab === 'tickets' && (
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(ticket.status)}
                            <h3 className="font-medium text-gray-900">#{ticket.id} - {ticket.subject}</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Created: {new Date(ticket.created_at).toLocaleDateString()}</p>
                          <p>Last Updated: {new Date(ticket.last_updated).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No support tickets yet</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveTab('create')}
                      >
                        Create your first ticket
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-primary-500 mr-2" />
                      {item.question}
                    </h3>
                    <p className="text-gray-600 ml-7">{item.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
