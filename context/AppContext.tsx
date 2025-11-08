import React, { createContext, useReducer, useContext, useEffect, PropsWithChildren } from 'react';
import { AppState, Action, Channel, Language, NarrationStyle, VoiceGender, VideoEditor, TitleStatus, ProjectStatus } from '../types';

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
            dispatch({ type: 'LOAD_STATE', payload: JSON.parse(storedState) });
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