
import React, { createContext, useReducer, useContext, useEffect, PropsWithChildren } from 'react';
import { AppState, Action, Channel, Language, NarrationStyle, VoiceGender, VideoEditor, TitleStatus, ProjectStatus, EditorStatus } from '../types';

const initialState: AppState = {
  channels: [],
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'ADD_CHANNEL': {
      const newChannel: Channel = {
        id: crypto.randomUUID(),
        ...action.payload,
        projects: [],
        titles: [],
        editors: [
          { id: crypto.randomUUID(), name: 'Editor 1', status: EditorStatus.FREE, queue: [] },
          { id: crypto.randomUUID(), name: 'Editor 2', status: EditorStatus.FREE, queue: [] },
        ],
        generalInfo: '',
        usefulLinks: [],
        lastPostDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], // Start as late
        settings: {
          script: { wordsPerPart: 300, videoDuration: 10, country: 'Brasil', narrationStyle: NarrationStyle.FIRST_PERSON, voiceGender: VoiceGender.MALE, notes: '' },
          image: { protagonistInfo: '', environment: '', style: '', framing: '', variations: 4, useStoryScenes: true, sceneCount: 10 },
          voice: { notes: '' },
          video: { useOverlay: false, editor: VideoEditor.CAPCUT },
        }
      };
      return { ...state, channels: [...state.channels, newChannel] };
    }
    case 'UPDATE_CHANNEL': {
      return {
        ...state,
        channels: state.channels.map(c => c.id === action.payload.id ? action.payload : c)
      };
    }
    case 'ADD_PROJECT': {
      const { channelId, projectName, titleId } = action.payload;
      const newProject = {
        id: crypto.randomUUID(),
        name: projectName,
        titleId,
        status: ProjectStatus.PLANNING,
        createdAt: new Date().toISOString(),
        files: []
      };
      return {
        ...state,
        channels: state.channels.map(c => 
          c.id === channelId 
            ? { 
                ...c, 
                projects: [...c.projects, newProject],
                titles: c.titles.map(t => t.id === titleId ? { ...t, status: TitleStatus.IN_PRODUCTION } : t)
              } 
            : c
        )
      };
    }
    case 'UPDATE_PROJECT_STATUS': {
        const { channelId, projectId, status } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c =>
                c.id === channelId
                ? {
                    ...c,
                    projects: c.projects.map(p =>
                        p.id === projectId ? { ...p, status } : p
                    ),
                    }
                : c
            ),
        };
    }
    case 'DELETE_PROJECT': {
        const { channelId, projectId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c => {
                if (c.id !== channelId) return c;

                const projectToDelete = c.projects.find(p => p.id === projectId);
                if (!projectToDelete) return c;

                // Set the associated title back to Available
                const updatedTitles = c.titles.map(t =>
                    t.id === projectToDelete.titleId
                    ? { ...t, status: TitleStatus.AVAILABLE }
                    : t
                );

                return {
                    ...c,
                    projects: c.projects.filter(p => p.id !== projectId),
                    titles: updatedTitles,
                };
            })
        };
    }
    case 'ADD_TITLES': {
        const { channelId, titles } = action.payload;
        const newTitles = titles.filter(t => t.trim() !== '').map(text => ({
            id: crypto.randomUUID(),
            text,
            status: TitleStatus.AVAILABLE
        }));
        return {
            ...state,
            channels: state.channels.map(c =>
                c.id === channelId ? { ...c, titles: [...c.titles, ...newTitles] } : c
            )
        };
    }
    case 'DELETE_TITLE': {
        const { channelId, titleId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c =>
                c.id === channelId ? { ...c, titles: c.titles.filter(t => t.id !== titleId) } : c
            )
        };
    }
    case 'UPLOAD_FILE': {
      const { channelId, projectId, file } = action.payload;
      const newFile = { ...file, id: crypto.randomUUID() };
      return {
        ...state,
        channels: state.channels.map(c =>
          c.id === channelId
            ? {
                ...c,
                projects: c.projects.map(p =>
                  p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
                ),
              }
            : c
        ),
      };
    }
    case 'DELETE_FILE': {
        const { channelId, projectId, fileId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c =>
                c.id === channelId
                ? {
                    ...c,
                    projects: c.projects.map(p =>
                        p.id === projectId ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
                    ),
                    }
                : c
            ),
        };
    }
    case 'ASSIGN_VIDEO_GENERATION': {
        const { channelId, projectId, editorId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c => {
                if (c.id !== channelId) return c;

                const project = c.projects.find(p => p.id === projectId);
                const editor = c.editors.find(e => e.id === editorId);

                if (!project || !editor) return c;
                
                let updatedEditor;
                let updatedProject;

                if (editor.status === EditorStatus.FREE) {
                    updatedEditor = { ...editor, status: EditorStatus.BUSY, currentProjectId: project.id };
                    updatedProject = { ...project, status: ProjectStatus.EDITING };
                } else {
                    updatedEditor = { ...editor, queue: [...editor.queue, project.id] };
                    updatedProject = { ...project, status: ProjectStatus.IN_QUEUE };
                }
                
                return {
                    ...c,
                    projects: c.projects.map(p => p.id === projectId ? updatedProject : p),
                    editors: c.editors.map(e => e.id === editorId ? updatedEditor : e),
                };
            })
        };
    }
    case 'STOP_VIDEO_GENERATION': {
        const { channelId, editorId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c => {
                if (c.id !== channelId) return c;
                
                const editor = c.editors.find(e => e.id === editorId);
                if (!editor || !editor.currentProjectId) return c;

                const stoppedProjectId = editor.currentProjectId;
                let updatedProjects = c.projects.map(p => 
                    p.id === stoppedProjectId ? { ...p, status: ProjectStatus.PLANNING } : p
                );

                let updatedEditor;
                const nextInQueueId = editor.queue[0];

                if (nextInQueueId) {
                    // Start next project in queue
                    updatedProjects = updatedProjects.map(p => 
                        p.id === nextInQueueId ? { ...p, status: ProjectStatus.EDITING } : p
                    );
                    updatedEditor = {
                        ...editor,
                        currentProjectId: nextInQueueId,
                        queue: editor.queue.slice(1),
                    };
                } else {
                    // No more projects in queue, editor is free
                    updatedEditor = {
                        ...editor,
                        status: EditorStatus.FREE,
                        currentProjectId: undefined,
                    };
                }

                return {
                    ...c,
                    projects: updatedProjects,
                    editors: c.editors.map(e => e.id === editorId ? updatedEditor : e),
                };
            }),
        };
    }
     case 'UPDATE_EDITOR_STATUS': {
        const { channelId, editorId, status, currentProjectId } = action.payload;
        return {
            ...state,
            channels: state.channels.map(c =>
                c.id === channelId
                ? {
                    ...c,
                    editors: c.editors.map(e =>
                        e.id === editorId ? { ...e, status, currentProjectId: currentProjectId || undefined } : e
                    ),
                    }
                : c
            ),
        };
    }
    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

// FIX: Changed component signature to use PropsWithChildren to fix a typing error where the children prop was not being correctly inferred.
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
        const storedState = localStorage.getItem('youtubeManagerAppState');
        if (storedState) {
            const parsedState: AppState = JSON.parse(storedState);
            // Migration for channels that don't have the 'editors' property
            parsedState.channels = parsedState.channels.map(channel => {
                if (!channel.editors) {
                    return {
                        ...channel,
                        editors: [
                            { id: crypto.randomUUID(), name: 'Editor 1', status: EditorStatus.FREE, currentProjectId: undefined, queue: [] },
                            { id: crypto.randomUUID(), name: 'Editor 2', status: EditorStatus.FREE, currentProjectId: undefined, queue: [] },
                        ]
                    };
                }
                // Migration from currentTask to currentProjectId
                channel.editors = channel.editors.map(e => {
                    const editorWithQueue = { ...e, queue: e.queue || [] };
                    if ('currentTask' in editorWithQueue) {
                        delete (editorWithQueue as any).currentTask;
                        editorWithQueue.currentProjectId = undefined;
                    }
                    return editorWithQueue;
                });
                return channel;
            });
            dispatch({ type: 'LOAD_STATE', payload: parsedState });
        }
    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('youtubeManagerAppState', JSON.stringify(state));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
