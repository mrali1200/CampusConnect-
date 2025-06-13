const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// User details
const userData = {
  email: 'prince.sonu590@gmail.com',
  password: 'Password1',
  fullName: 'Sonu Qazi',
  role: 'user'
};

// Initialize Supabase Admin Client (using service role key for admin operations)
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Using service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createUser() {
  console.log('Starting user creation process...');
  
  try {
    // Step 1: Create auth user
    console.log('1. Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: userData.fullName
      },
      // Required fields for user creation
      user: {
        email: userData.email,
        password: userData.password,
        user_metadata: {
          full_name: userData.fullName
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('User already exists in auth.users. Fetching user ID...');
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === userData.email);
        if (user) {
          await createProfile(user.id);
          return;
        }
      }
      throw authError;
    }

    if (!authData.user) throw new Error('No user data returned from auth creation');
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Step 2: Create profile
    await createProfile(authData.user.id);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

async function createProfile(userId) {
  try {
    console.log('2. Creating user profile...');
    
    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw fetchError;
    }

    if (existingProfile) {
      console.log('ℹ️ Profile already exists, updating...');
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role,
        updated_at: new Date().toISOString(),
        ...(!existingProfile && { created_at: new Date().toISOString() })
      })
      .select();

    if (profileError) throw profileError;
    
    console.log('✅ Profile created/updated successfully:', profileData);
    console.log('\n🎉 User setup complete!');
    console.log('Email:', userData.email);
    console.log('Password:', userData.password);
    console.log('Role:', userData.role);
    
  } catch (error) {
    console.error('❌ Error creating profile:', error.message);
    throw error;
  }
}

// Run the script
createUser();
