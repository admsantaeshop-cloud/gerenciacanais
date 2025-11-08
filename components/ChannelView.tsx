
import React, { useState, useMemo, ChangeEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { Channel, Language, NarrationStyle, VoiceGender, VideoEditor, TitleStatus, ProjectStatus, VideoTitle, Project, FileData } from '../types';
import { PlusIcon, TrashIcon, DownloadIcon, FileIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon } from './icons';
import Modal from './Modal';

interface ChannelViewProps {
  channelId: string;
  onBack: () => void;
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-surface rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">{title}</h3>
        {children}
    </div>
);

const FileBrowser: React.FC<{ channel: Channel, project: Project }> = ({ channel, project }) => {
    const { dispatch } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setIsLoading(true);
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                dispatch({
                    type: 'UPLOAD_FILE',
                    payload: {
                        channelId: channel.id,
                        projectId: project.id,
                        file: {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified,
                            content: event.target?.result as string,
                        },
                    },
                });
                setIsLoading(false);
            };
            reader.onerror = () => {
                setIsLoading(false);
                alert('Erro ao ler o arquivo.');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDownload = (file: FileData) => {
        const link = document.createElement('a');
        link.href = file.content;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleDeleteFile = (fileId: string) => {
        if(window.confirm("Tem certeza que deseja deletar este arquivo?")) {
            dispatch({ type: 'DELETE_FILE', payload: { channelId: channel.id, projectId: project.id, fileId }});
        }
    }

    return (
        <div>
            <label className="flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary-hover transition-colors">
                <PlusIcon className="w-5 h-5 mr-2" />
                {isLoading ? "Carregando..." : "Fazer Upload de Arquivo"}
                <input type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} />
            </label>
            <div className="mt-4 space-y-2">
                {project.files.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                            <FileIcon className="w-5 h-5 text-text-secondary" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-text-secondary">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => handleDownload(file)} className="text-text-secondary hover:text-primary"><DownloadIcon /></button>
                             <button onClick={() => handleDeleteFile(file.id)} className="text-text-secondary hover:text-danger"><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const ProjectItem: React.FC<{ channel: Channel; project: Project }> = ({ channel, project }) => {
    const [isOpen, setIsOpen] = useState(false);
    const projectTitle = channel.titles.find(t => t.id === project.titleId)?.text || 'Título não encontrado';

    return (
        <div className="bg-secondary rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center space-x-3">
                    {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    <FolderIcon className="text-primary"/>
                    <div>
                        <p className="font-semibold">{project.name} - <span className="text-text-secondary font-normal">{projectTitle}</span></p>
                        <p className="text-sm text-text-secondary">{project.status}</p>
                    </div>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border">
                    <FileBrowser channel={channel} project={project} />
                </div>
            )}
        </div>
    );
};


const ChannelView: React.FC<ChannelViewProps> = ({ channelId, onBack }) => {
  const { state, dispatch } = useAppContext();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [titlesToAdd, setTitlesToAdd] = useState('');
  
  const channel = useMemo(() => state.channels.find(c => c.id === channelId), [state.channels, channelId]);
  
  const [localChannel, setLocalChannel] = useState<Channel | null>(channel ? JSON.parse(JSON.stringify(channel)) : null);

  if (!channel || !localChannel) {
    return <div>Canal não encontrado.</div>;
  }
  
  const handleSave = () => {
      if(localChannel) {
          dispatch({ type: 'UPDATE_CHANNEL', payload: localChannel });
          alert('Canal salvo com sucesso!');
      }
  }

  const handleInputChange = (section: keyof Channel['settings'], field: string, value: any) => {
    setLocalChannel(prev => {
        if (!prev) return null;
        const newSettings = { ...prev.settings };
        (newSettings[section] as any)[field] = value;
        return { ...prev, settings: newSettings };
    });
  };

  const handleGeneralInfoChange = (field: keyof Channel, value: any) => {
      setLocalChannel(prev => prev ? { ...prev, [field]: value } : null);
  }

  const handleAddLink = () => {
      setLocalChannel(prev => prev ? {...prev, usefulLinks: [...prev.usefulLinks, {id: crypto.randomUUID(), url: ''}]} : null);
  }

  const handleLinkChange = (id: string, value: string) => {
      setLocalChannel(prev => prev ? {
          ...prev, 
          usefulLinks: prev.usefulLinks.map(link => link.id === id ? {...link, url: value} : link)
        } : null);
  }

  const handleRemoveLink = (id: string) => {
      setLocalChannel(prev => prev ? {
          ...prev,
          usefulLinks: prev.usefulLinks.filter(link => link.id !== id)
      } : null);
  }

  const handleAddTitles = () => {
    const titlesArray = titlesToAdd.split('\n').filter(t => t.trim() !== '');
    if (titlesArray.length > 0) {
        dispatch({ type: 'ADD_TITLES', payload: { channelId: channel.id, titles: titlesArray } });
        setTitlesToAdd('');
    }
  };

  const handleDeleteTitle = (titleId: string) => {
      if (window.confirm("Tem certeza que deseja deletar este título?")) {
          dispatch({ type: 'DELETE_TITLE', payload: { channelId: channel.id, titleId }});
      }
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && selectedTitleId) {
        dispatch({ type: 'ADD_PROJECT', payload: { channelId: channel.id, projectName: newProjectName, titleId: selectedTitleId }});
        setIsProjectModalOpen(false);
        setNewProjectName('');
        setSelectedTitleId('');
    } else {
        alert("Por favor, preencha o nome do projeto e selecione um título.");
    }
  }
  
  const availableTitles = channel.titles.filter(t => t.status === TitleStatus.AVAILABLE);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
       <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Criar Novo Projeto">
          <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Projeto (ex: video_001)</label>
                  <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" required/>
              </div>
              <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Título Disponível</label>
                  <select value={selectedTitleId} onChange={(e) => setSelectedTitleId(e.target.value)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" required>
                      <option value="">Selecione um título</option>
                      {availableTitles.map(title => <option key={title.id} value={title.id}>{title.text}</option>)}
                  </select>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors">Criar Projeto</button>
          </form>
      </Modal>

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-primary hover:underline">&larr; Voltar para o Dashboard</button>
        <h1 className="text-3xl font-bold">{channel.name}</h1>
        <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">Salvar Alterações</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da Esquerda */}
        <div className="space-y-6">
            <SectionCard title="Informações Gerais">
                <textarea value={localChannel.generalInfo} onChange={(e) => handleGeneralInfoChange('generalInfo', e.target.value)} rows={8} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" placeholder="Anotações sobre o canal..." />
                <h4 className="font-semibold mt-4 mb-2">Links Úteis</h4>
                <div className="space-y-2">
                    {localChannel.usefulLinks.map(link => (
                        <div key={link.id} className="flex items-center space-x-2">
                           <input type="text" value={link.url} onChange={e => handleLinkChange(link.id, e.target.value)} placeholder="https://..." className="flex-grow bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" />
                           <button onClick={() => handleRemoveLink(link.id)} className="p-2 text-text-secondary hover:text-danger"><TrashIcon /></button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddLink} className="mt-2 text-sm text-primary hover:underline">+ Adicionar Link</button>
            </SectionCard>
            <SectionCard title="Configurações de Roteiro">
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" value={localChannel.settings.script.wordsPerPart} onChange={e => handleInputChange('script', 'wordsPerPart', Number(e.target.value))} placeholder="Palavras por parte" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="number" value={localChannel.settings.script.videoDuration} onChange={e => handleInputChange('script', 'videoDuration', Number(e.target.value))} placeholder="Tempo do vídeo (min)" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="text" value={localChannel.settings.script.country} onChange={e => handleInputChange('script', 'country', e.target.value)} placeholder="País" className="bg-secondary p-2 rounded-md border border-border" />
                    <select value={localChannel.settings.script.narrationStyle} onChange={e => handleInputChange('script', 'narrationStyle', e.target.value)} className="bg-secondary p-2 rounded-md border border-border">
                        {Object.values(NarrationStyle).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                     <select value={localChannel.settings.script.voiceGender} onChange={e => handleInputChange('script', 'voiceGender', e.target.value)} className="bg-secondary p-2 rounded-md border border-border">
                        {Object.values(VoiceGender).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <textarea value={localChannel.settings.script.notes} onChange={e => handleInputChange('script', 'notes', e.target.value)} placeholder="Informações do Roteiro" rows={4} className="mt-4 w-full bg-secondary p-2 rounded-md border border-border" />
            </SectionCard>
             <SectionCard title="Configurações de Imagem">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={localChannel.settings.image.protagonistInfo} onChange={e => handleInputChange('image', 'protagonistInfo', e.target.value)} placeholder="Protagonista" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="text" value={localChannel.settings.image.environment} onChange={e => handleInputChange('image', 'environment', e.target.value)} placeholder="Ambiente" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="text" value={localChannel.settings.image.style} onChange={e => handleInputChange('image', 'style', e.target.value)} placeholder="Estilo" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="text" value={localChannel.settings.image.framing} onChange={e => handleInputChange('image', 'framing', e.target.value)} placeholder="Enquadramento" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="number" value={localChannel.settings.image.variations} onChange={e => handleInputChange('image', 'variations', Number(e.target.value))} placeholder="Nº de variações" className="bg-secondary p-2 rounded-md border border-border" />
                    <input type="number" value={localChannel.settings.image.sceneCount} onChange={e => handleInputChange('image', 'sceneCount', Number(e.target.value))} placeholder="Quantas cenas" className="bg-secondary p-2 rounded-md border border-border" />
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={localChannel.settings.image.useStoryScenes} onChange={e => handleInputChange('image', 'useStoryScenes', e.target.checked)} id="useScenes" />
                        <label htmlFor="useScenes">Usa cenas da história?</label>
                    </div>
                </div>
            </SectionCard>
            <SectionCard title="Configurações de Voz e Vídeo">
                <textarea value={localChannel.settings.voice.notes} onChange={e => handleInputChange('voice', 'notes', e.target.value)} placeholder="Informações sobre a voz" rows={4} className="w-full bg-secondary p-2 rounded-md border border-border" />
                <div className="flex items-center space-x-4 mt-4">
                     <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={localChannel.settings.video.useOverlay} onChange={e => handleInputChange('video', 'useOverlay', e.target.checked)} id="useOverlay" />
                        <label htmlFor="useOverlay">Usa overlay?</label>
                    </div>
                    <select value={localChannel.settings.video.editor} onChange={e => handleInputChange('video', 'editor', e.target.value)} className="bg-secondary p-2 rounded-md border border-border">
                        {Object.values(VideoEditor).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </SectionCard>
        </div>

        {/* Coluna da Direita */}
        <div className="space-y-6">
            <SectionCard title="Títulos">
                <textarea value={titlesToAdd} onChange={e => setTitlesToAdd(e.target.value)} rows={5} className="w-full bg-secondary p-2 rounded-md border border-border" placeholder="Cole uma lista de títulos aqui, um por linha." />
                <button onClick={handleAddTitles} className="mt-2 w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors">Adicionar Títulos</button>
                <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-2">
                    {channel.titles.map(title => (
                        <div key={title.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                            <span className="text-sm">{title.text}</span>
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    title.status === TitleStatus.AVAILABLE ? 'bg-green-500 text-white' :
                                    title.status === TitleStatus.IN_PRODUCTION ? 'bg-yellow-500 text-black' :
                                    'bg-gray-500 text-white'
                                }`}>{title.status}</span>
                                {title.status === TitleStatus.AVAILABLE && (
                                    <button onClick={() => handleDeleteTitle(title.id)} className="text-text-secondary hover:text-danger"><TrashIcon /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
            <SectionCard title="Produção">
                <button onClick={() => setIsProjectModalOpen(true)} className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Criar Novo Projeto
                </button>
                <div className="mt-4 space-y-3">
                    {channel.projects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => (
                        <ProjectItem key={project.id} channel={channel} project={project} />
                    ))}
                </div>
            </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ChannelView;
   