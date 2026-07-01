import React, { useState } from 'react';
import { useManageMembers } from '../hooks/useManageMembers';
import { Send, Star, User, Trash2 } from 'lucide-react';
import teamCollaborationImg from '../assets/team_collaboration.png';

export interface InvitePartnersProps {
  readonly className?: string;
}

export const InvitePartners: React.FC<InvitePartnersProps> = ({
  className = '',
}) => {
  const { members, addMember, deleteMember } = useManageMembers();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Co-Owner' | 'Employee'>('Co-Owner');

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!trimmedEmail.toLowerCase().endsWith('@gmail.com')) {
      alert('Only Gmail addresses (@gmail.com) are supported for invitations.');
      return;
    }

    // Capitalize and format name from email prefix (e.g. sarah.miller -> Sarah Miller)
    const prefix = trimmedEmail.split('@')[0];
    const formattedName = prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    addMember(formattedName, role, trimmedEmail);
    setEmail('');
  };

  return (
    <div className={`space-y-6 pb-28 relative ${className}`}>
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-pink-container rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-brand-blue/40 rounded-full blur-[80px]" />
      </div>

      {/* Mascot/Decorative Header */}
      <div className="flex justify-center mt-2">
        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-pink-container flex items-center justify-center border-4 border-white shadow-md">
          <img
            alt="Team Collaboration"
            className="w-full h-full object-cover opacity-90"
            src={teamCollaborationImg}
          />
        </div>
      </div>

      {/* Description */}
      <div className="px-2 text-center">
        <p className="text-[14px] text-surface-variant-custom leading-relaxed font-medium">
          Add your team members to help manage the shop. Share the workload and
          keep your inventory and sales organized together.
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSendInvitation} className="space-y-5">
        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-[14px] leading-[20px] font-bold text-text-brown pl-4">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full h-14 px-6 bg-slate-50 border-none rounded-full font-medium text-text-brown focus:ring-2 focus:ring-pink-container outline-none transition-shadow shadow-[0_4px_12px_-2px_rgba(78,52,46,0.08)] text-[16px]"
              required
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="text-[14px] leading-[20px] font-bold text-text-brown pl-4">
            Select Role
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Co-Owner Card */}
            <label className="relative cursor-pointer group flex-1">
              <input
                type="radio"
                name="role"
                value="Co-Owner"
                checked={role === 'Co-Owner'}
                onChange={() => setRole('Co-Owner')}
                className="hidden peer"
              />
              <div className="p-4 rounded-[20px] bg-brand-blue/30 border-2 border-transparent peer-checked:border-secondary-custom transition-all shadow-[0_4px_12px_-2px_rgba(78,52,46,0.08)] group-hover:bg-brand-blue/40 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[14px] text-secondary-custom">
                      Co-Owner
                    </span>
                    <Star className="w-5 h-5 text-secondary-custom fill-current" />
                  </div>
                  <p className="text-[11px] leading-normal text-secondary-custom/80 font-medium">
                    Full access to settings, reports, and product management.
                  </p>
                </div>
              </div>
            </label>

            {/* Employee Card */}
            <label className="relative cursor-pointer group flex-1">
              <input
                type="radio"
                name="role"
                value="Employee"
                checked={role === 'Employee'}
                onChange={() => setRole('Employee')}
                className="hidden peer"
              />
              <div className="p-4 rounded-[20px] bg-pink-container border-2 border-transparent peer-checked:border-primary-custom transition-all shadow-[0_4px_12px_-2px_rgba(78,52,46,0.08)] group-hover:bg-pink-container/80 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[14px] text-primary-custom">
                      Employee
                    </span>
                    <User className="w-5 h-5 text-primary-custom" />
                  </div>
                  <p className="text-[11px] leading-normal text-primary-custom/80 font-medium">
                    Restricted access for order entry and sales only.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Bottom Actions Container (Positioned absolutely relative to the MainLayout page container) */}
        <div className="absolute bottom-6 left-0 w-full px-5 z-30 pointer-events-none">
          <button
            type="submit"
            className="w-full h-12 bg-brand-pink text-text-brown font-bold rounded-full shadow-[0_4px_12px_-2px_rgba(78,52,46,0.08)] hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-2 pointer-events-auto cursor-pointer border-none"
          >
            <Send className="w-5 h-5 text-text-brown" />
            <span>SEND INVITATION</span>
          </button>
        </div>
      </form>

      {/* Existing Team List */}
      <section className="space-y-3 mt-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-[12px] uppercase tracking-wider text-text-brown opacity-60">
            Team Members
          </h3>
          <span className="text-[11px] font-bold bg-pink-container text-primary-custom px-3 py-1 rounded-full">
            {members.length} Active
          </span>
        </div>
        <div className="space-y-3">
          {members.map((member) => {
            const memberEmail =
              member.email ||
              `${member.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')}@boutique.com`;
            return (
              <div
                key={member.id}
                className="flex items-center p-4 bg-white rounded-[20px] shadow-[0_4px_12px_-2px_rgba(78,52,46,0.08)] border border-outline-warm/10"
              >
                <div className="w-12 h-12 rounded-full bg-peach-container flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-lg text-primary-custom select-none">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-[14px] text-text-brown truncate">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-surface-variant-custom/75 truncate">
                    {memberEmail}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span
                    className={`text-[12px] font-bold ${
                      member.role === 'Co-Owner'
                        ? 'text-secondary-custom'
                        : 'text-primary-custom'
                    }`}
                  >
                    {member.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to remove ${member.name}?`
                        )
                      ) {
                        deleteMember(member.id);
                      }
                    }}
                    className="mt-1 text-destructive/85 hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default InvitePartners;
