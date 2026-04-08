'use client';

import { useState, useEffect } from 'react';
import {
  getAdminDashboard, getPendingResults, verifyResult,
  getAllUsers, getAddMoneyRequests, approveAddMoney,
  getWithdrawRequests, approveWithdrawal, getAdminSettings,
  updateAdminSettings, adminCreateMatch, awardBonus, getAllMatches,
  getAllReferrals
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  LayoutDashboard, Swords, Users, Wallet, Settings, CheckSquare,
  Menu, X, Trophy, Gift, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  total_users: number;
  total_matches: number;
  total_revenue: number;
  pending_results: number;
  pending_add_money: number;
  pending_withdrawals: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addMoneyReqs, setAddMoneyReqs] = useState<AddMoneyReq[]>([]);
  const [withdrawReqs, setWithdrawReqs] = useState<WithdrawReq[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const [verifyState, setVerifyState] = useState<Record<number, { kills: string; rank: string; bonus: string }>>({});

  const [newMatch, setNewMatch] = useState({
    title: '', type: 'solo', entry_fee: '', per_kill_reward: '',
    max_players: '', map: 'Bermuda', room_id: '', room_password: '', scheduled_at: '',
  });

  const [bonusData, setBonusData] = useState({ user_id: '', amount: '', match_id: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await getAdminDashboard();
        setStats(res.data);
      } else if (activeTab === 'results') {
        const res = await getPendingResults();
        setPendingResults(res.data.results || []);
      } else if (activeTab === 'users') {
        const res = await getAllUsers();
        setUsers(res.data.users || []);
      } else if (activeTab === 'wallet') {
        const [addRes, withdrawRes] = await Promise.all([
          getAddMoneyRequests(),
          getWithdrawRequests(),
        ]);
        setAddMoneyReqs(addRes.data.requests || []);
        setWithdrawReqs(withdrawRes.data.requests || []);
      } else if (activeTab === 'settings') {
        const res = await getAdminSettings();
        setSettings(res.data.settings || {});
      } else if (activeTab === 'matches') {
        const res = await getAllMatches();
        setMatches(res.data.matches || []);
      } else if (activeTab === 'referrals') {
        const res = await getAllReferrals();
        setReferrals(res.data.referrals || []);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: number, action: 'approve' | 'reject') => {
    const state = verifyState[id] || {};
    try {
      await verifyResult(id, {
        action,
        kills: parseInt(state.kills || '0'),
        rank: parseInt(state.rank || '0'),
        bonus: parseFloat(state.bonus || '0'),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMatch = async () => {
    try {
      await adminCreateMatch({
        ...newMatch,
        entry_fee: parseFloat(newMatch.entry_fee),
        per_kill_reward: parseFloat(newMatch.per_kill_reward),
        max_players: parseInt(newMatch.max_players),
      });
      setNewMatch({ title: '', type: 'solo', entry_fee: '', per_kill_reward: '', max_players: '', map: 'Bermuda', room_id: '', room_password: '', scheduled_at: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAwardBonus = async () => {
    try {
      await awardBonus({
        user_id: parseInt(bonusData.user_id),
        amount: parseFloat(bonusData.amount),
        match_id: bonusData.match_id ? parseInt(bonusData.match_id) : undefined,
        reason: bonusData.reason,
      });
      setBonusData({ user_id: '', amount: '', match_id: '', reason: '' });
      alert('Bonus awarded!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateAdminSettings(settings);
      alert('Settings saved!');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'matches', label: 'Matches', icon: Swords },
    { id: 'results', label: 'Verify Results', icon: CheckSquare, badge: stats?.pending_results },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallet', label: 'Wallet Mgmt', icon: Wallet, badge: (stats?.pending_add_money || 0) + (stats?.pending_withdrawals || 0) },
    { id: 'bonus', label: 'Award Bonus', icon: Trophy },
    { id: 'referrals', label: 'Referrals', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-sm">Admin Panel</h1>
              <p className="text-gray-400 text-xs">BattleZone Arena</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={activeTab === item.id ? 'text-indigo-600' : ''} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200 absolute bottom-0 w-full">
          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
          >
            ← Back to Site
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-gray-900 font-semibold capitalize">{activeTab.replace('_', ' ')}</h2>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Dashboard Stats */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Users', value: stats.total_users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'Total Matches', value: stats.total_matches, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Revenue', value: formatCurrency(stats.total_revenue), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Pending Results', value: stats.pending_results, color: 'text-red-600', bg: 'bg-red-50' },
                      { label: 'Pending Add Money', value: stats.pending_add_money, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Pending Withdrawals', value: stats.pending_withdrawals, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Create Match Form */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-gray-900 font-semibold mb-4">Create New Match</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'title', placeholder: 'Match Title', type: 'text' },
                        { key: 'entry_fee', placeholder: 'Entry Fee (₹)', type: 'number' },
                        { key: 'per_kill_reward', placeholder: 'Per Kill Reward (₹)', type: 'number' },
                        { key: 'max_players', placeholder: 'Max Players', type: 'number' },
                        { key: 'room_id', placeholder: 'Room ID', type: 'text' },
                        { key: 'room_password', placeholder: 'Room Password', type: 'text' },
                      ].map(({ key, placeholder, type }) => (
                        <input
                          key={key}
                          type={type}
                          placeholder={placeholder}
                          value={newMatch[key as keyof typeof newMatch]}
                          onChange={(e) => setNewMatch({ ...newMatch, [key]: e.target.value })}
                          className={inputClass}
                        />
                      ))}
                      <select
                        value={newMatch.type}
                        onChange={(e) => setNewMatch({ ...newMatch, type: e.target.value })}
                        className={inputClass}
                      >
                        {['solo', 'duo', 'squad', 'custom'].map((t) => (
                          <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                      </select>
                      <select
                        value={newMatch.map}
                        onChange={(e) => setNewMatch({ ...newMatch, map: e.target.value })}
                        className={inputClass}
                      >
                        {['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Next Stream'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={newMatch.scheduled_at}
                        onChange={(e) => setNewMatch({ ...newMatch, scheduled_at: new Date(e.target.value).toISOString() })}
                        className={`${inputClass} col-span-1 md:col-span-2`}
                      />
                    </div>
                    <button onClick={handleCreateMatch} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg mt-4 w-full transition-colors">
                      Create Match
                    </button>
                  </div>
                </div>
              )}

              {/* Matches */}
              {activeTab === 'matches' && (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-900 font-semibold">{match.title}</p>
                          <p className="text-gray-500 text-sm">
                            {match.type.toUpperCase()} • {match.map} • {formatCurrency(match.entry_fee)} entry
                          </p>
                          <p className="text-gray-400 text-xs">{formatDate(match.scheduled_at)}</p>
                        </div>
                        <span className={`badge-${match.status === 'live' ? 'live' : match.status === 'upcoming' ? 'upcoming' : 'completed'}`}>
                          {match.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>Room: {match.room_id || 'N/A'}</span>
                        <span>Pass: {match.room_password || 'N/A'}</span>
                        <span>Players: {match.participants?.length || 0}/{match.max_players}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verify Results */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  {pendingResults.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-gray-500">No pending results</p>
                    </div>
                  ) : (
                    pendingResults.map((result) => (
                      <div key={result.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-gray-900 font-semibold">{result.user?.ff_name || result.user?.name}</p>
                            <p className="text-gray-500 text-xs">UID: {result.user?.ff_uid}</p>
                            <p className="text-gray-500 text-xs">Match: {result.match?.title}</p>
                          </div>
                          <p className="text-gray-400 text-xs">{formatDate(result.created_at)}</p>
                        </div>

                        {result.screenshot_url && (
                          <div className="mb-3">
                            <a href={result.screenshot_url} target="_blank" rel="noopener noreferrer">
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-center text-indigo-600 text-sm hover:bg-indigo-100 transition-colors">
                                View Screenshot
                              </div>
                            </a>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { key: 'kills', placeholder: 'Kills' },
                            { key: 'rank', placeholder: 'Rank' },
                            { key: 'bonus', placeholder: 'Bonus (₹)' },
                          ].map(({ key, placeholder }) => (
                            <input
                              key={key}
                              type="number"
                              placeholder={placeholder}
                              value={verifyState[result.id]?.[key as 'kills' | 'rank' | 'bonus'] || ''}
                              onChange={(e) => setVerifyState(prev => ({
                                ...prev,
                                [result.id]: { ...prev[result.id], [key]: e.target.value }
                              }))}
                              className={inputClass}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(result.id, 'approve')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerify(result.id, 'reject')}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                            {user.ff_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{user.ff_name || user.name || 'No Name'}</p>
                            <p className="text-gray-500 text-xs">{user.phone}</p>
                            <p className="text-gray-400 text-xs">UID: {user.ff_uid || 'Not bound'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-600 text-sm font-semibold">{formatCurrency(user.wallet_balance)}</p>
                          {user.is_admin && (
                            <span className="text-indigo-600 text-xs font-medium">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wallet Management */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-3">Add Money Requests</h3>
                    {addMoneyReqs.length === 0 ? (
                      <p className="text-gray-400 text-sm">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {addMoneyReqs.map((req) => (
                          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-900 text-sm font-medium">{req.user?.ff_name || req.user?.phone}</p>
                                <p className="text-emerald-600 font-semibold">{formatCurrency(req.amount)}</p>
                                <p className="text-gray-400 text-xs">{formatDate(req.created_at)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => { await approveAddMoney(req.id, 'approve'); fetchData(); }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => { await approveAddMoney(req.id, 'reject'); fetchData(); }}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-gray-900 font-semibold mb-3">Withdrawal Requests</h3>
                    {withdrawReqs.length === 0 ? (
                      <p className="text-gray-400 text-sm">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {withdrawReqs.map((req) => (
                          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-900 text-sm font-medium">{req.user?.ff_name || req.user?.phone}</p>
                                <p className="text-emerald-600 font-semibold">{formatCurrency(req.amount)}</p>
                                <p className="text-gray-400 text-xs">UPI: {req.upi_id}</p>
                                <p className="text-gray-400 text-xs">{formatDate(req.created_at)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => { await approveWithdrawal(req.id, 'approve'); fetchData(); }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => { await approveWithdrawal(req.id, 'reject'); fetchData(); }}
                                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Award Bonus */}
              {activeTab === 'bonus' && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-md">
                  <h3 className="text-gray-900 font-semibold mb-4">Award Bonus</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'user_id', placeholder: 'User ID', type: 'number' },
                      { key: 'amount', placeholder: 'Bonus Amount (₹)', type: 'number' },
                      { key: 'match_id', placeholder: 'Match ID (optional)', type: 'number' },
                      { key: 'reason', placeholder: 'Reason (e.g. Top Killer)', type: 'text' },
                    ].map(({ key, placeholder, type }) => (
                      <input
                        key={key}
                        type={type}
                        placeholder={placeholder}
                        value={bonusData[key as keyof typeof bonusData]}
                        onChange={(e) => setBonusData({ ...bonusData, [key]: e.target.value })}
                        className={inputClass}
                      />
                    ))}
                    <button onClick={handleAwardBonus} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg w-full transition-colors">
                      Award Bonus
                    </button>
                  </div>
                </div>
              )}

              {/* Referrals */}
              {activeTab === 'referrals' && (
                <div className="space-y-2">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-900 text-sm">
                            <span className="font-medium">{ref.referrer?.ff_name || ref.referrer?.phone}</span>
                            {' → '}
                            <span className="text-gray-600">{ref.referred?.ff_name || ref.referred?.phone}</span>
                          </p>
                          <p className="text-gray-400 text-xs">{formatDate(ref.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-600 font-semibold text-sm">+{formatCurrency(ref.reward_amount)}</p>
                          <p className={`text-xs ${ref.status === 'credited' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {ref.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm max-w-md">
                  <h3 className="text-gray-900 font-semibold mb-4">Platform Settings</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'signup_bonus', label: 'Signup Bonus (₹)' },
                      { key: 'referrer_reward', label: 'Referrer Reward (₹)' },
                      { key: 'new_user_bonus', label: 'New User Bonus (₹)' },
                      { key: 'max_referral_limit', label: 'Max Referral Limit' },
                      { key: 'platform_commission', label: 'Platform Commission (%)' },
                      { key: 'default_per_kill', label: 'Default Per Kill Reward (₹)' },
                      { key: 'min_withdraw_amount', label: 'Min Withdrawal Amount (₹)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-gray-600 text-xs mb-1 block font-medium">{label}</label>
                        <input
                          type="number"
                          value={settings[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    ))}
                    <button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg w-full mt-2 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Type definitions
interface PendingResult {
  id: number;
  user?: { ff_name?: string; name?: string; ff_uid?: string; phone?: string };
  match?: { title?: string };
  screenshot_url?: string;
  created_at: string;
}

interface User {
  id: number;
  phone: string;
  name: string;
  ff_uid: string;
  ff_name: string;
  wallet_balance: number;
  is_admin: boolean;
}

interface AddMoneyReq {
  id: number;
  user?: { ff_name?: string; phone?: string };
  amount: number;
  created_at: string;
}

interface WithdrawReq {
  id: number;
  user?: { ff_name?: string; phone?: string };
  amount: number;
  upi_id: string;
  created_at: string;
}

interface Match {
  id: number;
  title: string;
  type: string;
  entry_fee: number;
  max_players: number;
  map: string;
  status: string;
  room_id: string;
  room_password: string;
  scheduled_at: string;
  participants?: unknown[];
}

interface Referral {
  id: number;
  referrer?: { ff_name?: string; phone?: string };
  referred?: { ff_name?: string; phone?: string };
  reward_amount: number;
  status: string;
  created_at: string;
}
