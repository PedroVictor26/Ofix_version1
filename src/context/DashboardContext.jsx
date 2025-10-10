import { createContext, useContext, useState, useMemo } from 'react';

const DashboardContext = createContext({});

export const DashboardProvider = ({ children }) => {
  const [isNewServiceModalOpen, setNewServiceModalOpen] = useState(false);
  
  // Memoizar actions para evitar re-renders desnecessários
  const actions = useMemo(() => ({
    openNewServiceModal: () => setNewServiceModalOpen(true),
    closeNewServiceModal: () => setNewServiceModalOpen(false),
  }), []);

  const state = useMemo(() => ({
    isNewServiceModalOpen,
  }), [isNewServiceModalOpen]);

  // Memoizar o value do context
  const contextValue = useMemo(() => ({
    ...state,
    ...actions
  }), [state, actions]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};