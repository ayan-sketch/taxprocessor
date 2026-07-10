/**
 * Detect duplicate tax returns based on CNIC/NTN and tax year
 * @param {Array} returns - Array of tax return objects
 * @returns {Object} - Object containing duplicates grouped by key
 */
export function detectDuplicates(returns) {
  const duplicateMap = new Map();
  const duplicates = [];

  if (!returns || !Array.isArray(returns)) {
    return {
      hasDuplicates: false,
      duplicateCount: 0,
      duplicates: []
    };
  }

  returns.forEach((ret, index) => {
    const key = `${ret.cnicNtn}-${ret.taxYear}`;
    
    if (!ret.cnicNtn || !ret.taxYear) {
      return; // Skip incomplete records
    }

    if (duplicateMap.has(key)) {
      const existing = duplicateMap.get(key);
      
      // Add to duplicates array if not already added
      if (!duplicates.find(d => d.key === key)) {
        duplicates.push({
          key,
          cnicNtn: ret.cnicNtn,
          taxYear: ret.taxYear,
          name: ret.name,
          count: 2,
          records: [existing, { ...ret, index }]
        });
      } else {
        // Add to existing duplicate group
        const dupGroup = duplicates.find(d => d.key === key);
        dupGroup.records.push({ ...ret, index });
        dupGroup.count++;
      }
    } else {
      duplicateMap.set(key, { ...ret, index });
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicateCount: duplicates.length,
    duplicates
  };
}

/**
 * Check if a new return would be a duplicate
 * @param {Object} newReturn - New return object to check
 * @param {Array} existingReturns - Array of existing returns
 * @returns {Object} - Duplicate check result
 */
export function checkForDuplicate(newReturn, existingReturns) {
  const key = `${newReturn.cnicNtn}-${newReturn.taxYear}`;
  
  const duplicates = existingReturns.filter(ret => 
    ret.cnicNtn === newReturn.cnicNtn && 
    ret.taxYear === newReturn.taxYear
  );

  return {
    isDuplicate: duplicates.length > 0,
    duplicateCount: duplicates.length,
    existingRecords: duplicates,
    key
  };
}

/**
 * Merge duplicate returns with conflict resolution
 * @param {Array} duplicateRecords - Array of duplicate records to merge
 * @param {Object} resolutionStrategy - Strategy for resolving conflicts
 * @returns {Object} - Merged record
 */
export function mergeDuplicates(duplicateRecords, resolutionStrategy = {}) {
  if (!duplicateRecords || duplicateRecords.length === 0) {
    throw new Error('No records to merge');
  }

  if (duplicateRecords.length === 1) {
    return duplicateRecords[0];
  }

  // Default strategy: keep most recent, prefer non-empty values
  const merged = { ...duplicateRecords[0] };

  // Sort by processed date (most recent first)
  const sorted = [...duplicateRecords].sort((a, b) => {
    const dateA = new Date(a.processedDate || a.filingDate || 0);
    const dateB = new Date(b.processedDate || b.filingDate || 0);
    return dateB - dateA;
  });

  // Merge fields based on strategy
  const fields = [
    'name', 'cnicNtn', 'taxYear', 'status', 'incomeAmount', 
    'taxPaid', 'refundAmount', 'filingDate', 'deadline',
    'email', 'phone', 'address', 'notes', 'filePath'
  ];

  fields.forEach(field => {
    const strategy = resolutionStrategy[field] || 'keepMostRecent';

    switch (strategy) {
      case 'keepMostRecent':
        // Use value from most recent record that has a value
        for (const record of sorted) {
          if (record[field]) {
            merged[field] = record[field];
            break;
          }
        }
        break;

      case 'keepFirst':
        // Use value from first record that has a value
        for (const record of duplicateRecords) {
          if (record[field]) {
            merged[field] = record[field];
            break;
          }
        }
        break;

      case 'keepLargest':
        // Use largest numeric value
        const values = duplicateRecords
          .map(r => parseFloat(r[field]) || 0)
          .filter(v => v > 0);
        if (values.length > 0) {
          merged[field] = Math.max(...values).toString();
        }
        break;

      case 'concatenate':
        // Concatenate all unique values
        const uniqueValues = [...new Set(
          duplicateRecords
            .map(r => r[field])
            .filter(v => v)
        )];
        merged[field] = uniqueValues.join('; ');
        break;

      case 'manual':
        // Keep as-is for manual resolution
        break;

      default:
        // Default: keep most recent
        for (const record of sorted) {
          if (record[field]) {
            merged[field] = record[field];
            break;
          }
        }
    }
  });

  // Add merge metadata
  merged.mergedFrom = duplicateRecords.map(r => r.index || r.id);
  merged.mergedAt = new Date().toISOString();
  merged.mergeCount = duplicateRecords.length;

  return merged;
}

/**
 * Get suggested resolution for duplicate fields
 * @param {Array} duplicateRecords - Array of duplicate records
 * @returns {Object} - Suggested values for each field
 */
export function getSuggestedResolution(duplicateRecords) {
  if (!duplicateRecords || duplicateRecords.length === 0) {
    return {};
  }

  const suggestions = {};
  const fields = [
    'name', 'cnicNtn', 'taxYear', 'status', 'incomeAmount', 
    'taxPaid', 'refundAmount', 'filingDate', 'deadline',
    'email', 'phone', 'address', 'notes'
  ];

  fields.forEach(field => {
    const values = duplicateRecords
      .map(r => r[field])
      .filter(v => v);

    if (values.length === 0) {
      suggestions[field] = { value: '', confidence: 'none', options: [] };
      return;
    }

    // Check if all values are the same
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 1) {
      suggestions[field] = {
        value: uniqueValues[0],
        confidence: 'high',
        options: uniqueValues,
        reason: 'All records have the same value'
      };
    } else {
      // Multiple different values - suggest most recent
      const sorted = [...duplicateRecords].sort((a, b) => {
        const dateA = new Date(a.processedDate || a.filingDate || 0);
        const dateB = new Date(b.processedDate || b.filingDate || 0);
        return dateB - dateA;
      });

      const mostRecent = sorted.find(r => r[field]);
      
      suggestions[field] = {
        value: mostRecent?.[field] || uniqueValues[0],
        confidence: 'medium',
        options: uniqueValues,
        reason: 'Using most recent value (manual review recommended)'
      };
    }
  });

  return suggestions;
}
