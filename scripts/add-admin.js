const { v4: uuidv4 } = require('uuid');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Simple storage implementation for the script
const storage = {
  async setUser(user) {
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user:', error);
      throw error;
    }
  },
  
  async setToken(token) {
    try {
      await AsyncStorage.setItem('@token', token);
    } catch (error) {
      console.error('Error setting token:', error);
      throw error;
    }
  },
  
  async getData(key) {
    try {
      const data = await AsyncStorage.getItem(`@data_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting data:', error);
      return [];
    }
  },
  
  async setData(key, data) {
    try {
      await AsyncStorage.setItem(`@data_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting data:', error);
      throw error;
    }
  }
}

async function createAdminUser() {
  try {
    const adminUser = {
      id: uuidv4(),
      email: 'qadirdadkazi@gmail.com',
      fullName: 'Qadirdad Kazi',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    // Save user to storage
    await storage.setUser(adminUser);
    
    // Create a simple token
    const token = `admin-token-${Date.now()}`;
    await storage.setToken(token);

    // Add user to users list in storage
    const users = (await storage.getData('users')) || [];
    const userExists = users.some(u => u.email === adminUser.email);
    
    if (!userExists) {
      users.push({
        ...adminUser,
        password: 'Password1', // In a real app, hash the password
      });
      await storage.setData('users', users);
    }

    console.log('🎉 Admin user created successfully!');
    console.log('👉 Email:', adminUser.email);
    console.log('🔑 Password: Password1');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run the function
createAdminUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
