// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users, Home, Phone, Calendar, ClipboardList,
  Trash2, Edit2, Check, X, Plus, Search, RefreshCw,
  ChevronDown, ChevronUp, Eye, Building2, Loader2,
  UserCheck, UserX, Clock, TrendingUp, Mail,
  ArrowUpRight, MoreVertical, Save
} from 'lucide-react';
import { db } from '@/lib/db';
import { BoardingHouse, RoomType, Lead, Appointment, UserProfile } from '@/lib/supabase';
import Link from 'next/link';

type TabType = 'overview' | 'pending_owners' | 'owners' | 'houses' | 'leads' | 'appointments';

// ── tiny helpers ──
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active:   'bg-emerald-100 text-emerald-700',
    pending:  'bg-amber-100   text-amber-700',
    rejected: 'bg-red-100     text-red-600',
    inactive: 'bg-gray-100    text-gray-500',
  };
  const label: Record<string, string> = {
    active: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Từ chối', inactive: 'Vô hiệu',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[status] ?? status}
    </span>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // ── Data ──
  const [houses,       setHouses]       = useState<BoardingHouse[]>([]);
  const [roomTypes,    setRoomTypes]    = useState<RoomType[]>([]);
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allOwners,    setAllOwners]    = useState<UserProfile[]>([]);

  // ── Owner CRUD ──
  const [showOwnerForm,  setShowOwnerForm]  = useState(false);
  const [editingOwner,   setEditingOwner]   = useState<UserProfile | null>(null);
  const [ownerSearch,    setOwnerSearch]    = useState('');
  const [ownerFilter,    setOwnerFilter]    = useState<'all' | 'active' | 'pending' | 'rejected' | 'inactive'>('all');
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', phone: '', status: 'active' as string });
  const [ownerSaving, setOwnerSaving] = useState(false);

  // ── House search ──
  const [houseSearch, setHouseSearch] = useState('');

  // ── Lead / Appointment ──
  const [leadSearch, setLeadSearch] = useState('');

  // ═══════════════ LOAD DATA ═══════════════
  const loadData = async () => {
    setLoading(true);
    try {
      const [bh, rt, ld, ap, ow] = await Promise.all([
        db.getBoardingHouses(),
        db.getRoomTypes(),
        db.getLeads(),
        db.getAppointments(),
        db.getAllOwners(),
      ]);
      setHouses(bh);
      setRoomTypes(rt);
      setLeads(ld);
      setAppointments(ap);
      setAllOwners(ow);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ═══════════════ OWNER ACTIONS ═══════════════
  const openAddOwner = () => {
    setEditingOwner(null);
    setOwnerForm({ name: '', email: '', phone: '', status: 'active' });
    setShowOwnerForm(true);
  };

  const openEditOwner = (owner: UserProfile) => {
    setEditingOwner(owner);
    setOwnerForm({
      name: owner.name,
      email: owner.email,
      phone: (owner as any).phone || '',
      status: owner.status,
    });
    setShowOwnerForm(true);
  };

  const handleSaveOwner = async () => {
    if (!ownerForm.name || !ownerForm.email) {
      alert('Vui lòng điền tên và email!');
      return;
    }
    setOwnerSaving(true);
    try {
      if (editingOwner) {
        // UPDATE – sync status to Supabase via db layer
        await db.updateOwnerStatus(editingOwner.id, ownerForm.status as any);

        // Also update name/phone in localStorage for display purposes
        const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
        const idx = profiles.findIndex((p: any) => p.id === editingOwner.id);
        if (idx !== -1) {
          profiles[idx] = { ...profiles[idx], ...ownerForm };
          localStorage.setItem('profiles', JSON.stringify(profiles));
        }
      } else {
        // CREATE – admin-created → directly active (bypass pending)
        const newProfile = {
          id: `owner-uuid-admin-${Date.now()}`,
          name: ownerForm.name,
          email: ownerForm.email,
          phone: ownerForm.phone,
          role: 'owner' as const,
          status: (ownerForm.status || 'active') as any,
          created_at: new Date().toISOString(),
        };
        await db.createOwnerProfile(newProfile);
      }
      setShowOwnerForm(false);
      setEditingOwner(null);
      await loadData();
    } catch (e) {
      alert('Có lỗi xảy ra!');
    } finally {
      setOwnerSaving(false);
    }
  };

  const handleDeleteOwner = async (ownerId: string, ownerName: string) => {
    if (!confirm(`Xóa chủ trọ "${ownerName}"? Tất cả nhà trọ của họ sẽ bị xóa theo!`)) return;
    try {
      await db.deleteOwner(ownerId);
      await loadData();
    } catch (e) {
      alert('Có lỗi khi xóa chủ trọ!');
    }
  };

  const handleOwnerStatusChange = async (ownerId: string, status: 'active' | 'pending' | 'rejected' | 'inactive') => {
    await db.updateOwnerStatus(ownerId, status);
    await loadData();
  };

  // ═══════════════ LEAD ACTIONS ═══════════════
  const handleLeadStatus = async (id: number, status: Lead['status']) => {
    await db.updateLeadStatus(id, status);
    await loadData();
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Xóa khách hàng này?')) return;
    await db.deleteLead(id);
    await loadData();
  };

  // ═══════════════ APPOINTMENT ACTIONS ═══════════════
  const handleAppointment = async (id: number, status: Appointment['status'], note?: string) => {
    await db.updateAppointment(id, { status, note });
    await loadData();
  };

  // ═══════════════ HOUSE ACTIONS ═══════════════
  const handleDeleteHouse = async (id: number) => {
    if (!confirm('Xóa nhà trọ này? Toàn bộ loại phòng sẽ bị xóa!')) return;
    await db.deleteBoardingHouse(id);
    await loadData();
  };

  // ═══════════════ COMPUTED ═══════════════
  const pendingCount = allOwners.filter(o => o.status === 'pending').length;
  const activeLeads = leads.filter(l => l.status === 'new' || l.status === 'contacted').length;
  const scheduledApps = appointments.filter(a => a.status === 'scheduled').length;

  const filteredOwners = allOwners
    .filter(o => o.status !== 'pending')
    .filter(o => ownerFilter === 'all' || o.status === ownerFilter)
    .filter(o =>
      o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(ownerSearch.toLowerCase())
    );

  const filteredPendingOwners = allOwners
    .filter(o => o.status === 'pending')
    .filter(o =>
      o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      o.email.toLowerCase().includes(ownerSearch.toLowerCase())
    );

  const filteredHouses = houses.filter(h =>
    h.name.toLowerCase().includes(houseSearch.toLowerCase()) ||
    h.address.toLowerCase().includes(houseSearch.toLowerCase())
  );

  const filteredLeads = leads.filter(l =>
    l.customer_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.customer_phone.includes(leadSearch)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 text-[#0075de] animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
    </div>
  );

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="space-y-8 pb-16">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-black text-gray-900 tracking-tight">Dashboard Quản Trị</h2>
          <p className="text-xs text-gray-400 font-bold mt-1">Quản lý chủ trọ, nhà trọ, khách hàng và lịch hẹn.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="rounded-xl gap-1.5 font-bold text-xs hover:border-gray-900 h-10">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 overflow-x-auto gap-0.5">
        {([
          { key: 'overview',       label: 'Tổng quan' },
          { key: 'pending_owners', label: `Duyệt Chủ Trọ (${allOwners.filter(o => o.status === 'pending').length})`, badge: pendingCount },
          { key: 'owners',         label: `Danh sách Chủ Trọ (${allOwners.filter(o => o.status !== 'pending').length})` },
          { key: 'houses',         label: `Kho Hàng (${houses.length})` },
          { key: 'leads',          label: `Leads (${leads.length})`, badge: activeLeads },
          { key: 'appointments',   label: `Lịch Hẹn (${scheduledApps})` },
        ] as { key: TabType; label: string; badge?: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              // Reset owner status filter to all when changing tabs
              if (t.key === 'owners') {
                setOwnerFilter('all');
              }
            }}
            className={`relative px-6 py-4 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'border-[#0075de] text-[#0075de]'
                : 'border-transparent text-gray-400 hover:text-gray-800'
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: OVERVIEW ══════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-5 h-5"/>, label: 'Chủ Trọ', value: allOwners.filter(o => o.status === 'active').length, sub: `${pendingCount} chờ duyệt — xem ngay`, color: 'text-indigo-600 bg-indigo-50', onClick: () => pendingCount > 0 ? setActiveTab('pending_owners') : setActiveTab('owners') },
              { icon: <Building2 className="w-5 h-5"/>, label: 'Nhà Trọ', value: houses.length, sub: `${roomTypes.length} loại phòng`, color: 'text-blue-600 bg-blue-50', onClick: () => setActiveTab('houses') },
              { icon: <Phone className="w-5 h-5"/>, label: 'Khách Quan Tâm', value: activeLeads, sub: 'Leads đang chăm sóc', color: 'text-rose-600 bg-rose-50', onClick: () => setActiveTab('leads') },
              { icon: <Calendar className="w-5 h-5"/>, label: 'Lịch Hẹn', value: scheduledApps, sub: 'Sắp đi xem phòng', color: 'text-emerald-600 bg-emerald-50', onClick: () => setActiveTab('appointments') },
            ].map((s, i) => (
              <button key={i} onClick={s.onClick}
                className="bg-white rounded-[1.75rem] border border-gray-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{s.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate">{s.sub}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto shrink-0 transition-colors" />
              </button>
            ))}
          </div>

          {/* Pending owners alert */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[1.75rem] p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-800">{pendingCount} chủ trọ đang chờ duyệt tài khoản</p>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">Vào tab "Duyệt Chủ Trọ" để xét duyệt</p>
                </div>
              </div>
              <Button onClick={() => setActiveTab('pending_owners')}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl px-5 h-10 font-black text-xs uppercase tracking-wider shrink-0">
                Xem ngay
              </Button>
            </div>
          )}

          {/* Recent leads + upcoming appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-50">
                <h3 className="font-black text-gray-900">Khách mới nhất</h3>
                <button onClick={() => setActiveTab('leads')} className="text-xs font-bold text-[#0075de] hover:underline">Xem tất cả</button>
              </div>
              <div className="divide-y divide-gray-50">
                {leads.filter(l => l.status === 'new').slice(0, 4).map(lead => {
                  const rt = roomTypes.find(r => r.id === lead.room_type_id);
                  const bh = rt ? houses.find(h => h.id === rt.boarding_house_id) : null;
                  return (
                    <div key={lead.id} className="flex items-center justify-between gap-3 px-8 py-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">{lead.customer_name}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate">{bh?.name} — {rt?.name}</p>
                      </div>
                      <Button onClick={() => handleLeadStatus(lead.id, 'contacted')} size="sm"
                        className="bg-[#0075de] text-white rounded-xl text-[9px] font-black uppercase tracking-wider px-3 h-8 shrink-0">
                        Đã liên hệ
                      </Button>
                    </div>
                  );
                })}
                {leads.filter(l => l.status === 'new').length === 0 && (
                  <div className="px-8 py-10 text-center text-xs font-bold text-gray-300">🎉 Không có khách mới!</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center px-8 py-6 border-b border-gray-50">
                <h3 className="font-black text-gray-900">Lịch hẹn sắp tới</h3>
                <button onClick={() => setActiveTab('appointments')} className="text-xs font-bold text-[#0075de] hover:underline">Xem tất cả</button>
              </div>
              <div className="divide-y divide-gray-50">
                {appointments.filter(a => a.status === 'scheduled').slice(0, 4).map(app => {
                  const lead = leads.find(l => l.id === app.lead_id);
                  return (
                    <div key={app.id} className="flex items-center gap-3 px-8 py-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[#0075de]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">{lead?.customer_name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{new Date(app.appointment_time).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  );
                })}
                {appointments.filter(a => a.status === 'scheduled').length === 0 && (
                  <div className="px-8 py-10 text-center text-xs font-bold text-gray-300">Chưa có lịch hẹn nào.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: OWNERS ══════════════ */}
      {activeTab === 'owners' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Owner Form Modal */}
          {showOwnerForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{editingOwner ? 'Chỉnh sửa' : 'Thêm'} Chủ Trọ</h3>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                      {editingOwner ? `Đang sửa: ${editingOwner.name}` : 'Admin tạo tài khoản — active ngay'}
                    </p>
                  </div>
                  <button onClick={() => setShowOwnerForm(false)} className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Họ và tên *', key: 'name', type: 'text', placeholder: 'Nguyễn Văn A' },
                    { label: 'Email *',      key: 'email', type: 'email', placeholder: 'owner@email.com' },
                    { label: 'Số điện thoại', key: 'phone', type: 'tel', placeholder: '0912345678' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{f.label}</label>
                      <input
                        type={f.type}
                        value={(ownerForm as any)[f.key]}
                        onChange={e => setOwnerForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de]/30 focus:bg-white rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all"
                      />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Trạng thái tài khoản</label>
                    <select
                      value={ownerForm.status}
                      onChange={e => setOwnerForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de]/30 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-900 outline-none cursor-pointer"
                    >
                      <option value="active">✅ Active — Đã duyệt</option>
                      <option value="pending">⏳ Pending — Chờ duyệt</option>
                      <option value="rejected">❌ Rejected — Từ chối</option>
                      <option value="inactive">⛔ Inactive — Vô hiệu</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowOwnerForm(false)}
                    className="flex-1 rounded-2xl h-12 font-bold text-sm">Hủy</Button>
                  <Button onClick={handleSaveOwner} disabled={ownerSaving}
                    className="flex-1 bg-[#0075de] hover:bg-[#0075de]/90 text-white rounded-2xl h-12 font-black text-sm shadow-lg shadow-[#0075de]/20">
                    {ownerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" />Lưu</>}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Quản lý Chủ Trọ</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                {allOwners.filter(o=>o.status==='active').length} active &nbsp;·&nbsp;
                {allOwners.filter(o=>o.status==='rejected').length} từ chối &nbsp;·&nbsp;
                {allOwners.filter(o=>o.status==='inactive').length} vô hiệu
              </p>
            </div>
            <Button onClick={openAddOwner}
              className="bg-[#0075de] hover:bg-[#0075de]/90 text-white rounded-2xl px-6 h-11 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0075de]/20 gap-2">
              <Plus className="w-4 h-4" /> Thêm chủ trọ
            </Button>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-medium text-gray-900 focus:border-[#0075de]/20 transition-all shadow-sm" />
            </div>
            <div className="flex gap-1.5">
              {(['all','active','rejected','inactive'] as const).map(f => (
                <button key={f} onClick={() => setOwnerFilter(f)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    ownerFilter === f ? 'bg-[#0075de] text-white shadow-md shadow-[#0075de]/20' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-300'
                  }`}>
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Active' : f === 'rejected' ? 'Từ chối' : 'Vô hiệu'}
                </button>
              ))}
            </div>
          </div>

          {/* Owner List */}
          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
            {filteredOwners.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Không tìm thấy chủ trọ nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredOwners.map(owner => {
                  const ownerHouses = houses.filter(h => h.owner_id === owner.id);
                  const ownerRooms  = roomTypes.filter(rt => ownerHouses.map(h => h.id).includes(rt.boarding_house_id));
                  return (
                    <div key={owner.id} className="flex items-center gap-5 px-8 py-5 hover:bg-gray-50/60 transition-colors group">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                        owner.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        owner.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {owner.name?.charAt(0)?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900 text-sm">{owner.name}</span>
                          <StatusBadge status={owner.status} />
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 flex-wrap">
                          <span>📧 {owner.email}</span>
                          {(owner as any).phone && <span>📞 {(owner as any).phone}</span>}
                          <span className="text-[#0075de]">🏠 {ownerHouses.length} nhà trọ</span>
                          <span className="text-indigo-500">🛏 {ownerRooms.length} loại phòng</span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-bold">
                          Đăng ký: {new Date(owner.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex gap-1.5 shrink-0">
                        {ownerHouses.length > 0 && (
                          <Link href={`/rooms?owner=${owner.id}`}
                            className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0075de] flex items-center justify-center transition-colors"
                            title="Xem nhà trọ">
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <button onClick={() => openEditOwner(owner)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                          title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteOwner(owner.id, owner.name)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                          title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: PENDING OWNERS ══════════════ */}
      {activeTab === 'pending_owners' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Duyệt Đăng Ký Chủ Trọ</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Có {pendingCount} tài khoản chủ trọ đang chờ duyệt tham gia hệ thống.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email chờ duyệt..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-medium text-gray-900 focus:border-[#0075de]/20 transition-all shadow-sm" />
          </div>

          {/* Pending Owner List */}
          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
            {filteredPendingOwners.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Không có yêu cầu duyệt nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredPendingOwners.map(owner => {
                  const ownerHouses = houses.filter(h => h.owner_id === owner.id);
                  const ownerRooms  = roomTypes.filter(rt => ownerHouses.map(h => h.id).includes(rt.boarding_house_id));
                  return (
                    <div key={owner.id} className="flex items-center gap-5 px-8 py-5 hover:bg-gray-50/60 transition-colors group">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 bg-amber-100 text-amber-700">
                        {owner.name?.charAt(0)?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900 text-sm">{owner.name}</span>
                          <StatusBadge status={owner.status} />
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 flex-wrap">
                          <span>📧 {owner.email}</span>
                          {(owner as any).phone && <span>📞 {(owner as any).phone}</span>}
                          <span className="text-[#0075de]">🏠 {ownerHouses.length} nhà trọ</span>
                          <span className="text-indigo-500">🛏 {ownerRooms.length} loại phòng</span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-bold">
                          Đăng ký: {new Date(owner.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>

                      {/* Quick status change for pending */}
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleOwnerStatusChange(owner.id, 'active')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95">
                          <Check className="w-3.5 h-3.5" /> Duyệt
                        </button>
                        <button onClick={() => handleOwnerStatusChange(owner.id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95">
                          <X className="w-3.5 h-3.5" /> Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: HOUSES ══════════════ */}
      {activeTab === 'houses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Kho Hàng Nhà Trọ</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">{houses.length} tòa nhà · {roomTypes.length} loại phòng</p>
            </div>
            <Button asChild className="bg-[#0075de] hover:bg-[#0075de]/90 text-white rounded-2xl px-6 h-11 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0075de]/20 gap-2">
              <Link href="/owner"><Plus className="w-4 h-4" /> Thêm nhà trọ mới</Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={houseSearch} onChange={e => setHouseSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc địa chỉ..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-medium text-gray-900 focus:border-[#0075de]/20 transition-all shadow-sm" />
          </div>

          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
            {filteredHouses.length === 0 ? (
              <div className="py-20 text-center">
                <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Không có nhà trọ nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/60 border-b border-gray-50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Tên tòa nhà</th>
                      <th className="px-8 py-4">Chủ sở hữu</th>
                      <th className="px-8 py-4">Địa chỉ</th>
                      <th className="px-8 py-4">Loại phòng</th>
                      <th className="px-8 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredHouses.map(house => {
                      const owner = allOwners.find(o => o.id === house.owner_id);
                      const rts = roomTypes.filter(rt => rt.boarding_house_id === house.id);
                      return (
                        <tr key={house.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <span className="font-black text-gray-900 text-sm block">{house.name}</span>
                            <span className="text-[9px] font-bold text-gray-300 uppercase bg-gray-50 px-2 py-0.5 rounded mt-1 inline-block">#{house.id}</span>
                          </td>
                          <td className="px-8 py-5">
                            {owner ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                                  {owner.name?.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{owner.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">—</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-gray-500 max-w-[200px] truncate">{house.address}</td>
                          <td className="px-8 py-5">
                            <span className="font-black text-indigo-600 text-sm">{rts.length}</span>
                            <span className="text-[10px] text-gray-400 font-bold ml-1">loại phòng</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="outline" size="sm"
                                className="rounded-xl text-[10px] font-black px-3 h-8 border-gray-100 text-[#0075de] hover:bg-blue-50">
                                <Link href={`/rooms?house=${house.id}`}><Eye className="w-3.5 h-3.5 mr-1" />Xem</Link>
                              </Button>
                              <button onClick={() => handleDeleteHouse(house.id)}
                                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: LEADS ══════════════ */}
      {activeTab === 'leads' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Quản lý Leads</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">{leads.length} khách hàng · {activeLeads} đang chăm sóc</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc số điện thoại..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-medium text-gray-900 focus:border-[#0075de]/20 transition-all shadow-sm" />
          </div>

          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
            {filteredLeads.length === 0 ? (
              <div className="py-20 text-center">
                <Phone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Chưa có khách hàng nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/60 border-b border-gray-50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Khách hàng</th>
                      <th className="px-8 py-4">SĐT</th>
                      <th className="px-8 py-4">Phòng quan tâm</th>
                      <th className="px-8 py-4">Lời nhắn</th>
                      <th className="px-8 py-4">Trạng thái</th>
                      <th className="px-8 py-4 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLeads.map(lead => {
                      const rt = roomTypes.find(r => r.id === lead.room_type_id);
                      const bh = rt ? houses.find(h => h.id === rt.boarding_house_id) : null;
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <span className="font-black text-gray-900 text-sm block">{lead.customer_name}</span>
                            <span className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString('vi-VN')}</span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-600">{lead.customer_phone}</td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-black text-[#0075de] block">{bh?.name}</span>
                            <span className="text-[10px] text-gray-500 font-bold">{rt?.name}</span>
                          </td>
                          <td className="px-8 py-5 text-xs font-medium text-gray-500 max-w-[180px] truncate">
                            {lead.message || '—'}
                          </td>
                          <td className="px-8 py-5">
                            <select value={lead.status} onChange={e => handleLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className={`text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 border-none outline-none cursor-pointer ${
                                lead.status === 'new' ? 'bg-red-50 text-red-500' :
                                lead.status === 'contacted' ? 'bg-amber-50 text-amber-600' :
                                lead.status === 'won' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-gray-50 text-gray-400'
                              }`}>
                              <option value="new">● Mới</option>
                              <option value="contacted">● Đã liên hệ</option>
                              <option value="won">● Chốt thành công</option>
                              <option value="lost">● Thất bại</option>
                            </select>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => handleDeleteLead(lead.id)}
                              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center ml-auto transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TAB: APPOINTMENTS ══════════════ */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-black text-gray-900">Quản lý Lịch Hẹn</h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">{appointments.length} lịch hẹn · {scheduledApps} đang hẹn</p>
          </div>

          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
            {appointments.length === 0 ? (
              <div className="py-20 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Chưa có lịch hẹn nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/60 border-b border-gray-50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Thời gian</th>
                      <th className="px-8 py-4">Khách hàng</th>
                      <th className="px-8 py-4">Phòng xem</th>
                      <th className="px-8 py-4">Ghi chú</th>
                      <th className="px-8 py-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {appointments.map(app => {
                      const lead = leads.find(l => l.id === app.lead_id);
                      const rt = lead ? roomTypes.find(r => r.id === lead.room_type_id) : null;
                      const bh = rt ? houses.find(h => h.id === rt.boarding_house_id) : null;
                      return (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#0075de] shrink-0" />
                              <span className="text-xs font-black text-gray-900">{new Date(app.appointment_time).toLocaleString('vi-VN')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-sm font-black text-gray-900 block">{lead?.customer_name}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lead?.customer_phone}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs font-black text-[#0075de] block">{bh?.name}</span>
                            <span className="text-[10px] text-gray-500 font-bold">{rt?.name}</span>
                          </td>
                          <td className="px-8 py-5">
                            <input type="text" defaultValue={app.note || ''}
                              placeholder="Ghi chú..."
                              onBlur={e => handleAppointment(app.id, app.status, e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#0075de]/20 min-w-[160px]" />
                          </td>
                          <td className="px-8 py-5">
                            <select value={app.status} onChange={e => handleAppointment(app.id, e.target.value as Appointment['status'], app.note)}
                              className={`text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1.5 border-none outline-none cursor-pointer ${
                                app.status === 'scheduled'  ? 'bg-blue-50 text-blue-600' :
                                app.status === 'completed'  ? 'bg-emerald-50 text-emerald-600' :
                                'bg-red-50 text-red-400'
                              }`}>
                              <option value="scheduled">● Đang hẹn</option>
                              <option value="completed">● Đã xem xong</option>
                              <option value="cancelled">● Đã hủy</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
