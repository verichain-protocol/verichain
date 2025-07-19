/**
 * VeriChain Analytics Component
 * Real detection history and statistics tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Shield, Clock, AlertTriangle, CheckCircle, Download, Filter, Calendar } from 'lucide-react';
import { coreAIService } from '../services/coreAI.service';
import { DetectionResult } from '../types/ai.types';
import { formatConfidence, formatProcessingTime } from '../utils/uiHelpers';
import './Analytics.scss';

interface AnalyticsData {
  totalScans: number;
  realContent: number;
  aiGeneratedContent: number;
  deepfakesDetected: number;
  averageProcessingTime: number;
  recentAnalyses: DetectionResult[];
  dailyStats: Array<{
    date: string;
    scans: number;
    deepfakes: number;
    real: number;
    ai_generated: number;
  }>;
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
  }>;
}

interface FilterOptions {
  dateRange: '7d' | '30d' | '90d' | 'all';
  contentType: 'all' | 'image' | 'video' | 'social_media';
  resultType: 'all' | 'deepfake' | 'real' | 'ai_generated';
}

export const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalScans: 0,
    realContent: 0,
    aiGeneratedContent: 0,
    deepfakesDetected: 0,
    averageProcessingTime: 0,
    recentAnalyses: [],
    dailyStats: [],
    accuracyTrend: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '30d',
    contentType: 'all',
    resultType: 'all'
  });

  /**
   * Load analytics data from local storage and AI service
   */
  const loadAnalyticsData = useCallback(async () => {
    setError('');

    try {
      // Get detection history from localStorage
      const historyData = localStorage.getItem('verichain_detection_history');
      const detectionHistory: DetectionResult[] = historyData ? JSON.parse(historyData) : [];

      // Apply filters
      const filteredHistory = detectionHistory.filter(result => {
        // Date filter
        const resultDate = new Date(result.metadata ? JSON.parse(result.metadata).analyzedAt : Date.now());
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let dateMatch = true;
        switch (filters.dateRange) {
          case '7d':
            dateMatch = daysDiff <= 7;
            break;
          case '30d':
            dateMatch = daysDiff <= 30;
            break;
          case '90d':
            dateMatch = daysDiff <= 90;
            break;
          default:
            dateMatch = true;
        }

        // Content type filter
        let contentMatch = true;
        if (filters.contentType !== 'all') {
          contentMatch = result.media_type === filters.contentType;
        }

        // Result type filter
        let resultMatch = true;
        if (filters.resultType !== 'all') {
          if (filters.resultType === 'deepfake') {
            resultMatch = result.is_deepfake;
          } else if (filters.resultType === 'real') {
            // Check if it's real content (analysis_details.classification === 'Real')
            const isReal = result.analysis_details?.classification === 'Real' ||
                          (!result.is_deepfake && (result.analysis_details?.classes?.real_probability || 0) > 0.5);
            resultMatch = isReal;
          } else if (filters.resultType === 'ai_generated') {
            // Check if it's AI generated content
            const isAiGenerated = result.analysis_details?.classification === 'AI Generated' ||
                                  (result.analysis_details?.classes?.ai_generated_probability || 0) > 0.5;
            resultMatch = isAiGenerated;
          }
        }

        return dateMatch && contentMatch && resultMatch;
      });

      // Calculate statistics with 3-class classification
      const totalScans = filteredHistory.length;
      const deepfakesDetected = filteredHistory.filter(r => r.is_deepfake).length;
      
      const realContent = filteredHistory.filter(r => {
        return r.analysis_details?.classification === 'Real' ||
               (!r.is_deepfake && (r.analysis_details?.classes?.real_probability || 0) > 0.5);
      }).length;
      
      const aiGeneratedContent = filteredHistory.filter(r => {
        return r.analysis_details?.classification === 'AI Generated' ||
               (r.analysis_details?.classes?.ai_generated_probability || 0) > 0.5;
      }).length;
      
      const averageProcessingTime = totalScans > 0 
        ? filteredHistory.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / totalScans
        : 0;

      // Generate daily stats with 3 classifications
      const dailyStatsMap = new Map<string, { scans: number; deepfakes: number; real: number; ai_generated: number }>();
      
      filteredHistory.forEach(result => {
        const date = new Date(result.metadata ? JSON.parse(result.metadata).analyzedAt : Date.now())
          .toISOString().split('T')[0];
        
        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, { scans: 0, deepfakes: 0, real: 0, ai_generated: 0 });
        }
        
        const stats = dailyStatsMap.get(date)!;
        stats.scans++;
        
        if (result.is_deepfake) {
          stats.deepfakes++;
        } else if (result.analysis_details?.classification === 'Real' ||
                   (result.analysis_details?.classes?.real_probability || 0) > 0.5) {
          stats.real++;
        } else {
          stats.ai_generated++;
        }
      });

      const dailyStats = Array.from(dailyStatsMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days

      // Generate accuracy trend (simulated based on actual detection confidence)
      const accuracyTrend = dailyStats.map(day => {
        const dayResults = filteredHistory.filter(r => {
          const resultDate = new Date(r.metadata ? JSON.parse(r.metadata).analyzedAt : Date.now())
            .toISOString().split('T')[0];
          return resultDate === day.date;
        });
        
        const avgConfidence = dayResults.length > 0
          ? dayResults.reduce((sum, r) => sum + r.confidence, 0) / dayResults.length
          : 0.98; // Default model accuracy
        
        return {
          date: day.date,
          accuracy: Math.round(avgConfidence * 100 * 100) / 100 // Round to 2 decimal places
        };
      });

      setAnalyticsData({
        totalScans,
        realContent,
        aiGeneratedContent,
        deepfakesDetected,
        averageProcessingTime,
        recentAnalyses: filteredHistory.slice(-10).reverse(), // Latest 10
        dailyStats,
        accuracyTrend
      });

    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
    }
  }, [filters]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  /**
   * Export analytics data as JSON
   */
  const exportData = useCallback(() => {
    const exportData = {
      ...analyticsData,
      filters,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verichain-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analyticsData, filters]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  if (error) {
    return (
      <div className="analytics-error">
        <AlertTriangle className="error-icon" size={32} />
        <h3>Unable to Load Analytics</h3>
        <p>{error}</p>
        <button onClick={loadAnalyticsData} className="retry-button">
          <Clock size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-container">
        
        {/* Filters */}
        <div className="analytics-filters">
          <div className="filters-left">
            <div className="filter-group">
              <label>
                <Calendar size={16} />
                Date Range
              </label>
              <select 
                value={filters.dateRange} 
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Filter size={16} />
                Content Type
              </label>
              <select 
                value={filters.contentType} 
                onChange={(e) => handleFilterChange('contentType', e.target.value)}
              >
                <option value="all">All types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="social_media">Social Media</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Shield size={16} />
                Result Type
              </label>
              <select 
                value={filters.resultType} 
                onChange={(e) => handleFilterChange('resultType', e.target.value)}
              >
                <option value="all">All results</option>
                <option value="deepfake">Deepfakes only</option>
                <option value="real">Real content only</option>
                <option value="ai_generated">AI Generated only</option>
              </select>
            </div>
          </div>

          <div className="filters-right">
            <div className="filter-group">
              <button onClick={exportData} className="export-button">
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-layout">
          {/* Main Stats - 3 kotak besar */}
          <div className="main-stats">
            <div className="stat-card main">
              <div className="stat-icon real">
                <CheckCircle size={28} />
              </div>
              <div className="stat-content">
                <h3>{analyticsData.realContent.toLocaleString()}</h3>
                <p>Real Content</p>
              </div>
            </div>

            <div className="stat-card main">
              <div className="stat-icon ai-generated">
                <Shield size={28} />
              </div>
              <div className="stat-content">
                <h3>{analyticsData.aiGeneratedContent.toLocaleString()}</h3>
                <p>AI Generated</p>
              </div>
            </div>

            <div className="stat-card main">
              <div className="stat-icon deepfake">
                <AlertTriangle size={28} />
              </div>
              <div className="stat-content">
                <h3>{analyticsData.deepfakesDetected.toLocaleString()}</h3>
                <p>Deepfakes Detected</p>
              </div>
            </div>
          </div>

          {/* Secondary Stats - 2 kotak kecil */}
          <div className="secondary-stats">
            <div className="stat-card secondary">
              <div className="stat-icon total">
                <BarChart3 size={20} />
              </div>
              <div className="stat-content">
                <h3>{analyticsData.totalScans.toLocaleString()}</h3>
                <p>Total Scans</p>
              </div>
            </div>

            <div className="stat-card secondary">
              <div className="stat-icon processing">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <h3>{formatProcessingTime(analyticsData.averageProcessingTime)}</h3>
                <p>Avg. Processing Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        {analyticsData.recentAnalyses.length > 0 && (
          <div className="recent-analyses">
            <h3>Recent Analyses</h3>
            <div className="analyses-list">
              {analyticsData.recentAnalyses.map((result, index) => {
                // Determine classification based on analysis details or fallback logic
                const getClassification = () => {
                  if (result.analysis_details?.classification) {
                    return result.analysis_details.classification;
                  }
                  if (result.is_deepfake) return 'Deepfake';
                  
                  // Fallback: check probabilities if available
                  const classes = result.analysis_details?.classes;
                  if (classes) {
                    const realProb = classes.real_probability || 0;
                    const aiGenProb = classes.ai_generated_probability || 0;
                    const deepfakeProb = classes.deepfake_probability || 0;
                    
                    if (deepfakeProb > realProb && deepfakeProb > aiGenProb) return 'Deepfake';
                    if (aiGenProb > realProb && aiGenProb > deepfakeProb) return 'AI Generated';
                    return 'Real';
                  }
                  
                  return 'Real';
                };

                const classification = getClassification();
                const cssClass = classification.toLowerCase().replace(' ', '-');

                return (
                  <div key={index} className={`analysis-item ${cssClass}`}>
                    <div className="analysis-indicator">
                      {classification === 'Deepfake' ? (
                        <AlertTriangle size={20} />
                      ) : classification === 'AI Generated' ? (
                        <Shield size={20} />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                    </div>
                    
                    <div className="analysis-content">
                      <div className="analysis-type">
                        {result.media_type.toUpperCase()}
                      </div>
                      <div className="analysis-result">
                        {classification}
                      </div>
                      <div className="analysis-confidence">
                        {formatConfidence(result.confidence)} confidence
                      </div>
                    </div>
                    
                    <div className="analysis-meta">
                      <div className="processing-time">
                        {formatProcessingTime(result.processing_time_ms || 0)}
                      </div>
                      {result.metadata && (
                        <div className="timestamp">
                          {new Date(JSON.parse(result.metadata).analyzedAt || Date.now()).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Data State */}
        {analyticsData.totalScans === 0 && (
          <div className="no-data">
            <BarChart3 className="no-data-icon" size={48} />
            <h3>No Detection Data</h3>
            <p>Start analyzing content to see your detection analytics here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
