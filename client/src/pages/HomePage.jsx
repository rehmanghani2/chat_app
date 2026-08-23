import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/chatContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext);

  const isUserSelected = !!selectedUser;

  return (
    <div className="w-full h-screen p-1.5 md:p-3 bg-[#0f0c1b] flex items-center justify-center overflow-hidden">
      <div
        className={`backdrop-blur-2xl border border-violet-500/30 rounded-2xl overflow-hidden w-full h-full shadow-2xl grid transition-all duration-300 ${
          isUserSelected
            ? 'grid-cols-1 md:grid-cols-[340px_1fr_280px] xl:grid-cols-[380px_1fr_300px]'
            : 'grid-cols-1 md:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]'
        }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage
