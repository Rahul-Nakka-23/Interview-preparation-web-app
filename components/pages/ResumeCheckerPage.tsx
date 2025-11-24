import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { aiService } from '../../services';

interface ScoreResult {
    score: number;
    strengths: string;
    weaknesses: string;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = () => {
        if (score < 40) return 'stroke-red-500';
        if (score < 75) return 'stroke-yellow-400';
        return 'stroke-green-400';
    };

    return (
        <div className="relative flex items-center justify-center w-40 h-40" role="img" aria-label={`Resume match score of ${score} out of 100.`}>
            <svg className="w-full h-full" viewBox="0 0 140 140" aria-hidden="true">
                <circle
                    className="text-gray-600"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
                <circle
                    className={`transition-all duration-1000 ease-out ${getScoreColor()}`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                    transform="rotate(-90 70 70)"
                />
            </svg>
            <span className="absolute text-4xl font-bold" aria-hidden="true">{score}</span>
        </div>
    );
};


const ResumeCheckerPage: React.FC = () => {
    const [resume, setResume] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = resume.trim() !== '' && jobDescription.trim() !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysis = await aiService.scoreResume(resume, jobDescription);
            setResult(analysis);
        } catch (err: any) {
            console.error("Failed to score resume:", err);
            setError(err.message || "Sorry, an error occurred while analyzing. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Resume & Job Description Analyzer</h1>
                <p className="text-text-secondary mt-2">Get an instant analysis of how well your resume matches a job description.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="resume" className="block text-lg font-medium text-text-primary mb-2">
                                Your Resume
                            </label>
                            <Textarea
                                id="resume"
                                rows={15}
                                value={resume}
                                onChange={(e) => setResume(e.target.value)}
                                placeholder="Paste your resume content here..."
                                required
                                aria-required="true"
                                aria-describedby="resume-description"
                            />
                             <p id="resume-description" className="text-xs text-text-secondary mt-2">For best results, paste the plain text from your resume. PDF or DOCX upload is not yet supported.</p>
                        </div>
                        <div>
                            <label htmlFor="job-description" className="block text-lg font-medium text-text-primary mb-2">
                                Job Description
                            </label>
                            <Textarea
                                id="job-description"
                                rows={15}
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                required
                                aria-required="true"
                            />
                        </div>
                    </div>
                    <div className="text-center">
                        <Button type="submit" size="lg" disabled={!canSubmit || isLoading} isLoading={isLoading}>
                            Check Score
                        </Button>
                    </div>
                </form>
            </Card>

            <div aria-live="polite" aria-atomic="true">
                {error && (
                    <Card role="alert" className="text-center text-red-400">
                        <p className="font-semibold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                    </Card>
                )}

                {result && (
                    <Card>
                        <h2 className="text-2xl font-bold text-center mb-6">Your Results</h2>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <h3 className="text-lg font-semibold text-text-secondary mb-2">Match Score</h3>
                                <ScoreCircle score={result.score} />
                            </div>
                            <div className="w-full space-y-6">
                                <div className="bg-primary p-4 rounded-lg border border-gray-700">
                                    <h3 className="font-bold text-green-400 mb-2 text-lg">Strengths</h3>
                                    <p className="text-text-secondary whitespace-pre-wrap">{result.strengths}</p>
                                </div>
                                <div className="bg-primary p-4 rounded-lg border border-gray-700">
                                    <h3 className="font-bold text-yellow-400 mb-2 text-lg">Areas for Improvement</h3>
                                    <p className="text-text-secondary whitespace-pre-wrap">{result.weaknesses}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ResumeCheckerPage;