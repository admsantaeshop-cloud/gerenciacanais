import React, { useState, useMemo, ChangeEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { Channel, Language, NarrationStyle, VoiceGender, VideoEditor, TitleStatus, ProjectStatus, VideoTitle, Project, FileData, Editor, EditorStatus } from '../types';
import { PlusIcon, TrashIcon, DownloadIcon, FileIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon, DesktopComputerIcon, FilmIcon, StopIcon, EyeIcon, ArrowLeftIcon, InformationCircleIcon } from './icons';
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

const FileBrowser: React.FC<{ channel: Channel, project: Project, onViewFile: (file: FileData) => void }> = ({ channel, project, onViewFile }) => {
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
                        <div className="flex items-center space-x-2 min-w-0">
                            <FileIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-text-secondary flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                             <button onClick={() => onViewFile(file)} className="p-1 text-text-secondary hover:text-primary" aria-label={`Visualizar ${file.name}`}><EyeIcon /></button>
                             <button onClick={() => handleDownload(file)} className="p-1 text-text-secondary hover:text-primary" aria-label={`Baixar ${file.name}`}><DownloadIcon /></button>
                             <button onClick={() => handleDeleteFile(file.id)} className="p-1 text-text-secondary hover:text-danger" aria-label={`Excluir ${file.name}`}><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const getProjectStatusConfig = (status: ProjectStatus): { color: string; textColor: string; progress: number; } => {
    switch (status) {
        case ProjectStatus.PLANNING:
            return { color: 'bg-blue-500', textColor: 'text-white', progress: 10 };
        case ProjectStatus.SCRIPTING:
            return { color: 'bg-indigo-500', textColor: 'text-white', progress: 30 };
        case ProjectStatus.RECORDING:
            return { color: 'bg-purple-500', textColor: 'text-white', progress: 50 };
        case ProjectStatus.IN_QUEUE:
            return { color: 'bg-orange-500', textColor: 'text-white', progress: 65 };
        case ProjectStatus.EDITING:
            return { color: 'bg-yellow-500', textColor: 'text-black', progress: 70 };
        case ProjectStatus.COMPLETED:
            return { color: 'bg-green-500', textColor: 'text-white', progress: 90 };
        case ProjectStatus.PUBLISHED:
            return { color: 'bg-gray-500', textColor: 'text-white', progress: 100 };
        default:
            return { color: 'bg-gray-700', textColor: 'text-white', progress: 0 };
    }
}

const ProjectItem: React.FC<{
    channel: Channel;
    project: Project;
    onEditStatus: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onGenerateVideo: (project: Project) => void;
    onViewFile: (file: FileData) => void;
}> = ({ channel, project, onEditStatus, onDeleteProject, onGenerateVideo, onViewFile }) => {
    const [isOpen, setIsOpen] = useState(false);
    const projectTitle = channel.titles.find(t => t.id === project.titleId)?.text || 'Título não encontrado';
    const statusConfig = getProjectStatusConfig(project.status);
    const canGenerateVideo = ![ProjectStatus.IN_QUEUE, ProjectStatus.EDITING, ProjectStatus.COMPLETED, ProjectStatus.PUBLISHED].includes(project.status);


    return (
        <div className="bg-secondary rounded-lg overflow-hidden shadow-md">
            <div className="p-4">
                 <div className="flex items-center space-x-3 flex-grow min-w-0">
                    <FolderIcon className="text-primary w-6 h-6 flex-shrink-0"/>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-text-primary truncate">{project.name} - <span className="text-text-secondary font-normal italic">{projectTitle}</span></p>
                        <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${statusConfig.color} ${statusConfig.textColor}`}>
                            {project.status}
                        </div>
                    </div>
                </div>
                
                <div className="mt-3 px-1">
                    <div className="w-full bg-border rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${statusConfig.color} transition-all duration-500 ease-in-out`}
                            style={{ width: `${statusConfig.progress}%` }}
                            aria-valuenow={statusConfig.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            role="progressbar"
                            aria-label={`Progresso do projeto: ${statusConfig.progress}%`}
                        ></div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end space-x-2 text-sm">
                   {canGenerateVideo && (
                       <button
                           onClick={() => onGenerateVideo(project)}
                           className="flex items-center px-3 py-1 rounded-md bg-primary hover:bg-primary-hover text-white transition-colors focus:outline-none"
                       >
                           <FilmIcon className="w-4 h-4 mr-1" />
                           Gerar Vídeo
                       </button>
                   )}
                   <button
                       onClick={() => setIsOpen(!isOpen)}
                       className="flex items-center px-3 py-1 rounded-md bg-surface hover:bg-border transition-colors focus:outline-none"
                   >
                       {isOpen ? <ChevronDownIcon className="w-4 h-4 mr-1" /> : <ChevronRightIcon className="w-4 h-4 mr-1" />}
                       Arquivos
                   </button>
                    <button
                        onClick={() => onEditStatus(project)}
                        className="flex items-center px-3 py-1 rounded-md bg-surface hover:bg-border transition-colors focus:outline-none"
                    >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Editar Status
                    </button>
                    <button
                        onClick={() => onDeleteProject(project.id)}
                        className="flex items-center px-3 py-1 rounded-md bg-surface hover:bg-danger text-text-secondary hover:text-white transition-colors focus:outline-none"
                    >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Excluir
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="p-4 border-t border-border bg-background">
                    <FileBrowser channel={channel} project={project} onViewFile={onViewFile} />
                </div>
            )}
        </div>
    );
};

const EditorCard: React.FC<{ channel: Channel; editor: Editor; onViewQueue: (editor: Editor) => void; }> = ({ channel, editor, onViewQueue }) => {
    const { dispatch } = useAppContext();
    const isBusy = editor.status === EditorStatus.BUSY;
    const statusColor = isBusy ? 'bg-warning text-black' : 'bg-success text-white';
    const borderColor = isBusy ? 'border-warning' : 'border-success';

    const currentProject = channel.projects.find(p => p.id === editor.currentProjectId);
    const currentProjectTitle = currentProject ? channel.titles.find(t => t.id === currentProject.titleId)?.text : '';

    const handleStop = () => {
        if (window.confirm(`Tem certeza que deseja interromper a geração do vídeo "${currentProject?.name}"? O projeto voltará ao status de "Planejamento".`)) {
            dispatch({ type: 'STOP_VIDEO_GENERATION', payload: { channelId: channel.id, editorId: editor.id } });
        }
    }

    return (
        <div className={`bg-surface rounded-lg p-6 shadow-lg border-l-4 ${borderColor}`}>
            <div className="flex items-center space-x-4">
                <DesktopComputerIcon className="w-10 h-10 text-primary" />
                <div>
                    <h4 className="text-xl font-bold">{editor.name}</h4>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColor} ${isBusy ? 'animate-pulse' : ''}`}>
                        {editor.status}
                    </span>
                </div>
            </div>
            {isBusy && currentProject && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div>
                        <div className="flex justify-between items-center">
                            <p className="text-text-secondary text-sm">Tarefa Atual:</p>
                            <button onClick={handleStop} className="flex items-center text-xs text-danger hover:underline">
                                <StopIcon className="w-4 h-4 mr-1"/>
                                Interromper
                            </button>
                        </div>
                        <div className="bg-background p-2 rounded-md mt-1">
                            <p className="text-text-primary text-sm font-semibold truncate">{currentProject.name}</p>
                            <p className="text-text-secondary text-xs italic truncate">{currentProjectTitle}</p>
                        </div>
                        <div className="w-full bg-border rounded-full h-2.5 mt-3 overflow-hidden">
                            <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{width: "100%"}}></div>
                        </div>
                    </div>
                </div>
            )}
             <div className="mt-4 pt-4 border-t border-border">
                <p className="text-text-secondary text-sm">Fila de Renderização:</p>
                {editor.queue.length > 0 ? (
                    <div className="flex items-center justify-between mt-1">
                        <p className="font-semibold text-text-primary text-lg">{editor.queue.length} projeto(s)</p>
                        <button onClick={() => onViewQueue(editor)} className="flex items-center text-sm text-primary hover:underline">
                            <EyeIcon className="w-4 h-4 mr-1"/>
                            Ver Fila
                        </button>
                    </div>
                ) : (
                    <p className="text-text-secondary text-sm italic mt-1">Fila vazia</p>
                )}
            </div>
        </div>
    );
};

const SettingsSummary: React.FC<{ channel: Channel }> = ({ channel }) => {
    const { settings, generalInfo, usefulLinks, niche, subNiche, language } = channel;

    const summaryData = [
        { label: "Nicho", value: niche },
        { label: "Sub-nicho", value: subNiche },
        { label: "Idioma", value: language },
        { label: "Estilo de Narração", value: settings.script.narrationStyle },
        { label: "Gênero da Voz", value: settings.script.voiceGender },
        { label: "Editor de Vídeo", value: settings.video.editor },
        { label: "País (Roteiro)", value: settings.script.country },
        { label: "Usa Overlay?", value: settings.video.useOverlay ? 'Sim' : 'Não' },
        { label: "Usa Cenas da História?", value: settings.image.useStoryScenes ? 'Sim' : 'Não' },
        { label: "Protagonista", value: settings.image.protagonistInfo },
        { label: "Ambiente", value: settings.image.environment },
        { label: "Estilo de Imagem", value: settings.image.style },
        { label: "Enquadramento", value: settings.image.framing },
    ];

    return (
        <div className="bg-surface rounded-lg p-6 shadow-lg space-y-8">
            <div>
                <h3 className="flex items-center text-lg font-bold text-primary mb-4">
                    <InformationCircleIcon className="w-6 h-6 mr-2" />
                    Resumo do Canal
                </h3>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <p className="text-sm text-text-secondary">Tempo de Vídeo</p>
                        <p className="text-2xl font-bold text-primary">{settings.script.videoDuration} min</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <p className="text-sm text-text-secondary">Palavras / Parte</p>
                        <p className="text-2xl font-bold text-primary">{settings.script.wordsPerPart}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <p className="text-sm text-text-secondary">Nº de Cenas</p>
                        <p className="text-2xl font-bold text-primary">{settings.image.sceneCount}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg text-center">
                        <p className="text-sm text-text-secondary">Nº de Variações</p>
                        <p className="text-2xl font-bold text-primary">{settings.image.variations}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {summaryData.map(({ label, value }) => (
                        value ? (
                             <div key={label} className="border-b border-border pb-2">
                                <p className="font-semibold text-text-secondary">{label}</p>
                                <p className="text-text-primary">{value}</p>
                            </div>
                        ) : null
                    ))}
                </div>
            </div>

            {/* Notes and Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                     <h4 className="font-semibold text-text-primary mb-2">Anotações do Roteiro</h4>
                     {settings.script.notes ? (
                        <p className="text-sm text-text-secondary bg-secondary p-3 rounded-md whitespace-pre-wrap">{settings.script.notes}</p>
                     ) : <p className="text-sm text-text-secondary italic">Nenhuma anotação.</p>}
                </div>
                 <div>
                     <h4 className="font-semibold text-text-primary mb-2">Anotações da Voz</h4>
                     {settings.voice.notes ? (
                        <p className="text-sm text-text-secondary bg-secondary p-3 rounded-md whitespace-pre-wrap">{settings.voice.notes}</p>
                     ) : <p className="text-sm text-text-secondary italic">Nenhuma anotação.</p>}
                </div>
                <div>
                     <h4 className="font-semibold text-text-primary mb-2">Anotações Gerais</h4>
                     {generalInfo ? (
                        <p className="text-sm text-text-secondary bg-secondary p-3 rounded-md whitespace-pre-wrap">{generalInfo}</p>
                     ) : <p className="text-sm text-text-secondary italic">Nenhuma anotação.</p>}
                </div>
                 <div>
                    <h4 className="font-semibold text-text-primary mb-2">Links Úteis</h4>
                    {usefulLinks.length > 0 ? (
                        <ul className="space-y-2">
                            {usefulLinks.map(link => link.url && (
                                <li key={link.id}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all bg-secondary p-2 rounded-md block">
                                        {link.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-text-secondary italic">Nenhum link.</p>}
                </div>
            </div>
        </div>
    );
}

const ChannelView: React.FC<ChannelViewProps> = ({ channelId, onBack }) => {
  const { state, dispatch } = useAppContext();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [titlesToAdd, setTitlesToAdd] = useState('');
  const [activeTab, setActiveTab] = useState<'production' | 'editors' | 'info'>('production');

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newStatus, setNewStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [projectToGenerate, setProjectToGenerate] = useState<Project | null>(null);

  const [queueModalData, setQueueModalData] = useState<{ editor: Editor; projects: Project[] } | null>(null);
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [viewerModalFile, setViewerModalFile] = useState<FileData | null>(null);


  const channel = useMemo(() => state.channels.find(c => c.id === channelId), [state.channels, channelId]);
  
  const [localChannel, setLocalChannel] = useState<Channel | null>(channel ? JSON.parse(JSON.stringify(channel)) : null);

  if (!channel || !localChannel) {
    return <div>Canal não encontrado.</div>;
  }
  
  const handleSave = () => {
      if(localChannel) {
          dispatch({ type: 'UPDATE_CHANNEL', payload: localChannel });
          setIsEditingSettings(false);
          alert('Canal salvo com sucesso!');
      }
  }

  const handleCancelEdit = () => {
    setLocalChannel(channel ? JSON.parse(JSON.stringify(channel)) : null);
    setIsEditingSettings(false);
  };

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

  const handleOpenStatusModal = (project: Project) => {
      setSelectedProject(project);
      setNewStatus(project.status);
      setIsStatusModalOpen(true);
  }

  const handleUpdateProjectStatus = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedProject) {
          dispatch({
              type: 'UPDATE_PROJECT_STATUS',
              payload: {
                  channelId: channel.id,
                  projectId: selectedProject.id,
                  status: newStatus,
              }
          });
          setIsStatusModalOpen(false);
          setSelectedProject(null);
      }
  }

  const handleDeleteProject = (projectId: string) => {
      if (window.confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
          dispatch({ type: 'DELETE_PROJECT', payload: { channelId: channel.id, projectId }});
      }
  }

    const handleOpenGenerateModal = (project: Project) => {
        setProjectToGenerate(project);
        setIsGenerateModalOpen(true);
    };

    const handleAssignToEditor = (editorId: string) => {
        if (!projectToGenerate) return;
        dispatch({
            type: 'ASSIGN_VIDEO_GENERATION',
            payload: {
                channelId: channel.id,
                projectId: projectToGenerate.id,
                editorId,
            }
        });
        setIsGenerateModalOpen(false);
        setProjectToGenerate(null);
    };

    const handleAssignAutomatically = () => {
        const freeEditor = channel.editors.find(e => e.status === EditorStatus.FREE);
        if (freeEditor) {
            handleAssignToEditor(freeEditor.id);
            return;
        }

        const leastBusyEditor = channel.editors.reduce(
            (leastBusy, current) => (current.queue?.length ?? 0) < (leastBusy.queue?.length ?? 0) ? current : leastBusy,
            channel.editors[0]
        );
        
        if(leastBusyEditor) {
            handleAssignToEditor(leastBusyEditor.id);
        }
    };
    
    const handleViewQueue = (editor: Editor) => {
        const queuedProjects = editor.queue
            .map(projectId => channel.projects.find(p => p.id === projectId))
            .filter((p): p is Project => !!p);
        setQueueModalData({ editor, projects: queuedProjects });
    };

    const handleViewFile = (file: FileData) => {
        setViewerModalFile(file);
    };

    const renderFilePreview = (file: FileData | null) => {
        if (!file) return null;
    
        if (file.type.startsWith('image/')) {
            return <img src={file.content} alt={file.name} className="max-w-full max-h-[70vh] rounded-md mx-auto" />;
        }
    
        if (file.type.startsWith('text/') || file.type === 'application/x-subrip' || file.name.endsWith('.txt') || file.name.endsWith('.srt')) {
            try {
                const base64Data = file.content.substring(file.content.indexOf(',') + 1);
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decodedText = new TextDecoder('utf-8').decode(bytes);
                return <pre className="text-sm bg-background p-4 rounded-md whitespace-pre-wrap break-words max-h-[70vh] overflow-y-auto">{decodedText}</pre>;
            } catch (e) {
                console.error("Error decoding base64 content", e);
                return <p className="text-danger">Erro ao decodificar o conteúdo do arquivo.</p>;
            }
        }
    
        return <p className="text-text-secondary">Pré-visualização não disponível para o tipo de arquivo: {file.type}</p>;
    };

  const availableTitles = channel.titles.filter(t => t.status === TitleStatus.AVAILABLE);
  
  return (
    <div className="p-4 md:p-8 space-y-6">
       <Modal 
            isOpen={!!viewerModalFile} 
            onClose={() => setViewerModalFile(null)} 
            title={viewerModalFile?.name || 'Visualizador de Arquivo'}
        >
            {renderFilePreview(viewerModalFile)}
       </Modal>
       <Modal isOpen={!!queueModalData} onClose={() => setQueueModalData(null)} title={`Fila - ${queueModalData?.editor.name}`}>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {queueModalData?.projects.length === 0 ? (
                    <p className="text-text-secondary">A fila de renderização está vazia.</p>
                ) : (
                    queueModalData?.projects.map(project => {
                        const projectTitle = channel.titles.find(t => t.id === project.titleId)?.text || '';
                        return (
                             <div key={project.id} className="bg-secondary p-3 rounded-lg">
                                <p className="font-semibold text-text-primary">{project.name}</p>
                                <p className="text-sm text-text-secondary italic">{projectTitle}</p>
                            </div>
                        )
                    })
                )}
            </div>
       </Modal>
       
       <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title={`Gerar Vídeo: ${projectToGenerate?.name}`}>
        <div className="space-y-4">
            <p className="text-text-secondary">Escolha um editor para renderizar o projeto ou adicione à fila de um editor ocupado.</p>
            <button
                onClick={handleAssignAutomatically}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors font-semibold"
            >
                Atribuir Automaticamente
            </button>
            <div className="border-t border-border my-4"></div>
            <div className="space-y-3">
                {channel.editors.map(editor => {
                    const isBusy = editor.status === EditorStatus.BUSY;
                    return (
                        <div key={editor.id} className="bg-secondary p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-text-primary">{editor.name}</h4>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBusy ? 'bg-warning text-black' : 'bg-success text-white'}`}>{editor.status}</span>
                                {isBusy && <p className="text-xs text-text-secondary mt-1">Fila: {editor.queue?.length ?? 0}</p>}
                            </div>
                            <button
                                onClick={() => handleAssignToEditor(editor.id)}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${isBusy ? 'bg-surface hover:bg-border text-text-primary' : 'bg-success hover:bg-green-600 text-white'}`}
                            >
                                {isBusy ? 'Adicionar à Fila' : 'Gerar Agora'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
      </Modal>

       <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Editar Status do Projeto">
            <form onSubmit={handleUpdateProjectStatus} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status para "{selectedProject?.name}"</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ProjectStatus)} className="w-full bg-secondary p-2 rounded-md border border-border focus:ring-primary focus:border-primary" required>
                        {Object.values(ProjectStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors">Atualizar Status</button>
            </form>
       </Modal>

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

      <header className="flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface transition-colors" aria-label="Voltar para o Dashboard">
            <ArrowLeftIcon className="w-6 h-6 text-text-secondary hover:text-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary text-right">{channel.name}</h1>
      </header>
      
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
             <button
                onClick={() => setActiveTab('production')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'production'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'
                }`}
            >
                Produção
            </button>
            <button
                onClick={() => setActiveTab('editors')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'editors'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'
                }`}
            >
                Editores
            </button>
            <button
                onClick={() => setActiveTab('info')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'info'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'
                }`}
            >
                Informações e Configurações
            </button>
        </nav>
      </div>
      
      {activeTab === 'production' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <SectionCard title="Produção">
                    <button onClick={() => setIsProjectModalOpen(true)} className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center">
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Criar Novo Projeto
                    </button>
                    <div className="mt-4 space-y-3">
                        {channel.projects.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => (
                            <ProjectItem 
                                key={project.id} 
                                channel={channel} 
                                project={project}
                                onEditStatus={handleOpenStatusModal}
                                onDeleteProject={handleDeleteProject}
                                onGenerateVideo={handleOpenGenerateModal}
                                onViewFile={handleViewFile}
                            />
                        ))}
                    </div>
                </SectionCard>
            </div>
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
            </div>
        </div>
    )}

    {activeTab === 'editors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channel.editors.map(editor => (
                <EditorCard key={editor.id} channel={channel} editor={editor} onViewQueue={handleViewQueue} />
            ))}
        </div>
    )}

    {activeTab === 'info' && (
        <div>
            {!isEditingSettings ? (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setIsEditingSettings(true)} className="flex items-center bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <PencilIcon className="w-5 h-5 mr-2" />
                            Editar Configurações
                        </button>
                    </div>
                    <SettingsSummary channel={localChannel} />
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        </div>
                        <div className="space-y-6">
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
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                        <button onClick={handleCancelEdit} className="bg-secondary hover:bg-border text-text-primary font-bold py-2 px-6 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}
        </div>
    )}
    </div>
  );
};

export default ChannelView;