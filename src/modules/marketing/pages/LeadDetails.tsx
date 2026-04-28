import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Calendar, User, MessageSquare, 
  Plus, History, MoreHorizontal, Edit, Trash2, CheckCircle2, Clock 
} from 'lucide-react';
import { leadService } from '../../../services/leadService';
import type { LeadStatus, FollowUp } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;
      try {
        const data = await leadService.getLead(id);
        if (data) setLead(data);
      } catch (error) {
        console.error("Failed to fetch lead details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleUpdateStatus = async (status: LeadStatus) => {
    if (!lead) return;
    try {
      const updated = await leadService.updateLead(lead.id, { status });
      setLead(updated);
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleAddFollowUp = async () => {
    if (!lead || !newNote.trim()) return;
    const newFollowUp: FollowUp = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      notes: newNote,
      type: 'Note'
    };
    
    try {
      const updated = await leadService.updateLead(lead.id, { 
        followUps: [newFollowUp, ...lead.followUps] 
      });
      setLead(updated);
      setNewNote('');
      setShowFollowUpForm(false);
    } catch (error) {
      console.error("Failed to add follow-up", error);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-gray-500">Lead not found.</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/marketing/leads')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={18} /> Back to Leads
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/marketing/leads/edit/${lead.id}`)}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
          >
            <Edit size={16} /> Edit Lead
          </button>
          <button 
            onClick={() => setShowFollowUpForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add Follow-up
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {lead.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
              <div className="mt-2 italic"><StatusBadge status={lead.status} /></div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="text-gray-400" size={18} />
                <span className="text-gray-600">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-gray-400" size={18} />
                <span className="text-gray-600">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="text-gray-400" size={18} />
                <span>Assigned to: <span className="font-medium text-gray-900">{lead.assignedTo}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="text-gray-400" size={18} />
                <span>Next Follow-up: <span className="font-medium text-blue-600">{lead.nextFollowUpDate || 'Not scheduled'}</span></span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Lead Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <p className="text-sm font-medium text-gray-900">{lead.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <PriorityBadge priority={lead.priority} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {lead.notes || 'No notes available.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="text-blue-600" size={20} />
                Follow-up Timeline
              </h3>
              <button 
                onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                {showFollowUpForm ? 'Cancel' : 'Add Note'}
              </button>
            </div>

            {showFollowUpForm && (
              <div className="mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <textarea 
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                  placeholder="Type follow-up notes here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleAddFollowUp}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all"
                  >
                    Save Follow-up
                  </button>
                </div>
              </div>
            )}

            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
              {lead.followUps?.length > 0 ? lead.followUps.map((item: FollowUp, idx: number) => (
                <div key={item.id} className="relative">
                  <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <MessageSquare size={12} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">{item.date}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase font-bold">{item.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm italic">No interactions recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => handleUpdateStatus('Follow-up')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-yellow-100 bg-yellow-50/50 hover:bg-yellow-50 transition-all group"
              >
                <Clock className="text-yellow-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-yellow-700">Set Follow-up</span>
              </button>
              <button 
                onClick={() => handleUpdateStatus('Converted')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-green-100 bg-green-50/50 hover:bg-green-50 transition-all group"
              >
                <CheckCircle2 className="text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-green-700">Mark Converted</span>
              </button>
              <button 
                onClick={() => handleUpdateStatus('Lost')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-all group"
              >
                <Trash2 className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-red-700">Mark Lost</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100 transition-all group opacity-50 cursor-not-allowed">
                <MoreHorizontal className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500">More</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
