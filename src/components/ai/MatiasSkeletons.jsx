/**
 * 💀 Advanced Loading Skeletons Component
 *
 * Provides optimized loading states and animations for various
 * components in the Matias AI assistant interface
 */

import React from 'react';
import {
    MessageSquare, User, Bot, Calendar, Search, Settings,
    FileText, Camera, Mic, Clock, Wrench, Car,
    Loader2, Activity, Zap, Shield, Coffee
} from 'lucide-react';

const MatiasSkeletons = {
    // Chat message skeleton
    MessageSkeleton: ({ isUser = false, size = 'medium' }) => {
        const sizeClasses = {
            small: 'w-2 h-2',
            medium: 'w-3 h-3',
            large: 'w-4 h-4'
        };

        return (
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
                    {/* Avatar skeleton */}
                    {!isUser && (
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                        </div>
                    )}

                    {/* Message bubble skeleton */}
                    <div className={`
                        p-4 rounded-lg shadow-sm
                        ${isUser
                            ? 'bg-blue-100 animate-pulse'
                            : 'bg-white border border-gray-200'
                        }
                    `}>
                        {/* Text lines */}
                        <div className="space-y-2">
                            <div className={`h-4 bg-gray-200 rounded animate-pulse`} />
                            <div className={`h-4 bg-gray-200 rounded animate-pulse w-4/5`} />
                            <div className={`h-4 bg-gray-200 rounded animate-pulse w-3/5`} />
                        </div>

                        {/* Metadata skeleton */}
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-8 h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
                            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* User avatar */}
                    {isUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center order-2 ml-3 animate-pulse" />
                    )}
                </div>
            </div>
        );
    },

    // Typing indicator skeleton
    TypingSkeleton: () => (
        <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                </div>
            </div>
        </div>
    ),

    // Input field skeleton
    InputSkeleton: () => (
        <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            </div>
        </div>
    ),

    // Chat header skeleton
    HeaderSkeleton: () => (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
                    <div>
                        <div className="w-32 h-5 bg-white/20 rounded animate-pulse mb-1" />
                        <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse" />
                </div>
            </div>
        </div>
    ),

    // Suggestions skeleton
    SuggestionsSkeleton: () => (
        <div className="space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
            {[...Array(3)].map((_, index) => (
                <div key={index} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
                        <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4 mb-2" />
                            <div className="h-3 bg-gray-300 rounded animate-pulse w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    ),

    // Service card skeleton
    ServiceCardSkeleton: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-5/6 mb-3" />
                    <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded px-3" />
                        <div className="h-6 bg-gray-200 rounded px-3" />
                    </div>
                </div>
            </div>
        </div>
    ),

    // Timeline skeleton
    TimelineSkeleton: () => (
        <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
                <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        {index < 2 && <div className="w-0.5 h-16 bg-gray-200" />}
                    </div>
                    <div className="flex-1 pt-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    ),

    // Loading overlay skeleton
    LoadingOverlay: ({ message = 'Carregando...' }) => (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-full animate-ping" />
                    </div>
                    <div className="text-center">
                        <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    ),

    // Voice interface skeleton
    VoiceInterfaceSkeleton: () => (
        <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
                    <div className="w-20 h-4 bg-gray-300 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-16 h-3 bg-gray-300 rounded animate-pulse" />
                    <div className="w-6 h-6 bg-gray-300 rounded animate-pulse" />
                </div>
            </div>

            {/* Waveform skeleton */}
            <div className="mb-3">
                <div className="w-full h-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Transcript skeleton */}
            <div className="min-h-[60px] p-3 bg-gray-100 rounded-lg">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded animate-pulse" />
                    <div className="h-4 bg-gray-300 rounded w-4/5 animate-pulse" />
                </div>
            </div>

            {/* Controls skeleton */}
            <div className="flex gap-2 mt-3">
                <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse" />
                <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse" />
                <div className="w-10 h-10 bg-gray-300 rounded-lg animate-pulse" />
            </div>
        </div>
    ),

    // Progress bar skeleton
    ProgressSkeleton: () => (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-300 h-2 rounded-full w-0 animate-pulse" />
            </div>
        </div>
    ),

    // Feature card skeleton
    FeatureCardSkeleton: () => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto" />
        </div>
    ),

    // Settings panel skeleton
    SettingsPanelSkeleton: () => (
        <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />

            {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
                        <div>
                            <div className="h-4 bg-gray-300 rounded w-24 mb-1 animate-pulse" />
                            <div className="h-3 bg-gray-300 rounded w-32 animate-pulse" />
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-gray-300 rounded-full animate-pulse" />
                </div>
            ))}
        </div>
    ),

    // History item skeleton
    HistoryItemSkeleton: () => (
        <div className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-300 rounded w-32 animate-pulse" />
                        <div className="h-3 bg-gray-300 rounded w-16 animate-pulse" />
                    </div>
                    <div className="h-3 bg-gray-300 rounded w-full mb-1 animate-pulse" />
                    <div className="h-3 bg-gray-300 rounded w-3/4 animate-pulse" />
                </div>
            </div>
        </div>
    ),

    // Advanced loading skeleton with animation variations
    AdvancedLoadingSkeleton: ({ variant = 'default', size = 'medium' }) => {
        const variants = {
            default: 'bg-gradient-to-r from-gray-200 to-gray-300',
            pulse: 'bg-gray-200 animate-pulse',
            shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
            wave: 'bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200'
        };

        const sizes = {
            small: 'h-4',
            medium: 'h-6',
            large: 'h-8'
        };

        return (
            <div
                className={`
                    ${variants[variant] || variants.default}
                    ${sizes[size] || sizes.medium}
                    rounded animate-pulse
                `}
                style={{
                    backgroundSize: variant === 'shimmer' ? '200% 100%' : undefined,
                    animation: variant === 'shimmer' ? 'shimmer 1.5s infinite' : undefined
                }}
            />
        );
    },

    // Combined skeleton components for complex layouts
    ChatSkeleton: ({ messageCount = 3 }) => (
        <div className="space-y-4">
            {/* Header */}
            <MatiasSkeletons.HeaderSkeleton />

            {/* Messages */}
            <div className="space-y-4">
                {[...Array(messageCount)].map((_, index) => (
                    <MatiasSkeletons.MessageSkeleton
                        key={index}
                        isUser={index % 2 === 1}
                    />
                ))}
                <MatiasSkeletons.TypingSkeleton />
            </div>

            {/* Input */}
            <MatiasSkeletons.InputSkeleton />
        </div>
    ),

    DashboardSkeleton: () => (
        <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => (
                    <MatiasSkeletons.ServiceCardSkeleton key={index} />
                ))}
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
                <MatiasSkeletons.TimelineSkeleton />
            </div>

            {/* Recent activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
                <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                        <MatiasSkeletons.HistoryItemSkeleton key={index} />
                    ))}
                </div>
            </div>
        </div>
    )
};

// CSS for custom animations
const SkeletonStyles = () => (
    <style jsx>{`
        @keyframes shimmer {
            0% {
                background-position: -200% 0;
            }
            100% {
                background-position: 200% 0;
            }
        }

        .skeleton-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }

        .skeleton-wave {
            background: linear-gradient(90deg, #e3f2fd 25%, #bbdefb 50%, #e3f2fd 75%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }

        .skeleton-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: .5;
            }
        }
    `}</style>
);

export { MatiasSkeletons, SkeletonStyles };
export default MatiasSkeletons;