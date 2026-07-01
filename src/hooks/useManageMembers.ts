import { useState, useEffect } from 'react';
import type { Member } from '../data/mockData';

export function useManageMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const addMember = async (_name: string, role: string, email?: string) => {
    if (!email) return;
    try {
      // Map UI role ('Co-Owner' / 'Employee') to DB role ('owner' / 'employee')
      const dbRole = role === 'Co-Owner' ? 'owner' : 'employee';
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: dbRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      alert(`Invitation sent successfully to ${email}!`);
      fetchMembers(); // Refresh from DB
      closeModal();
    } catch (e: any) {
      alert(e.message || 'Failed to send invitation');
    }
  };

  const updateMember = (id: string, name: string, role: string) => {
    // Perform local state update as name/status are not DB-backed columns currently
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name, role } : m))
    );
    closeModal();
  };

  const toggleMemberStatus = (id: string) => {
    // Perform local state update as status is not a DB-backed column currently
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : m
      )
    );
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await fetch(`/api/members?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }
      fetchMembers(); // Refresh from DB
    } catch (e: any) {
      alert(e.message || 'Failed to delete member');
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  return {
    members,
    isModalOpen,
    editingMember,
    isLoading,
    error,
    addMember,
    updateMember,
    toggleMemberStatus,
    deleteMember,
    openAddModal,
    openEditModal,
    closeModal,
  };
}

export type UseManageMembersReturn = ReturnType<typeof useManageMembers>;
