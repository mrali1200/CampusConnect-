import { v4 as uuidv4 } from 'uuid';
import { storage } from '../lib/storage';

async function createAdminUser() {
  try {
    const adminUser = {
      id: uuidv4(),
      email: 'qadirdadkazi@gmail.com',
      fullName: 'Qadirdad Kazi',
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };

    // Save user to storage
    await storage.setUser(adminUser);
    
    // Create a simple token (in a real app, use JWT or similar)
    const token = `admin-token-${Date.now()}`;
    await storage.setToken(token);

    // Add user to users list in storage
    const users = await storage.getData<Array<any>>('users') || [];    
    const userExists = users.some((u: any) => u.email === adminUser.email);
    
    if (!userExists) {
      users.push({
        ...adminUser,
        password: 'Password1', // In a real app, hash the password
      });
      await storage.setData('users', users);
    }

    console.log('Admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Password: Password1');
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Run the function
createAdminUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
