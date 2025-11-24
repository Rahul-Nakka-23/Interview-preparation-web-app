
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Card from '../ui/Card';
import type { RoadmapItem, Resource } from '../../types';

// --- Icons ---
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);
const ArticleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
    </svg>
);
const DocsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);
const InteractiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75 18 18M8.25 11.25h7.5" />
    </svg>
);

const ResourceIcon: React.FC<{ type: Resource['type'], className?: string }> = ({ type, className = "w-5 h-5 text-text-secondary" }) => {
    switch (type) {
        case 'article': return <ArticleIcon className={className} />;
        case 'video': return <VideoIcon className={className} />;
        case 'docs': return <DocsIcon className={className} />;
        case 'interactive': return <InteractiveIcon className={className} />;
        default: return null;
    }
};

interface RoadmapItemCardProps {
    item: RoadmapItem;
    onToggle: (id: string) => void;
}

const RoadmapItemCardInternal: React.FC<RoadmapItemCardProps> = ({ item, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-primary rounded-lg border border-gray-700 transition-shadow hover:shadow-lg">
            <div
                className="flex items-center space-x-4 p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                aria-expanded={isExpanded}
                aria-controls={`roadmap-content-${item.id}`}
            >
                <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggle(item.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 h-5 w-5 rounded bg-secondary border-gray-600 text-accent focus:ring-accent cursor-pointer"
                    aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
                />
                <div className="flex-1">
                    <h3 className={`font-bold ${item.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                        {item.title}
                    </h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            {isExpanded && (
                <div id={`roadmap-content-${item.id}`} className="px-6 pb-4 border-t border-gray-700 space-y-4">
                    <p className="text-sm text-text-secondary pt-4">{item.description}</p>
                    
                    <div>
                        <h4 className="font-semibold text-accent mb-2">Key Concepts</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                            {item.keyConcepts.map(concept => <li key={concept}>{concept}</li>)}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-accent mb-2">Suggested Project</h4>
                        <p className="text-sm text-text-secondary bg-secondary p-3 rounded-md border border-gray-600">
                            {item.project}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-accent mb-2">Resources</h4>
                        <div className="space-y-2">
                           {item.resources.map(resource => (
                               <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.url} className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary transition-colors group">
                                   <ResourceIcon type={resource.type} />
                                   <span className="text-sm text-accent group-hover:underline">{resource.title}</span>
                               </a>
                           ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const RoadmapItemCard = React.memo(RoadmapItemCardInternal);

const DashboardPage: React.FC = () => {
    const { user, roadmap, evaluation, toggleTodo } = useContext(AppContext);

    if (!user || roadmap.length === 0 || !evaluation) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold">No progress to show yet.</h2>
                <p className="text-text-secondary mt-2">Complete an interview to get your personalized dashboard.</p>
            </div>
        );
    }

    const completedCount = roadmap.filter(item => item.completed).length;
    const totalCount = roadmap.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Beginner': return 'bg-yellow-400';
            case 'Intermediate': return 'bg-blue-400';
            case 'Advanced': return 'bg-green-400';
            default: return 'bg-text-primary';
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Welcome to your Dashboard, {user.name}!</h1>
                <p className="text-text-secondary mt-2">Track your journey to becoming a top-tier {user.goal}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                    <h3 className="text-lg font-bold text-text-secondary">Current Level</h3>
                    <p className={`text-3xl font-bold ${getLevelColor(evaluation.level).replace('bg-','text-')}`}>{evaluation.level}</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-lg font-bold text-text-secondary">Roadmap Progress</h3>
                    <p className="text-3xl font-bold">{completedCount} / {totalCount}</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-lg font-bold text-text-secondary">Completion</h3>
                    <p className="text-3xl font-bold">{progressPercentage}%</p>
                </Card>
            </div>

            <Card>
                <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
                <div className="w-full bg-primary rounded-full h-4 mb-4 border border-gray-700">
                    <div 
                        className="bg-accent h-4 rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className="text-right text-sm text-text-secondary">{progressPercentage}% Complete</p>
            </Card>

            <Card>
                <h2 className="text-2xl font-bold mb-4">Your To-Do List</h2>
                <div className="space-y-4">
                    {roadmap.map((item) => (
                        <RoadmapItemCard key={item.id} item={item} onToggle={toggleTodo} />
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
