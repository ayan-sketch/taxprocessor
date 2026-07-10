import json

# Read existing client data
with open('src/clientsData.json', 'r', encoding='utf-8') as f:
    clients = json.load(f)

print(f"Total clients to migrate: {len(clients)}")

# Template field structure
TEMPLATE_FIELDS = {
    'fileNo': 'FILE NO',
    'ntn': 'NEW NTN',
    'name': 'TITLE OF THE CASE *',
    'cnic': 'NIC NO (CNIC)',
    'irisPin': 'PIN (IRIS)',
    'irisPassword': 'PASSWORD (IRIS)',
    'email': 'MAIL',
    'emailPassword': 'PASSWORD (MAIL)',
    'phone': 'PHONE',
    'address': 'ADDRESS',
    'city': 'CITY',
    'person': 'PERSON',
    'sourceOfIncome': 'SOURCE OF INCOME',
    'businessClassification': 'BUSINESS CLASSIFICATION',
    'status': 'STATUS',
    'taxYear': 'TAX YEAR'
}

# Ensure all clients have the correct structure
migrated_clients = []
issues = []

for idx, client in enumerate(clients, 1):
    migrated_client = {}
    
    # Core fields from template
    migrated_client['id'] = client.get('id', idx)
    migrated_client['fileNo'] = str(client.get('fileNo', '')).strip()
    migrated_client['ntn'] = str(client.get('ntn', '')).strip()
    migrated_client['name'] = str(client.get('name', '')).strip()
    migrated_client['cnic'] = str(client.get('cnic', '')).strip()
    migrated_client['irisPin'] = str(client.get('irisPin', '')).strip()
    migrated_client['irisPassword'] = str(client.get('irisPassword', '')).strip()
    migrated_client['email'] = str(client.get('email', '')).strip()
    migrated_client['emailPassword'] = str(client.get('emailPassword', '')).strip()
    migrated_client['phone'] = str(client.get('phone', '')).strip()
    migrated_client['address'] = str(client.get('address', '')).strip()
    migrated_client['city'] = str(client.get('city', '')).strip()
    migrated_client['person'] = str(client.get('person', 'Individual')).strip()
    migrated_client['sourceOfIncome'] = str(client.get('sourceOfIncome', '')).strip()
    migrated_client['businessClassification'] = str(client.get('businessClassification', '')).strip()
    migrated_client['status'] = str(client.get('status', 'Active')).strip()
    migrated_client['taxYear'] = str(client.get('taxYear', '2026')).strip()
    
    # Additional fields for internal use (not in template)
    migrated_client['returns'] = client.get('returns', 0)
    migrated_client['totalRevenue'] = client.get('totalRevenue', '$0')
    migrated_client['lastContact'] = client.get('lastContact', '2026-05-22')
    migrated_client['notes'] = client.get('notes', '')
    migrated_client['tags'] = client.get('tags', [])
    migrated_client['assignedTo'] = client.get('assignedTo', 'Admin User')
    migrated_client['avatar'] = client.get('avatar', None)
    migrated_client['timeline'] = client.get('timeline', [])
    
    # Validation
    if not migrated_client['name']:
        issues.append(f"Client ID {migrated_client['id']}: Missing name (TITLE OF THE CASE)")
    
    # Validate person type
    valid_person_types = ['Company', 'AOP', 'Individual']
    if migrated_client['person'] not in valid_person_types:
        issues.append(f"Client ID {migrated_client['id']}: Invalid person type '{migrated_client['person']}', defaulting to 'Individual'")
        migrated_client['person'] = 'Individual'
    
    # Validate status
    valid_statuses = ['Active', 'Inactive', 'Pending']
    if migrated_client['status'] not in valid_statuses:
        issues.append(f"Client ID {migrated_client['id']}: Invalid status '{migrated_client['status']}', defaulting to 'Active'")
        migrated_client['status'] = 'Active'
    
    migrated_clients.append(migrated_client)

# Create backup
with open('src/clientsData.backup.' + str(int(1716361786394)) + '.json', 'w', encoding='utf-8') as f:
    json.dump(clients, f, indent=2, ensure_ascii=False)

# Save migrated data
with open('src/clientsData.json', 'w', encoding='utf-8') as f:
    json.dump(migrated_clients, f, indent=2, ensure_ascii=False)

print(f"\n✓ Migration completed!")
print(f"✓ Migrated {len(migrated_clients)} clients")
print(f"✓ Backup saved to: src/clientsData.backup.{int(1716361786394)}.json")

if issues:
    print(f"\n⚠ Issues found during migration:")
    for issue in issues[:10]:  # Show first 10 issues
        print(f"  - {issue}")
    if len(issues) > 10:
        print(f"  ... and {len(issues) - 10} more issues")
else:
    print("\n✓ No issues found!")

print("\nMigration summary:")
print(f"  - All clients now match template structure")
print(f"  - Template fields: {len(TEMPLATE_FIELDS)}")
print(f"  - Additional internal fields: 8")
