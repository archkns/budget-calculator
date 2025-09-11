const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function checkDatabaseTables() {
  console.log('🔍 Checking Database Tables...\n');

  // Test each table by trying to fetch data
  const tables = [
    { name: 'roles', endpoint: '/roles' },
    { name: 'team_members', endpoint: '/team' },
    { name: 'projects', endpoint: '/projects' },
    { name: 'rate_cards', endpoint: '/rate-cards' },
    { name: 'public_holidays', endpoint: '/holidays' },
    { name: 'project_assignments', endpoint: '/projects/1/assignments' }
  ];

  for (const table of tables) {
    try {
      const response = await fetch(`${BASE_URL}${table.endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${table.name}: OK (${Array.isArray(data) ? data.length : '1'} records)`);
      } else {
        console.log(`❌ ${table.name}: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${table.name}: ${error.message}`);
    }
  }

  console.log('\n📊 Database check completed!');
}

checkDatabaseTables().catch(console.error);
