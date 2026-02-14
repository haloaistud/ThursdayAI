
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    age: '',
    info: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-[#e0e0e0] font-['Inter']">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,204,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,204,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-lg p-8 bg-[#0a0a0a] border border-[#ffcc00]/20 rounded-2xl shadow-[0_0_50px_rgba(255,204,0,0.1)] overflow-hidden">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-[#ffcc00]/10 rounded-full flex items-center justify-center mb-4 border border-[#ffcc00]/30 animate-pulse">
            <span className="text-2xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold tracking-[0.2em] text-[#ffcc00] uppercase mb-2">Identity Verification</h2>
          <p className="text-xs text-white/40 font-mono tracking-widest uppercase">
            Protocol: New User Registration
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2 font-bold">
                Subject Name
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your designation..."
                className="w-full bg-[#111] border border-white/10 rounded-lg p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#ffcc00] focus:shadow-[0_0_15px_rgba(255,204,0,0.2)] transition-all font-mono"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2 font-bold">
                Chronological Age
              </label>
              <input 
                type="number" 
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age in cycles..."
                className="w-full bg-[#111] border border-white/10 rounded-lg p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#ffcc00] focus:shadow-[0_0_15px_rgba(255,204,0,0.2)] transition-all font-mono"
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-[10px] uppercase tracking-widest text-[#ffcc00] mb-2 font-bold">
                Biographical Data / Directives
              </label>
              <textarea 
                name="info"
                value={formData.info}
                onChange={handleChange}
                placeholder="Brief bio, preferences, or specific instructions for the AI..."
                rows={4}
                className="w-full bg-[#111] border border-white/10 rounded-lg p-4 text-white placeholder-white/20 focus:outline-none focus:border-[#ffcc00] focus:shadow-[0_0_15px_rgba(255,204,0,0.2)] transition-all font-mono resize-none"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 border-t border-white/5 pt-6">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${step >= i ? 'bg-[#ffcc00]' : 'bg-white/10'}`}></div>
            ))}
          </div>
          <button 
            onClick={handleNext}
            disabled={
              (step === 1 && !formData.name) || 
              (step === 2 && !formData.age)
            }
            className="px-8 py-3 bg-[#ffcc00] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-[#ffcc00]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 text-sm"
          >
            {step === 3 ? 'Initialize Link' : 'Proceed >'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
