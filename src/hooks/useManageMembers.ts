import { useState, useEffect } from 'react';
import { INITIAL_MEMBERS } from '../data/mockData';
import type { Member } from '../data/mockData';

export function useManageMembers() {
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('charni_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved members, resetting', e);
      }
    }
    return [...INITIAL_MEMBERS];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    localStorage.setItem('charni_members', JSON.stringify(members));
  }, [members]);

  const addMember = (name: string, role: string) => {
    const newMember: Member = {
      id: Date.now().toString(),
      name,
      role,
      status: 'ACTIVE',
    };
    setMembers((prev) => [...prev, newMember]);
    closeModal();
  };

  const updateMember = (id: string, name: string, role: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name, role } : m))
    );
    closeModal();
  };

  const toggleMemberStatus = (id: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : m
      )
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
