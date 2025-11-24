
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import type { Page, User, TranscriptMessage, Evaluation, RoadmapItem, InterviewType } from '../types';

interface AppContextType {
  page: Page;
  user: User | null;
  interviewTypes: InterviewType[];
  transcript: TranscriptMessage[];
  evaluation: Evaluation | null;
  roadmap: RoadmapItem[];
  setPage: (page: Page) => void;
  startInterview: (name: string, goal: string, types: InterviewType[]) => void;
  addMessageToTranscript: (message: TranscriptMessage) => void;
  setEvaluation: (evaluation: Evaluation | null) => void;
  setRoadmap: (roadmap: Omit<RoadmapItem, 'id' | 'completed'>[]) => void;
  toggleTodo: (id: string) => void;
  startNewInterview: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [page, setPage] = useState<Page>('setup');
  const [user, setUser] = useState<User | null>(null);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [roadmap, setRoadmapState] = useState<RoadmapItem[]>([]);

  const startInterview = (name: string, goal: string, types: InterviewType[]) => {
    setUser({ name, goal });
    setInterviewTypes(types);
    setPage('interview');
  };

  const addMessageToTranscript = useCallback((message: TranscriptMessage) => {
    setTranscript(prev => [...prev, message]);
  }, []);

  const setRoadmap = (newRoadmap: Omit<RoadmapItem, 'id' | 'completed'>[]) => {
    const roadmapWithIds = newRoadmap.map((item, index) => ({
      ...item,
      id: `todo-${index}-${Date.now()}`,
      completed: false,
    }));
    setRoadmapState(roadmapWithIds);
  };
  
  const toggleTodo = (id: string) => {
    setRoadmapState(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const startNewInterview = useCallback(() => {
    setUser(null);
    setInterviewTypes([]);
    setTranscript([]);
    setEvaluation(null);
    setRoadmapState([]);
    setPage('setup');
  }, []);
  
  return (
    <AppContext.Provider value={{ 
        page, 
        user,
        interviewTypes, 
        transcript, 
        evaluation, 
        roadmap, 
        setPage, 
        startInterview,
        addMessageToTranscript,
        setEvaluation, 
        setRoadmap,
        toggleTodo,
        startNewInterview,
    }}>
      {children}
    </AppContext.Provider>
  );
};
