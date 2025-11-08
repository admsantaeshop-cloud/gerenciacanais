
export enum Language {
  PORTUGUESE = "Português",
  ENGLISH = "Inglês",
  SPANISH = "Espanhol",
  CROATIAN = "Croata",
}

export enum NarrationStyle {
  FIRST_PERSON = "1ª Pessoa",
  THIRD_PERSON = "3ª Pessoa",
}

export enum VoiceGender {
  MALE = "Masculino",
  FEMALE = "Feminino",
}

export enum VideoEditor {
  CAPCUT = "CapCut",
  GOOGLE_TTS = "Google TTS",
}

export enum TitleStatus {
  AVAILABLE = "Disponível",
  IN_PRODUCTION = "Em Produção",
  USED = "Usado",
}

export enum ProjectStatus {
    PLANNING = "Planejamento",
    SCRIPTING = "Roteirizando",
    RECORDING = "Gravando",
    IN_QUEUE = "Na Fila",
    EDITING = "Em Edição",
    COMPLETED = "Concluído",
    PUBLISHED = "Publicado",
}

export enum EditorStatus {
  FREE = "Livre",
  BUSY = "Gerando",
}

export interface Editor {
  id: string;
  name: string;
  status: EditorStatus;
  currentProjectId?: string;
  queue: string[];
}

export interface ChannelSettings {
  script: {
    wordsPerPart: number;
    videoDuration: number; // in minutes
    country: string;
    narrationStyle: NarrationStyle;
    voiceGender: VoiceGender;
    notes: string;
  };
  image: {
    protagonistInfo: string;
    environment: string;
    style: string;
    framing: string;
    variations: number;
    useStoryScenes: boolean;
    sceneCount: number;
  };
  voice: {
    notes: string;
  };
  video: {
    useOverlay: boolean;
    editor: VideoEditor;
  };
}

export interface VideoTitle {
  id: string;
  text: string;
  status: TitleStatus;
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  content: string; // Base64 data URL
}

export interface Project {
  id: string;
  name: string;
  titleId: string;
  status: ProjectStatus;
  createdAt: string;
  files: FileData[];
}

export interface Channel {
  id: string;
  name: string;
  niche: string;
  subNiche: string;
  language: Language;
  generalInfo: string;
  usefulLinks: { id: string; url: string }[];
  settings: ChannelSettings;
  titles: VideoTitle[];
  projects: Project[];
  editors: Editor[];
  lastPostDate?: string; // YYYY-MM-DD
}

export type AppState = {
  channels: Channel[];
};

export type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_CHANNEL'; payload: Omit<Channel, 'id' | 'projects' | 'titles' | 'settings' | 'generalInfo' | 'usefulLinks' | 'lastPostDate' | 'editors'> }
  | { type: 'UPDATE_CHANNEL'; payload: Channel }
  | { type: 'DELETE_CHANNEL'; payload: { channelId: string } }
  | { type: 'ADD_PROJECT'; payload: { channelId: string; projectName: string; titleId: string } }
  | { type: 'UPDATE_PROJECT_STATUS'; payload: { channelId: string; projectId: string; status: ProjectStatus } }
  | { type: 'DELETE_PROJECT'; payload: { channelId: string; projectId: string } }
  | { type: 'ADD_TITLES'; payload: { channelId: string; titles: string[] } }
  | { type: 'USE_TITLE_FOR_PROJECT'; payload: { channelId: string; titleId: string } }
  | { type: 'DELETE_TITLE'; payload: { channelId: string; titleId: string } }
  | { type: 'UPLOAD_FILE'; payload: { channelId: string; projectId: string; file: Omit<FileData, 'id'> } }
  | { type: 'DELETE_FILE'; payload: { channelId: string; projectId: string; fileId: string } }
  | { type: 'ASSIGN_VIDEO_GENERATION'; payload: { channelId: string; projectId: string; editorId: string } }
  | { type: 'STOP_VIDEO_GENERATION'; payload: { channelId: string; editorId: string } }
  | { type: 'UPDATE_EDITOR_STATUS'; payload: { channelId: string; editorId: string; status: EditorStatus; currentProjectId?: string } };
