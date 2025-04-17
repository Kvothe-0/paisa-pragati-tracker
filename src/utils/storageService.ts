
// Define the structure of our saved data
export interface MoneyTrackerState {
  initialAmount: number;
  interestRate: number;
  timeYears: number;
  isRunning: boolean;
  startTimestamp: number | null;
  currentAmount: number;
}

// Default state
const DEFAULT_STATE: MoneyTrackerState = {
  initialAmount: 100000,
  interestRate: 12,
  timeYears: 5,
  isRunning: false,
  startTimestamp: null,
  currentAmount: 100000
};

// Storage key
const STORAGE_KEY = 'paisa-pragati-tracker-state';

// Save state to localStorage
export const saveState = (state: MoneyTrackerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

// Load state from localStorage
export const loadState = (): MoneyTrackerState => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return DEFAULT_STATE;
    
    return JSON.parse(savedState);
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return DEFAULT_STATE;
  }
};

// Clear saved state
export const clearState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing state from localStorage:', error);
  }
};
