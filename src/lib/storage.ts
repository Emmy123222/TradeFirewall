import type { DataSourcesReport } from '@/lib/riskEngine';

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
  source: 'risk-report' | 'manual';
  latestRiskScore?: number;
  latestDecision?: string;
  alertCondition?: string;
  notes?: string;
}

export interface SavedReport {
  id: string;
  symbol: string;
  action: string;
  amount: number;
  holdingPeriod: string;
  riskProfile: string;
  riskScore: number;
  decision: string;
  riskFactors: any;
  explanation: string;
  recommendedAction: string;
  suggestedPositionSize: string;
  dataSourcesUsed: string[];
  dataSourcesReport?: DataSourcesReport;
  createdAt: number;
  status?: 'completed' | 'cancelled';
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  defaultRiskProfile: string;
}

class StorageManager {
  private readonly REPORTS_KEY = 'tradefirewall_reports';
  private readonly WATCHLIST_KEY = 'tradefirewall_watchlist';
  private readonly SETTINGS_KEY = 'tradefirewall_settings';

  // Watchlist Management
  getWatchlist(): WatchlistItem[] {
    try {
      const data = localStorage.getItem(this.WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading watchlist:', error);
      return [];
    }
  }

  addToWatchlist(item: Omit<WatchlistItem, 'addedAt'>): { success: boolean; message: string } {
    try {
      const watchlist = this.getWatchlist();
      
      // Check for duplicates
      const exists = watchlist.some(w => w.symbol === item.symbol);
      if (exists) {
        return { success: false, message: `${item.symbol} is already in your watchlist.` };
      }

      const newItem: WatchlistItem = {
        ...item,
        addedAt: Date.now()
      };

      watchlist.push(newItem);
      localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(watchlist));
      
      return { success: true, message: `${item.symbol} added to watchlist.` };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, message: 'Unable to add to watchlist.' };
    }
  }

  removeFromWatchlist(symbol: string): { success: boolean; message: string } {
    try {
      const watchlist = this.getWatchlist();
      const filtered = watchlist.filter(w => w.symbol !== symbol);
      
      if (filtered.length === watchlist.length) {
        return { success: false, message: `${symbol} not found in watchlist.` };
      }

      localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(filtered));
      return { success: true, message: `${symbol} removed from watchlist.` };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return { success: false, message: 'Unable to remove from watchlist.' };
    }
  }

  updateWatchlistItem(symbol: string, updates: Partial<WatchlistItem>): void {
    try {
      const watchlist = this.getWatchlist();
      const index = watchlist.findIndex(w => w.symbol === symbol);
      
      if (index !== -1) {
        watchlist[index] = { ...watchlist[index], ...updates };
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(watchlist));
      }
    } catch (error) {
      console.error('Error updating watchlist item:', error);
    }
  }

  // Reports Management
  getReports(): SavedReport[] {
    try {
      const data = localStorage.getItem(this.REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  saveReport(report: Omit<SavedReport, 'id' | 'createdAt'>): { success: boolean; message: string; reportId?: string } {
    try {
      const reports = this.getReports();
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newReport: SavedReport = {
        ...report,
        id: reportId,
        createdAt: Date.now(),
        status: 'completed'
      };

      reports.unshift(newReport); // Add to beginning
      localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
      
      return { success: true, message: 'Risk report saved.', reportId };
    } catch (error) {
      console.error('Error saving report:', error);
      return { success: false, message: 'Unable to save report.' };
    }
  }

  getReport(id: string): SavedReport | null {
    try {
      const reports = this.getReports();
      return reports.find(r => r.id === id) || null;
    } catch (error) {
      console.error('Error getting report:', error);
      return null;
    }
  }

  updateReportStatus(id: string, status: 'completed' | 'cancelled'): void {
    try {
      const reports = this.getReports();
      const index = reports.findIndex(r => r.id === id);
      
      if (index !== -1) {
        reports[index].status = status;
        localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  }

  deleteReport(id: string): { success: boolean; message: string } {
    try {
      const reports = this.getReports();
      const filtered = reports.filter(r => r.id !== id);
      
      if (filtered.length === reports.length) {
        return { success: false, message: 'Report not found.' };
      }

      localStorage.setItem(this.REPORTS_KEY, JSON.stringify(filtered));
      return { success: true, message: 'Report deleted.' };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { success: false, message: 'Unable to delete report.' };
    }
  }

  // Settings Management
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        theme: 'light',
        notifications: true,
        defaultRiskProfile: 'balanced'
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        theme: 'light',
        notifications: true,
        defaultRiskProfile: 'balanced'
      };
    }
  }

  updateSettings(updates: Partial<UserSettings>): void {
    try {
      const settings = this.getSettings();
      const newSettings = { ...settings, ...updates };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Utility Methods
  clearAllData(): void {
    try {
      localStorage.removeItem(this.REPORTS_KEY);
      localStorage.removeItem(this.WATCHLIST_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  exportData(): string {
    try {
      const data = {
        reports: this.getReports(),
        watchlist: this.getWatchlist(),
        settings: this.getSettings(),
        exportedAt: Date.now()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  importData(jsonData: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.reports) {
        localStorage.setItem(this.REPORTS_KEY, JSON.stringify(data.reports));
      }
      if (data.watchlist) {
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(data.watchlist));
      }
      if (data.settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
      }
      
      return { success: true, message: 'Data imported successfully.' };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, message: 'Invalid data format.' };
    }
  }
}

export const storageManager = new StorageManager();