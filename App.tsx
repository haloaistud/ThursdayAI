
import React, { useState, useEffect } from 'react';
import FridayAgent from './components/FridayAgent';
import Onboarding from './components/Onboarding';
import HistoryPanel from './components/HistoryPanel';
import Login from './components/Login';
import { UserProfile } from './types';
import { isAuthenticated as checkAuth, logout, getAuthRole } from './services/auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'live' | 'memory'>('live');

  // Check auth and profile on mount
  useEffect(() => {
    const authStatus = checkAuth();
    setIsAuthenticated(authStatus);

    if (authStatus) {
      const savedProfile = localStorage.getItem('friday_user_profile');
      if (savedProfile) {
        try { setUserProfile(JSON.parse(savedProfile)); } 
        catch (e) { console.error("Identity core corruption detected."); }
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const role = getAuthRole();

    if (role === 'guest') {
        // Auto-provision guest profile so they skip onboarding
        const guestProfile: UserProfile = {
            name: 'Guest User',
            age: 'N/A',
            info: 'Limited access session. Data may not persist.'
        };
        setUserProfile(guestProfile);
        // We do NOT save guest profile to localStorage permanently to avoid overwriting real user data
        // or we save it but logout clears it. Logic handles it in services/auth.ts logout.
        localStorage.setItem('friday_user_profile', JSON.stringify(guestProfile));
    } else {
        // Regular user: Check for existing profile
        const savedProfile = localStorage.getItem('friday_user_profile');
        if (savedProfile) {
           try { setUserProfile(JSON.parse(savedProfile)); } catch(e){}
        } else {
           // No profile found, trigger Onboarding
           setUserProfile(null); 
        }
    }
  };

  const handleProfileCreation = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('friday_user_profile', JSON.stringify(profile));
  };

  if (!isAuthenticated) return <Login onLogin={handleLoginSuccess} />;
  
  // If authenticated but no profile (and not guest handled above), show onboarding
  if (!userProfile) return <Onboarding onComplete={handleProfileCreation} />;

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#e0e0e0] overflow-hidden font-sans selection:bg-[#ffcc00]/30 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111] via-[#050505] to-[#000] z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,204,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,204,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50 z-0"></div>

      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-72 bg-[#080808]/40 backdrop-blur-md border-r border-white/5 hidden md:flex flex-col shrink-0 z-20 relative">
        <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5 bg-white/[0.02]">
           <div className="w-10 h-10 bg-gradient-to-br from-[#ffcc00] to-[#997a00] rounded-sm flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(255,204,0,0.2)]">F</div>
           <div className="ml-4 hidden lg:block">
              <span className="block font-black tracking-[0.2em] text-[#ffcc00] text-sm leading-none">FRIDAY</span>
              <span className="block text-[8px] text-white/30 tracking-[0.3em] font-mono mt-1.5">QUANTUM OS</span>
           </div>
        </div>
        
        <nav className="flex-1 py-10 space-y-2 px-3 lg:px-6">
           <NavItem 
                icon="⚡" 
                label="LIVE UPLINK" 
                active={view === 'live'} 
                onClick={() => setView('live')}
           />
           <NavItem 
                icon="💾" 
                label="MEMORY CORE" 
                active={view === 'memory'}
                onClick={() => setView('memory')}
           />
        </nav>
        
        <div className="p-8 border-t border-white/5 hidden lg:block bg-white/[0.01]">
           <div className="text-[9px] text-white/20 uppercase tracking-[0.3em] mb-3 font-bold">System Status</div>
           <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-500 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ALL SYSTEMS NOMINAL
           </div>
           <button onClick={logout} className="mt-4 text-[9px] text-red-500 hover:text-red-400 uppercase tracking-widest font-bold flex items-center gap-2">
              <span>⏻</span> Terminate Session
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-sm z-20">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h1 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#ffcc00] rounded-full"></span>
                    Command Deck // {view === 'live' ? 'Active' : 'Archives'}
                </h1>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                 <div className="text-xs font-bold text-white tracking-widest uppercase">{userProfile.name}</div>
                 <div className="text-[9px] text-[#ffcc00] font-mono tracking-widest uppercase opacity-60">
                    {getAuthRole() === 'guest' ? 'Visitor Clearance' : 'Level 10 Clearance'}
                 </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-lg">
                  👤
              </div>
           </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
           <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 max-w-[1800px] mx-auto h-full">
              
              {/* Primary Interface (Agent or History) */}
              <div className="xl:col-span-3 flex flex-col h-[700px] xl:h-auto animate-in fade-in zoom-in-[0.98] duration-700">
                 {view === 'live' ? (
                     <FridayAgent userProfile={userProfile} />
                 ) : (
                     <HistoryPanel />
                 )}
              </div>

              {/* Right Telemetry Column */}
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-700 delay-100">
                 {/* Stats Card */}
                 <div className="bg-[#0c0c0c]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-[#ffcc00]/20 transition-all backdrop-blur-md">
                    <h3 className="text-[9px] font-bold text-[#ffcc00] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="text-lg">📊</span> Telemetry
                    </h3>
                    <div className="space-y-6 font-mono text-[9px]">
                       <div>
                          <div className="flex justify-between mb-2">
                             <span className="text-white/40">CPU LOAD</span>
                             <span className="text-white">12%</span>
                          </div>
                          <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
                             <div className="bg-white/50 w-[12%] h-full"></div>
                          </div>
                       </div>
                       
                       <div>
                          <div className="flex justify-between mb-2">
                             <span className="text-white/40">MEMORY INTEGRITY</span>
                             <span className="text-[#ffcc00]">100%</span>
                          </div>
                          <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
                             <div className="bg-[#ffcc00] w-[100%] h-full shadow-[0_0_10px_#ffcc00]"></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Protocols Card */}
                 <div className="bg-[#0c0c0c]/60 border border-white/5 rounded-2xl p-6 flex-1 relative backdrop-blur-md">
                    <h3 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mb-6">Protocols</h3>
                    <div className="space-y-3">
                       <ProtocolItem label="VOICE_SYNTH" status="active" />
                       <ProtocolItem label="VISUAL_CORE" status="active" />
                       <ProtocolItem label="RAG_SEARCH" status="standby" />
                       <ProtocolItem label="SENTIMENT" status="active" />
                       <ProtocolItem label="SECURE_KEY" status="active" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center gap-4 px-5 py-3 mx-2 rounded-lg cursor-pointer transition-all duration-300 group border border-transparent ${active ? 'bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
  >
    <span className={`text-lg transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_5px_rgba(255,204,0,0.5)]' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold tracking-[0.2em] hidden lg:block">{label}</span>
    {active && <div className="ml-auto w-1 h-1 bg-[#ffcc00] rounded-full shadow-[0_0_5px_#ffcc00]"></div>}
  </div>
);

const ProtocolItem: React.FC<{ label: string; status: 'active' | 'standby' | 'offline' }> = ({ label, status }) => {
   const color = status === 'active' ? 'bg-emerald-500' : status === 'standby' ? 'bg-amber-500' : 'bg-red-500';
   const text = status === 'active' ? 'text-emerald-500' : status === 'standby' ? 'text-amber-500' : 'text-red-500';
   
   return (
      <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded border border-white/5 hover:border-white/10 transition-colors">
         <span className="text-[9px] text-white/40 font-bold tracking-widest">{label}</span>
         <div className={`flex items-center gap-2 text-[8px] font-bold uppercase ${text}`}>
            <span className={`w-1 h-1 rounded-full ${color} ${status === 'active' ? 'animate-pulse' : ''}`}></span>
            {status}
         </div>
      </div>
   );
};

export default App;
