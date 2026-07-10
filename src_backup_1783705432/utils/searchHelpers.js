// Search and Filtering Helper Functions
import Fuse from 'fuse.js';

export const fuzzySearch = (items, query, keys) => {
  if (!query || !items || items.length === 0) return [];
  
  const fuse = new Fuse(items, {
    keys,
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  });
  
  return fuse.search(query);
};

export const highlightMatches = (text, query) => {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200">$1</mark>');
};

export const saveSearchToHistory = (query, results) => {
  try {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    
    // Don't save duplicate consecutive searches
    if (history.length > 0 && history[0].query === query) return;
    
    history.unshift({
      query,
      resultCount: results.length,
      timestamp: Date.now()
    });
    
    // Keep only last 10 searches
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

export const getSearchHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]');
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
};

export const clearSearchHistory = () => {
  try {
    localStorage.removeItem('searchHistory');
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};

export const saveSearch = (name, query, filters) => {
  try {
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    
    savedSearches.push({
      id: Date.now(),
      name,
      query,
      filters,
      createdAt: Date.now()
    });
    
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    return true;
  } catch (error) {
    console.error('Error saving search:', error);
    return false;
  }
};

export const getSavedSearches = () => {
  try {
    return JSON.parse(localStorage.getItem('savedSearches') || '[]');
  } catch (error) {
    console.error('Error loading saved searches:', error);
    return [];
  }
};

export const deleteSavedSearch = (id) => {
  try {
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const filtered = savedSearches.filter(search => search.id !== id);
    localStorage.setItem('savedSearches', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return false;
  }
};

export const buildQueryFromConditions = (conditions) => {
  // Build a query object from visual query builder conditions
  const query = {};
  
  conditions.forEach(condition => {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case 'equals':
        query[field] = value;
        break;
      case 'contains':
        query[field] = { $regex: value, $options: 'i' };
        break;
      case 'greaterThan':
        query[field] = { $gt: value };
        break;
      case 'lessThan':
        query[field] = { $lt: value };
        break;
      case 'between':
        query[field] = { $gte: value.min, $lte: value.max };
        break;
      default:
        query[field] = value;
    }
  });
  
  return query;
};

export const executeQuery = (items, conditions, logic = 'AND') => {
  if (!conditions || conditions.length === 0) return items;
  
  return items.filter(item => {
    const results = conditions.map(condition => {
      const { field, operator, value } = condition;
      const itemValue = item[field];
      
      switch (operator) {
        case 'equals':
          return itemValue === value;
        case 'contains':
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        case 'greaterThan':
          return Number(itemValue) > Number(value);
        case 'lessThan':
          return Number(itemValue) < Number(value);
        case 'greaterThanOrEqual':
          return Number(itemValue) >= Number(value);
        case 'lessThanOrEqual':
          return Number(itemValue) <= Number(value);
        case 'between':
          return Number(itemValue) >= Number(value.min) && Number(itemValue) <= Number(value.max);
        case 'startsWith':
          return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'endsWith':
          return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'isEmpty':
          return !itemValue || itemValue === '';
        case 'isNotEmpty':
          return itemValue && itemValue !== '';
        default:
          return true;
      }
    });
    
    return logic === 'AND' ? results.every(r => r) : results.some(r => r);
  });
};

export const getSearchSuggestions = (query, items, fields) => {
  if (!query || query.length < 2) return [];
  
  const suggestions = new Set();
  const lowerQuery = query.toLowerCase();
  
  items.forEach(item => {
    fields.forEach(field => {
      const value = String(item[field] || '');
      if (value.toLowerCase().includes(lowerQuery)) {
        suggestions.add(value);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 5);
};
