import { createContext, useContext, useState } from 'react';

const DashboardContext = createContext({});

export const DashboardProvider = ({ children }) => {
  const [isNewServiceModalOpen, setNewServiceModalOpen] = useState(false);
  
  const actions = {
    openNewServiceModal: () => setNewServiceModalOpen(true),
    closeNewServiceModal: () => setNewServiceModalOpen(false),
  };

  const state = {
    isNewServiceModalOpen,
  };

  return (
    <DashboardContext.Provider value={{ ...state, ...actions }}>
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