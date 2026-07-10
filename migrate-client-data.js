/**
 * Client Data Migration Script
 * Updates existing clientsData.json to match the Excel template structure
 * 
 * Template Structure (16 fields):
 * 1. FILE NO
 * 2. NEW NTN
 * 3. TITLE OF THE CASE * (name)
 * 4. NIC NO (CNIC)
 * 5. PIN (IRIS)
 * 6. PASSWORD (IRIS)
 * 7. MAIL
 * 8. PASSWORD (MAIL) - NEW
 * 9. PHONE
 * 10. ADDRESS
 * 11. CITY - NEW (from location)
 * 12. PERSON - NEW (from businessType)
 * 13. SOURCE OF INCOME - NEW (from businessType)
 * 14. BUSINESS CLASSIFICATION - NEW
 * 15. STATUS
 * 16. TAX YEAR - NEW
 */

const fs = require('fs');
const path = require('path');

// Backup original file
const backupFile = () => {
  const originalPath = path.join(__dirname, 'src', 'clientsData.json');
  const backupPath = path.join(__dirname, 'src', `clientsData.backup.${Date.now()}.json`);
  
  console.log('📦 Creating backup...');
  fs.copyFileSync(originalPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
  return backupPath;
};

// Map old businessType to new PERSON and SOURCE OF INCOME
const mapBusinessType = (oldBusinessType) => {
  const type = (oldBusinessType || '').toLowerCase().trim();
  
  // Mapping logic based on template
  const mappings = {
    'individual': { person: 'Individual', sourceOfIncome: 'Salary' },
    'business': { person: 'Individual', sourceOfIncome: 'Business' },
    'self-employed': { person: 'Individual', sourceOfIncome: 'Freelancer' },
    'partnership': { person: 'AOP', sourceOfIncome: 'AOP' },
    'corporation': { person: 'Company', sourceOfIncome: 'Company' },
    'company': { person: 'Company', sourceOfIncome: 'Company' },
    'property owner': { person: 'Individual', sourceOfIncome: 'Property' },
    'professional': { person: 'Individual', sourceOfIncome: 'Salary' },
    'aop': { person: 'AOP', sourceOfIncome: 'AOP' },
  };
  
  // Check for exact matches
  if (mappings[type]) {
    return mappings[type];
  }
  
  // Check for partial matches
  if (type.includes('company') || type.includes('corporation')) {
    return { person: 'Company', sourceOfIncome: 'Company' };
  }
  if (type.includes('partnership') || type.includes('aop')) {
    return { person: 'AOP', sourceOfIncome: 'AOP' };
  }
  if (type.includes('property')) {
    return { person: 'Individual', sourceOfIncome: 'Property' };
  }
  if (type.includes('business')) {
    return { person: 'Individual', sourceOfIncome: 'Business' };
  }
  
  // Default to Individual with Business
  return { person: 'Individual', sourceOfIncome: 'Business' };
};

// Determine tax year (default to current year)
const determineTaxYear = (lastContact) => {
  if (!lastContact) return '2025';
  
  try {
    const year = new Date(lastContact).getFullYear();
    // If year is valid and between 2020-2026, use it
    if (year >= 2020 && year <= 2026) {
      return year.toString();
    }
  } catch (e) {
    // Invalid date, use default
  }
  
  return '2025'; // Default tax year
};

// Migrate single client record
const migrateClient = (client) => {
  const { person, sourceOfIncome } = mapBusinessType(client.businessType);
  
  return {
    // Keep existing fields that are still needed
    id: client.id,
    fileNo: client.fileNo || '',
    ntn: client.ntn || '',
    name: client.name || '', // TITLE OF THE CASE
    cnic: client.cnic || '', // NIC NO
    irisPin: client.irisPin || '', // PIN (IRIS)
    irisPassword: client.irisPassword || '', // PASSWORD (IRIS)
    email: client.email || '', // MAIL
    emailPassword: '', // NEW: PASSWORD (MAIL) - empty by default for security
    phone: client.phone || '',
    address: client.address || '',
    
    // NEW FIELDS from template
    city: client.location || '', // CITY (from location)
    person: person, // PERSON (Company/AOP/Individual)
    sourceOfIncome: sourceOfIncome, // SOURCE OF INCOME
    businessClassification: client.businessName || '', // BUSINESS CLASSIFICATION (use old businessName)
    
    // Existing fields
    status: client.status || 'Active',
    taxYear: determineTaxYear(client.lastContact), // NEW: TAX YEAR
    
    // Keep application-specific fields (not in Excel template but needed for app)
    returns: client.returns || 0,
    totalRevenue: client.totalRevenue || '$0',
    lastContact: client.lastContact || '',
    notes: client.notes || '',
    tags: client.tags || [],
    assignedTo: client.assignedTo || 'Admin User',
    avatar: client.avatar || null,
    timeline: client.timeline || []
  };
};

// Main migration function
const migrateData = () => {
  console.log('🚀 Starting Client Data Migration...\n');
  
  try {
    // 1. Backup original file
    const backupPath = backupFile();
    
    // 2. Read original data
    console.log('\n📖 Reading original data...');
    const originalPath = path.join(__dirname, 'src', 'clientsData.json');
    const originalData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
    console.log(`✅ Found ${originalData.length} client records`);
    
    // 3. Migrate each record
    console.log('\n🔄 Migrating records...');
    const migratedData = originalData.map((client, index) => {
      if ((index + 1) % 100 === 0) {
        console.log(`   Processed ${index + 1}/${originalData.length} records...`);
      }
      return migrateClient(client);
    });
    
    // 4. Validate migration
    console.log('\n✔️  Validating migration...');
    const validationErrors = [];
    migratedData.forEach((client, index) => {
      if (!client.name) {
        validationErrors.push(`Record ${index + 1} (ID: ${client.id}): Missing required field 'name'`);
      }
      if (!client.person || !['Company', 'AOP', 'Individual'].includes(client.person)) {
        validationErrors.push(`Record ${index + 1} (ID: ${client.id}): Invalid person type '${client.person}'`);
      }
      if (!client.status || !['Active', 'Inactive', 'Pending'].includes(client.status)) {
        validationErrors.push(`Record ${index + 1} (ID: ${client.id}): Invalid status '${client.status}'`);
      }
    });
    
    if (validationErrors.length > 0) {
      console.log(`\n⚠️  Found ${validationErrors.length} validation warnings:`);
      validationErrors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
      if (validationErrors.length > 10) {
        console.log(`   ... and ${validationErrors.length - 10} more`);
      }
    } else {
      console.log('✅ All records validated successfully');
    }
    
    // 5. Write migrated data
    console.log('\n💾 Writing migrated data...');
    fs.writeFileSync(originalPath, JSON.stringify(migratedData, null, 2), 'utf8');
    console.log('✅ Migration completed successfully!');
    
    // 6. Generate migration report
    console.log('\n📊 MIGRATION REPORT:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Records Migrated: ${migratedData.length}`);
    console.log(`Backup Location: ${backupPath}`);
    console.log('\nNEW FIELDS ADDED:');
    console.log('  ✓ emailPassword (PASSWORD MAIL) - empty by default');
    console.log('  ✓ city (CITY) - migrated from location');
    console.log('  ✓ person (PERSON) - derived from businessType');
    console.log('  ✓ sourceOfIncome (SOURCE OF INCOME) - derived from businessType');
    console.log('  ✓ businessClassification (BUSINESS CLASSIFICATION) - from businessName');
    console.log('  ✓ taxYear (TAX YEAR) - derived from lastContact');
    
    console.log('\nFIELDS REMOVED/RENAMED:');
    console.log('  ✗ businessName → moved to businessClassification');
    console.log('  ✗ businessType → split into person + sourceOfIncome');
    console.log('  ✗ location → renamed to city');
    
    console.log('\nPERSON TYPE DISTRIBUTION:');
    const personCounts = migratedData.reduce((acc, client) => {
      acc[client.person] = (acc[client.person] || 0) + 1;
      return acc;
    }, {});
    Object.entries(personCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${((count/migratedData.length)*100).toFixed(1)}%)`);
    });
    
    console.log('\nSOURCE OF INCOME DISTRIBUTION:');
    const incomeCounts = migratedData.reduce((acc, client) => {
      acc[client.sourceOfIncome] = (acc[client.sourceOfIncome] || 0) + 1;
      return acc;
    }, {});
    Object.entries(incomeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${((count/migratedData.length)*100).toFixed(1)}%)`);
    });
    
    console.log('\nSTATUS DISTRIBUTION:');
    const statusCounts = migratedData.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} (${((count/migratedData.length)*100).toFixed(1)}%)`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Migration completed successfully!');
    console.log('📝 Original data backed up before migration');
    console.log('🎯 All records now match Excel template structure');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData, migrateClient, mapBusinessType };
