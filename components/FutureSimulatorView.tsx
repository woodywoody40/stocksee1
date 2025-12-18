
import React, { useState, useCallback } from 'react';
import { generateSimulation } from '../services/geminiService';
import { SimulationResult, UserProfile } from '../types';

const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const UserInput: React.FC<{
    label: string;
    profile: UserProfile;
    setProfile: (p: UserProfile) => void;
    color: string;
}> = ({ label, profile, setProfile, color }) => (
    <div className={`p-6 rounded-2xl border bg-surface-light dark:bg-surface-dark border-outline-light dark:border-outline-dark shadow-xl space-y-4`}>
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-8 rounded-full ${color}`}></div>
            <h3 className="text-xl font-bold">{label}</h3>
        </div>
        <div>
            <label className="block text-xs font-semibold text-secondary-dark mb-1 uppercase tracking-wider">暱稱</label>
            <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition"
                placeholder="例如：王小明"
            />
        </div>
        <div>
            <label className="block text-xs font-semibold text-secondary-dark mb-1 uppercase tracking-wider">性格 (MBTI / 關鍵字)</label>
            <input
                type="text"
                value={profile.personality}
                onChange={(e) => setProfile({ ...profile, personality: e.target.value })}
                className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition"
                placeholder="例如：INTJ, 冷靜, 控制狂"
            />
        </div>
        <div>
            <label className="block text-xs font-semibold text-secondary-dark mb-1 uppercase tracking-wider">興趣與愛好</label>
            <input
                type="text"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition"
                placeholder="例如：黑膠唱片, 登山"
            />
        </div>
        <div>
            <label className="block text-xs font-semibold text-secondary-dark mb-1 uppercase tracking-wider">最受不了的事 (雷區)</label>
            <input
                type="text"
                value={profile.petPeeves}
                onChange={(e) => setProfile({ ...profile, petPeeves: e.target.value })}
                className="w-full px-4 py-2 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition"
                placeholder="例如：遲到, 咀嚼聲"
            />
        </div>
    </div>
);

// FIX: Removed apiKey prop as per guidelines; API key is now handled internally in the service via process.env.API_KEY.
const FutureSimulatorView: React.FC = () => {
    const [userA, setUserA] = useState<UserProfile>({ name: '', personality: '', interests: '', petPeeves: '' });
    const [userB, setUserB] = useState<UserProfile>({ name: '', personality: '', interests: '', petPeeves: '' });
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSimulate = useCallback(async () => {
        if (!userA.name || !userB.name) {
            setError('請填寫雙方的暱稱。');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // FIX: Removed apiKey argument as it's now handled internally in the service.
            const simResult = await generateSimulation(userA, userB);
            setResult(simResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : '模擬失敗，請重試。');
        } finally {
            setIsLoading(false);
        }
    }, [userA, userB]);

    const renderScore = (score: number) => {
        const colorClass = score > 80 ? 'text-positive' : score > 50 ? 'text-brand-gold' : 'text-negative';
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-surface-dark-alt/50 rounded-2xl border border-outline-dark">
                <span className="text-sm font-bold text-secondary-dark mb-2 uppercase tracking-widest">契合度評分</span>
                <div className={`text-6xl font-black ${colorClass}`}>{score}</div>
                <div className="w-full bg-background-dark rounded-full h-2 mt-4 overflow-hidden">
                    <div className={`h-full ${colorClass.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-on-background-light dark:text-on-background-dark tracking-tighter">未來模擬劇本生成器</h2>
                <p className="text-secondary-light dark:text-secondary-dark max-w-2xl mx-auto">
                    輸入兩人的性格特徵，讓 AI 穿越時空，模擬你們在極端情境下的化學反應。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <UserInput label="用戶 A" profile={userA} setProfile={setUserA} color="bg-primary" />
                <UserInput label="用戶 B" profile={userB} setProfile={setUserB} color="bg-blue-500" />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleSimulate}
                    disabled={isLoading}
                    className="group relative px-12 py-4 bg-primary text-on-primary rounded-full font-bold text-xl shadow-glow-orange hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        {isLoading ? <><LoadingIcon className="w-6 h-6" /> 運算未來中...</> : '啟動未來模擬器'}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>

            {error && (
                <div className="bg-positive/10 border border-positive/30 text-positive p-4 rounded-xl text-center animate-shake">
                    {error}
                </div>
            )}

            {result && !isLoading && (
                <div className="mt-12 space-y-12 animate-slide-up-fade">
                    <div className="p-8 bg-surface-light dark:bg-surface-dark rounded-3xl border border-outline-light dark:border-outline-dark shadow-2xl">
                        <div className="inline-block px-4 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4 uppercase tracking-widest">模擬情境</div>
                        <h3 className="text-3xl font-black mb-2">{result.scenario_title}</h3>
                        <p className="text-secondary-light dark:text-secondary-dark italic border-l-4 border-primary/30 pl-4 py-1 mb-8">
                            {result.setting}
                        </p>

                        <div className="space-y-6">
                            {result.script.map((item, index) => (
                                <div 
                                    key={index} 
                                    className={`flex flex-col ${item.speaker === userA.name ? 'items-start' : 'items-end'} animate-stagger-in`}
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className={`max-w-[80%] space-y-1 ${item.speaker === userA.name ? 'text-left' : 'text-right'}`}>
                                        <div className="flex items-center gap-2 mb-1 justify-inherit">
                                            <span className="text-xs font-black uppercase text-secondary-dark tracking-tighter">{item.speaker}</span>
                                            <span className="px-2 py-0.5 bg-background-light dark:bg-background-dark text-[10px] rounded border border-outline-light dark:border-outline-dark">{item.mood}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm ${
                                            item.speaker === userA.name 
                                            ? 'bg-primary/5 dark:bg-primary/20 border-l-4 border-primary rounded-tl-none' 
                                            : 'bg-blue-500/5 dark:bg-blue-500/20 border-r-4 border-blue-500 rounded-tr-none'
                                        }`}>
                                            <p className="text-on-surface-light dark:text-on-surface-dark leading-relaxed font-medium">
                                                「{item.text}」
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 p-8 bg-surface-light dark:bg-surface-dark rounded-3xl border border-outline-light dark:border-outline-dark shadow-xl">
                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-primary">✦</span> 命運點評
                            </h4>
                            <p className="text-on-surface-light dark:text-on-surface-dark leading-relaxed text-lg">
                                {result.psychological_insight}
                            </p>
                            
                            <div className="mt-8 pt-6 border-t border-outline-light dark:border-outline-dark">
                                <h5 className="text-sm font-bold text-secondary-dark mb-3 uppercase tracking-widest">破冰討論題目</h5>
                                <div className="p-4 bg-background-light dark:bg-background-dark rounded-xl border border-dashed border-outline-light dark:border-outline-dark text-center font-bold">
                                    "{result.discussion_topic}"
                                </div>
                            </div>
                        </div>
                        {renderScore(result.compatibility_score)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(FutureSimulatorView);
