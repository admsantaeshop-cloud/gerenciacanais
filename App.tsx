
import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './components/Dashboard';
import ChannelView from './components/ChannelView';

type View = {
    page: 'dashboard' | 'channel';
    channelId?: string;
}

const App: React.FC = () => {
    const [view, setView] = useState<View>({ page: 'dashboard' });

    const handleSelectChannel = (channelId: string) => {
        setView({ page: 'channel', channelId });
    };

    const handleBackToDashboard = () => {
        setView({ page: 'dashboard' });
    };

    return (
        <div className="bg-background min-h-screen">
            {view.page === 'dashboard' ? (
                <Dashboard onSelectChannel={handleSelectChannel} />
            ) : (
                view.channelId && <ChannelView channelId={view.channelId} onBack={handleBackToDashboard} />
            )}
        </div>
    );
};

const WrappedApp = () => (
    <AppProvider>
        <App />
    </AppProvider>
);

export default WrappedApp;
   