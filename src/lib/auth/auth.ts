import { Client, Account, Models } from 'appwrite';

import {account} from "../appwrite"

// Function to log in a user
export const login = async (email: string, password: string): Promise<Models.Session> => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Function to get the current user
export const getCurrentUser = async (): Promise<Models.User<Models.Preferences> | null> => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
};

// Function to log out a user
export const logout = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};