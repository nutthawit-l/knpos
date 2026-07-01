import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManageMembers } from '../hooks/useManageMembers';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { 
  UserPlus, 
  Edit3, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  Info, 
  PawPrint, 
  User, 
  X, 
  Briefcase 
} from 'lucide-react';

export interface ManageMembersProps {
  readonly className?: string;
}

export const ManageMembers: React.FC<ManageMembersProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const {
    members,
    isModalOpen,
    editingMember,
    updateMember,
    toggleMemberStatus,
    deleteMember,
    openEditModal,
    closeModal,
  } = useManageMembers();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Employee');

  const handleOpenAdd = () => {
    navigate('/invite-partners');
  };

  const handleOpenEdit = (member: typeof members[number]) => {
    setName(member.name);
    setRole(member.role);
    openEditModal(member);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingMember) return;

    updateMember(editingMember.id, name, role);
  };

  const rolesList = ['Co-Owner', 'Employee', 'Inventory Specialist'] as const;

  return (
    <div className={`space-y-6 pb-24 ${className}`}>
      {/* Invite Member Action Card */}
      <div className="group">
        <button
          onClick={handleOpenAdd}
          className="w-full h-24 border-2 border-dashed border-outline-warm rounded-3xl flex items-center justify-center gap-3 bg-white hover:bg-brand-pink/15 hover:border-primary-custom transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-brand-pink/30 flex items-center justify-center text-primary-custom">
            <UserPlus className="w-5 h-5 text-primary-custom" />
          </div>
          <span className="font-bold text-[16px] text-primary-custom">Invite partner</span>
        </button>
      </div>

      {/* Bento Grid listing members */}
      <div className="grid grid-cols-1 gap-4">
        {members.map((member) => {
          const isPaused = member.status === 'PAUSED';
          return (
            <div
              key={member.id}
              className={`bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(78,52,46,0.04)] border border-outline-warm/20 hover:border-outline-warm/60 hover:shadow-md transition-all duration-300 flex flex-col gap-4 ${
                isPaused ? 'opacity-75 grayscale-[0.3]' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md bg-pink-container">
                    {member.isMascot ? (
                      <PawPrint className="w-6 h-6 text-primary-custom" />
                    ) : member.avatarUrl ? (
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
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full ${
                      isPaused ? 'bg-gray-400' : 'bg-green-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[16px] text-text-brown leading-tight truncate">
                    {member.name}
                  </h3>
                  <p className="text-[12px] text-surface-variant-custom mt-0.5 font-medium leading-normal flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 opacity-60" />
                    {member.role}
                  </p>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-1 rounded-lg tracking-wider uppercase select-none ${
                    isPaused
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-warm/25">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-2 rounded-full hover:bg-brand-blue/30 text-secondary-custom transition-all duration-150 active:scale-90 cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => toggleMemberStatus(member.id)}
                    className={`p-2 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
                      isPaused
                        ? 'bg-brand-pink/30 text-primary-custom'
                        : 'hover:bg-brand-peach/30 text-tertiary-custom'
                    }`}
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? (
                      <PlayCircle className="w-4.5 h-4.5 fill-current animate-pulse" />
                    ) : (
                      <PauseCircle className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                      deleteMember(member.id);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-red-50 text-destructive transition-all duration-150 active:scale-90 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro Tip Card */}
      <div className="p-5 bg-brand-peach/10 rounded-3xl border border-brand-peach/25 flex items-start gap-3">
        <Info className="w-5 h-5 text-tertiary-custom shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[14px] text-tertiary-custom">Pro Tip</h4>
          <p className="text-[12px] text-surface-variant-custom leading-relaxed mt-1">
            Paused members cannot log in to the POS or process sales until you reactivate their status. Their performance history remains preserved.
          </p>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-outline-warm/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-outline-warm/20">
              <h3 className="font-bold text-[18px] text-text-brown">
                {editingMember ? 'Edit Partner' : 'Invite Partner'}
              </h3>
              <button
                onClick={closeModal}
                className="text-surface-variant-custom hover:text-primary-custom transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                id="name"
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="E.g. John Doe"
                required
                icon={User}
              />

              <FormSelect
                id="role"
                label="Role"
                value={role}
                onChange={setRole}
                options={rolesList}
                icon={Briefcase}
              />

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3.5 px-4 rounded-full border border-outline-warm text-text-brown font-bold text-[14px] hover:bg-slate-50 active:scale-[0.97] transition-all duration-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-full bg-primary-custom text-white font-bold text-[14px] hover:bg-primary-custom/90 active:scale-[0.97] transition-all duration-100 cursor-pointer shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMembers;
