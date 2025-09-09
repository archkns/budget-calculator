const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    if (data.length !== undefined) {
      console.log(`   Response: ${data.length} items`);
    } else if (data.error) {
      console.log(`   Error: ${data.error}`);
    } else {
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');

  // Test basic endpoints
  await testEndpoint('/roles');
  await testEndpoint('/team');
  await testEndpoint('/projects');
  await testEndpoint('/rate-cards');
  await testEndpoint('/holidays');

  console.log('\n📝 Testing CRUD Operations...\n');

  // Test creating a role
  const roleResult = await testEndpoint('/roles', 'POST', {
    name: 'Test Role'
  });

  if (roleResult.success) {
    const roleId = roleResult.data.id;
    console.log(`   Created role with ID: ${roleId}`);
  }

  // Test creating a team member
  const teamMemberResult = await testEndpoint('/team', 'POST', {
    name: 'Test Member',
    default_rate_per_day: 1000,
    status: 'ACTIVE'
  });

  if (teamMemberResult.success) {
    const memberId = teamMemberResult.data.id;
    console.log(`   Created team member with ID: ${memberId}`);
  }

  // Test creating a project
  const projectResult = await testEndpoint('/projects', 'POST', {
    name: 'Test Project',
    client: 'Test Client',
    currency_code: 'THB',
    currency_symbol: '฿'
  });

  if (projectResult.success) {
    const projectId = projectResult.data.id;
    console.log(`   Created project with ID: ${projectId}`);
  }

  console.log('\n✅ API testing completed!');
  console.log('\nNote: If you see "Supabase not configured" warnings,');
  console.log('make sure to set up your .env.local file with Supabase credentials.');
}

// Check if the server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Development server is running\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Development server is not running');
    console.log('Please start the server with: npm run dev\n');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
