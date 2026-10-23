import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Mail,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  fetchProjectInquiries,
  updateInquiryStatus,
  deleteInquiry,
  SupabaseInquiry,
  SUPABASE_PROJECT_ID,
} from '../../supabaseClient';

export const InquiriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<SupabaseInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_review' | 'contacted' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<SupabaseInquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const items = await fetchProjectInquiries();
      setInquiries(items);
    } catch {
      showToast('error', 'Fetch Error', 'Could not load inquiries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedInquiry?.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const success = await updateInquiryStatus(id, newStatus);
    if (success) {
      showToast('success', 'Status Updated', `Proposal status changed to ${newStatus}`);
    } else {
      showToast('info', 'Status Updated Locally', `Updated locally (sync pending)`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);

    // Optimistic remove
    setInquiries((prev) => prev.filter((item) => item.id !== id));
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(null);
    }

    const success = await deleteInquiry(id);
    if (success) {
      showToast('success', 'Inquiry Deleted', 'The lead was removed from Supabase');
    } else {
      showToast('info', 'Inquiry Removed', 'Removed from local view');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      inq.name.toLowerCase().includes(query) ||
      inq.email.toLowerCase().includes(query) ||
      inq.package_tier.toLowerCase().includes(query) ||
      (inq.store_url && inq.store_url.toLowerCase().includes(query)) ||
      (inq.message && inq.message.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'all' || (inq.status || 'new') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>In Review</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <Mail className="w-3 h-3 text-blue-600" />
            <span>Contacted</span>
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            <span>Closed</span>
          </span>
        );
      case 'new':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>New Lead</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Inbox className="w-3.5 h-3.5" />
            <span>Supabase Cloud Database &bull; inquiries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Real-time capture from website forms and "Let's work together" CTA, stored live in Supabase project <code className="font-mono text-emerald-800 font-bold">{SUPABASE_PROJECT_ID}</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInquiries}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, package tier, or store URL..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'new', 'in_review', 'contacted', 'closed'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* List of Inquiries (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Loading leads from Supabase...
              </p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Inquiries Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No proposals matched your search or status filter.'
                  : 'When visitors fill the "Request a Proposal" form on the public site, entries will appear here in real time.'}
              </p>
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const isSelected = selectedInquiry?.id === inq.id;
              return (
                <div
                  key={inq.id}
                  onClick={() => setSelectedInquiry(inq)}
                  className={`p-5 rounded-2xl bg-white border transition-all duration-150 cursor-pointer text-left space-y-3 ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{inq.name}</h3>
                        {getStatusBadge(inq.status)}
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {inq.email}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                      {inq.package_tier}
                    </span>
                  </div>

                  {inq.store_url && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{inq.store_url}</span>
                    </div>
                  )}

                  {inq.message && (
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl">
                      "{inq.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                    <span>
                      {inq.created_at ? new Date(inq.created_at).toLocaleString() : 'Just now'}
                    </span>
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Lead Detail Panel (Right column) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 sticky top-6">
          {selectedInquiry ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Selected Proposal
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedInquiry.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(selectedInquiry.id || null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete proposal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Update Lead Status
                </label>
                <select
                  value={selectedInquiry.status || 'new'}
                  onChange={(e) =>
                    selectedInquiry.id && handleStatusChange(selectedInquiry.id, e.target.value)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="new">New Lead</option>
                  <option value="in_review">In Review</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed / Handled</option>
                </select>
              </div>

              {/* Package Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Requested Tier
                </span>
                <span className="text-sm font-black text-emerald-800">
                  {selectedInquiry.package_tier}
                </span>
              </div>

              {/* Contact Email & Action */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Client Contact
                </span>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Regarding your JNRX proposal inquiry`}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email {selectedInquiry.name.split(' ')[0]}</span>
                </a>
                <span className="text-xs font-mono text-slate-500 block text-center truncate">
                  {selectedInquiry.email}
                </span>
              </div>

              {/* Store URL */}
              {selectedInquiry.store_url && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Existing Store / URL
                  </span>
                  <a
                    href={
                      selectedInquiry.store_url.startsWith('http')
                        ? selectedInquiry.store_url
                        : `https://${selectedInquiry.store_url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline break-all"
                  >
                    <span>{selectedInquiry.store_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {/* Client Notes / Message */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Project Goals &amp; Notes
                </span>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium leading-relaxed max-h-48 overflow-y-auto">
                  {selectedInquiry.message || 'No additional project notes provided.'}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Select an inquiry</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Click any proposal from the list on the left to view detailed client goals and update lead status.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Proposal Inquiry?"
        message="Are you sure you want to delete this inquiry from your Supabase database? This action cannot be undone."
        confirmLabel="Delete from Supabase"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
