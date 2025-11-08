
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Channel, Language } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons';

interface DashboardProps {
  onSelectChannel: (channelId: string) => void;
}

const getStatus = (channel: Channel): { color: string; text: string, icon: string } => {
    if (!channel.lastPostDate) return { color: 'bg-danger', text: 'Atrasado', icon: '🔴' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPost = new Date(channel.lastPostDate);
    lastPost.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastPost.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-success', text: 'Adiantado', icon: '🟢' };
    if (diffDays === 0) return { color: 'bg-success', text: 'Adiantado', icon: '🟢' };
    if (diffDays === 1) return { color: 'bg-warning', text: 'Em dia', icon: '🟡' };
    return { color: 'bg-danger', text: 'Atrasado', icon: '🔴' };
}

const ChannelCard: React.FC<{ channel: Channel, onSelect: () => void }> = ({ channel, onSelect }) => {
    const status = getStatus(channel);
    return (
        <div onClick={onSelect} className="bg-surface rounded-lg p-6 cursor-pointer hover:bg-secondary transition-all duration-200 shadow-lg border border-transparent hover:border-primary">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{channel.name}</h3>
                    <p className="text-sm text-text-secondary">{channel.niche}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{status.icon}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${status.color}`}>{status.text}</span>
                </div>
            </div>
        </div>
    );
};

const NewChannelForm: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [niche, setNiche] = useState('');
    const [subNiche, setSubNiche] = useState('');
    const [language, setLanguage] = useState<Language>(Language.PORTUGUESE);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && niche) {
            dispatch({ type: 'ADD_CHANNEL', payload: { name, niche, subNiche, language }});
            onClose();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Canal</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nicho</label>
                <input type="text" value={niche} onChange={e => setNiche(e.target.value)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Sub-nicho</label>
                <input type="text" value={subNiche} onChange={e => setSubNiche(e.target.value)} className="w-full bg-secondary p-2 rounded-md border border-border" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Idioma</label>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary">
                    {Object.values(Language).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors">Criar Canal</button>
        </form>
    )
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectChannel }) => {
  const { state } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Canal">
            <NewChannelForm onClose={() => setIsModalOpen(false)} />
        </Modal>
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary">Meus Canais</h1>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon className="w-5 h-5 mr-2"/>
                Novo Canal
            </button>
        </header>
        <main>
            {state.channels.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-lg">
                    <h2 className="text-2xl font-semibold text-text-primary">Nenhum canal encontrado.</h2>
                    <p className="text-text-secondary mt-2">Clique em "Novo Canal" para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {state.channels.map(channel => (
                        <ChannelCard key={channel.id} channel={channel} onSelect={() => onSelectChannel(channel.id)} />
                    ))}
                </div>
            )}
        </main>
    </div>
  );
};

export default Dashboard;
   