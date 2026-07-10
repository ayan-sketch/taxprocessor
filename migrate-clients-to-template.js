/**
 * Migration Script: Update existing client data to match template format
 * Run this script to migrate clientsData.json to the new template structure
 */

const fs = require('fs');
const path = require('path');

// Read existing client data
const clientsDataPath = path.join(__dirname, 'src', 'clientsData.json');
const backupPath = path.join(__dirname, 'src', `clientsData.backup.${Date.now()}.json`);

console.log('🔄 Starting client data migration to template format...\n');

try {
  // Read current data
  const currentData = JSON.parse(fs.readFileSync(clientsDataPath, 'utf8'));
  console.log(`📊 Found ${currentData.length} clients to migrate\n`);

  // Create backup
  fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2));
  console.log(`✅ Backup created: ${backupPath}\n`);

  // Migration function
  const migrateClient = (oldClient) => {
    return {
      id: oldClient.id,
      fileNo: oldClient.fileNo || '',
      ntn: oldClient.ntn || '',
      name: oldClient.name || '',
      cnic: oldClient.cnic || '',
      irisPin: oldClient.irisPin || '',
      irisPassword: oldClient.irisPassword || '',
      email: oldClient.email || '',
      emailPassword: oldClient.emailPassword || '',
      phone: oldClient.phone || '',
      address: oldClient.address || '',
      city: oldClient.city || '',
      person: oldClient.person || 'Individual',
      sourceOfIncome: oldClient.sourceOfIncome || '',
      businessClassification: oldClient.businessClassification || '',
      status: oldClient.status || 'Active',
      taxYear: oldClient.taxYear || new Date().getFullYear().toString(),
      // Keep additional fields
      returns: oldClient.returns || 0,
      totalRevenue: oldClient.totalRevenue || '$0',
      lastContact: oldClient.lastContact || new Date().toISOString().split('T')[0],
      notes: oldClient.notes || '',
      tags: oldClient.tags || [],
      assignedTo: oldClient.assignedTo || 'Admin User',
      avatar: oldClient.avatar || null,
      timeline: oldClient.timeline || []
    };
  };

  // Migrate all clients
  const migratedData = currentData.map((client, index) => {
    console.log(`Migrating ${index + 1}/${currentData.length}: ${client.name || 'Unnamed'}`);
    return migrateClient(client);
  });

  // Write migrated data
  fs.writeFileSync(clientsDataPath, JSON.stringify(migratedData, null, 2));
  console.log(`\n✅ Successfully migrated ${migratedData.length} clients`);
  console.log(`📁 Updated file: ${clientsDataPath}`);
  console.log(`\n✨ Migration complete! All client data now matches the template format.`);

  // Show summary
  console.log('\n📋 Template Field Mapping:');
  console.log('  FILE NO → fileNo');
  console.log('  NEW NTN → ntn');
  console.log('  TITLE OF THE CASE * → name');
  console.log('  NIC NO (CNIC) → cnic');
  console.log('  PIN (IRIS) → irisPin');
  console.log('  PASSWORD (IRIS) → irisPassword');
  console.log('  MAIL → email');
  console.log('  PASSWORD (MAIL) → emailPassword');
  console.log('  PHONE → phone');
  console.log('  ADDRESS → address');
  console.log('  CITY → city');
  console.log('  PERSON → person');
  console.log('  SOURCE OF INCOME → sourceOfIncome');
  console.log('  BUSINESS CLASSIFICATION → businessClassification');
  console.log('  STATUS → status');
  console.log('  TAX YEAR → taxYear');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('\nIf you need to restore, use the backup file created.');
  process.exit(1);
}
