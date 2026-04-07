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
import Image from 'next/image';

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

  // Verify result state
  const [verifyState, setVerifyState] = useState<Record<number, { kills: string; rank: string; bonus: string }>>({});

  // Create match state
  const [newMatch, setNewMatch] = useState({
    title: '', type: 'solo', entry_fee: '', per_kill_reward: '',
    max_players: '', map: 'Bermuda', room_id: '', room_password: '', scheduled_at: '',
  });

  // Bonus award state
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D0D0D] border-r border-[#2a2a2a] transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}>
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h1 className="text-[#FF4500] font-black" style={{ fontFamily: 'Orbitron' }}>ADMIN</h1>
            <p className="text-gray-600 text-xs">BattleZone Arena</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400"
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
                    ? 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/30'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-[#FF4500] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#2a2a2a] absolute bottom-0 w-full">
          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-500 text-sm py-2 hover:text-white"
          >
            ← Back to Site
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-white font-bold capitalize">{activeTab}</h2>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Dashboard Stats */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Users', value: stats.total_users, color: '#FF4500' },
                      { label: 'Total Matches', value: stats.total_matches, color: '#FFD700' },
                      { label: 'Revenue', value: formatCurrency(stats.total_revenue), color: '#64C864' },
                      { label: 'Pending Results', value: stats.pending_results, color: '#FF6B35' },
                      { label: 'Pending Add Money', value: stats.pending_add_money, color: '#9B59B6' },
                      { label: 'Pending Withdrawals', value: stats.pending_withdrawals, color: '#5B9BD5' },
                    ].map((stat) => (
                      <div key={stat.label} className="game-card p-4">
                        <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                        <p className="text-2xl font-black" style={{ color: stat.color }}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Create Match Form */}
                  <div className="game-card p-4">
                    <h3 className="text-white font-bold mb-4">➕ Create New Match</h3>
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
                          className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF4500]"
                        />
                      ))}
                      <select
                        value={newMatch.type}
                        onChange={(e) => setNewMatch({ ...newMatch, type: e.target.value })}
                        className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4500]"
                      >
                        {['solo', 'duo', 'squad', 'custom'].map((t) => (
                          <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                      </select>
                      <select
                        value={newMatch.map}
                        onChange={(e) => setNewMatch({ ...newMatch, map: e.target.value })}
                        className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4500]"
                      >
                        {['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Next Stream'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={newMatch.scheduled_at}
                        onChange={(e) => setNewMatch({ ...newMatch, scheduled_at: new Date(e.target.value).toISOString() })}
                        className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4500] col-span-1 md:col-span-2"
                      />
                    </div>
                    <button onClick={handleCreateMatch} className="btn-primary mt-4 w-full">
                      CREATE MATCH 🎮
                    </button>
                  </div>
                </div>
              )}

              {/* Matches */}
              {activeTab === 'matches' && (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="game-card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-bold">{match.title}</p>
                          <p className="text-gray-500 text-sm">
                            {match.type.toUpperCase()} • {match.map} • {formatCurrency(match.entry_fee)} entry
                          </p>
                          <p className="text-gray-600 text-xs">{formatDate(match.scheduled_at)}</p>
                        </div>
                        <span className={`badge-${match.status === 'live' ? 'live' : match.status === 'upcoming' ? 'upcoming' : 'completed'}`}>
                          {match.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>🏠 {match.room_id || 'No Room ID'}</span>
                        <span>🔑 {match.room_password || 'No Password'}</span>
                        <span>👥 {match.participants?.length || 0}/{match.max_players}</span>
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
                      <CheckSquare size={32} className="mx-auto text-green-400 mb-2" />
                      <p className="text-gray-400">No pending results</p>
                    </div>
                  ) : (
                    pendingResults.map((result) => (
                      <div key={result.id} className="game-card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-bold">{result.user?.ff_name || result.user?.name}</p>
                            <p className="text-gray-500 text-xs">UID: {result.user?.ff_uid}</p>
                            <p className="text-gray-500 text-xs">Match: {result.match?.title}</p>
                          </div>
                          <p className="text-gray-500 text-xs">{formatDate(result.created_at)}</p>
                        </div>

                        {result.screenshot_url && (
                          <div className="mb-3">
                            <a href={result.screenshot_url} target="_blank" rel="noopener noreferrer">
                              <div className="bg-[#0A0A0A] rounded-lg p-2 text-center text-[#FF4500] text-sm hover:underline">
                                📸 View Screenshot
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
                              className="bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF4500]"
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(result.id, 'approve')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-bold transition-colors"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleVerify(result.id, 'reject')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-bold transition-colors"
                          >
                            ❌ Reject
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
                    <div key={user.id} className="game-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FFD700] flex items-center justify-center text-sm font-bold text-white">
                            {user.ff_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-white text-sm font-bold">{user.ff_name || user.name || 'No Name'}</p>
                            <p className="text-gray-500 text-xs">{user.phone}</p>
                            <p className="text-gray-600 text-xs">UID: {user.ff_uid || 'Not bound'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#FFD700] text-sm font-bold">{formatCurrency(user.wallet_balance)}</p>
                          {user.is_admin && (
                            <span className="text-[#FF4500] text-xs">ADMIN</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Wallet Management */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold mb-3">💰 Add Money Requests</h3>
                    {addMoneyReqs.length === 0 ? (
                      <p className="text-gray-500 text-sm">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {addMoneyReqs.map((req) => (
                          <div key={req.id} className="game-card p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white text-sm font-bold">{req.user?.ff_name || req.user?.phone}</p>
                                <p className="text-[#FFD700] font-bold">{formatCurrency(req.amount)}</p>
                                <p className="text-gray-500 text-xs">{formatDate(req.created_at)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => { await approveAddMoney(req.id, 'approve'); fetchData(); }}
                                  className="bg-green-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={async () => { await approveAddMoney(req.id, 'reject'); fetchData(); }}
                                  className="bg-red-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">🏦 Withdrawal Requests</h3>
                    {withdrawReqs.length === 0 ? (
                      <p className="text-gray-500 text-sm">No pending requests</p>
                    ) : (
                      <div className="space-y-2">
                        {withdrawReqs.map((req) => (
                          <div key={req.id} className="game-card p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white text-sm font-bold">{req.user?.ff_name || req.user?.phone}</p>
                                <p className="text-[#FFD700] font-bold">{formatCurrency(req.amount)}</p>
                                <p className="text-gray-500 text-xs">UPI: {req.upi_id}</p>
                                <p className="text-gray-500 text-xs">{formatDate(req.created_at)}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => { await approveWithdrawal(req.id, 'approve'); fetchData(); }}
                                  className="bg-green-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={async () => { await approveWithdrawal(req.id, 'reject'); fetchData(); }}
                                  className="bg-red-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
                                >
                                  ❌ Reject
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
                <div className="game-card p-4 max-w-md">
                  <h3 className="text-white font-bold mb-4">🏆 Award Top Killer Bonus</h3>
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
                        className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FFD700]"
                      />
                    ))}
                    <button onClick={handleAwardBonus} className="btn-primary w-full">
                      🏆 AWARD BONUS
                    </button>
                  </div>
                </div>
              )}

              {/* Referrals */}
              {activeTab === 'referrals' && (
                <div className="space-y-2">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="game-card p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">
                            <span className="text-[#FF4500]">{ref.referrer?.ff_name || ref.referrer?.phone}</span>
                            {' → '}
                            <span className="text-[#FFD700]">{ref.referred?.ff_name || ref.referred?.phone}</span>
                          </p>
                          <p className="text-gray-500 text-xs">{formatDate(ref.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-sm">+{formatCurrency(ref.reward_amount)}</p>
                          <p className={`text-xs ${ref.status === 'credited' ? 'text-green-400' : 'text-[#FFD700]'}`}>
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
                <div className="game-card p-4 max-w-md">
                  <h3 className="text-white font-bold mb-4">⚙️ Platform Settings</h3>
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
                        <label className="text-gray-400 text-xs mb-1 block">{label}</label>
                        <input
                          type="number"
                          value={settings[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF4500]"
                        />
                      </div>
                    ))}
                    <button onClick={handleSaveSettings} className="btn-primary w-full mt-2">
                      💾 SAVE SETTINGS
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
