"use client"

import { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { AppwriteException } from 'appwrite';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PasswordStrength {
    text: string;
    color: string;
    score: number;
}

function ResetPasswordContent(): JSX.Element {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get parameters from URL search params
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');
    
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    useEffect(() => {
        if (!userId || !secret) {
            setError('Invalid or expired reset link. Please request a new password reset.');
        }
    }, [userId, secret]);

    const getPasswordStrength = (password: string): PasswordStrength => {
        if (password.length === 0) {
            return { text: '', color: '', score: 0 };
        }
        if (password.length < 6) {
            return { text: 'Too Short', color: 'text-red-600', score: 1 };
        }
        if (password.length < 8) {
            return { text: 'Fair', color: 'text-yellow-600', score: 2 };
        }
        return { text: 'Good', color: 'text-green-600', score: 3 };
    };

    const validatePassword = (): boolean => {
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        
        if (!validatePassword()) return;
        
        setLoading(true);

        try {
            if (!userId || !secret) {
                throw new Error('Invalid reset parameters');
            }

            await account.updateRecovery(
                userId,
                secret,
                password
            );
            
            setSuccess(true);
            
        } catch (error) {
            console.error('Password reset error:', error);
            const appwriteError = error as AppwriteException;
            setError(appwriteError.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
        if (error) setError('');
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setConfirmPassword(e.target.value);
        if (error) setError('');
    };

    const strengthInfo = getPasswordStrength(password);
    const passwordsMatch = password === confirmPassword;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
                <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Password Reset Successful!
                    </h2>
                    <p className="text-gray-600">
                        Your password has been updated successfully.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700">
                            You can now return to the app and login with your new password.
                        </p>
                    </div>
                    <button
                        onClick={() => window.close()}
                        className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create New Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter a new password for your account
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                                    placeholder="Enter new password (min 6 characters)"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L7.05 7.05m0 0l-2.122-2.122m2.122 2.122L7.05 7.05m4.242 4.243L9.878 9.878" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Password strength:</span>
                                        <span className={`text-xs font-medium ${strengthInfo.color}`}>
                                            {strengthInfo.text}
                                        </span>
                                    </div>
                                    <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                strengthInfo.score === 1 ? 'bg-red-500' :
                                                strengthInfo.score === 2 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${(strengthInfo.score / 3) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                                    placeholder="Confirm your new password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showConfirmPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L7.05 7.05m0 0l-2.122-2.122m2.122 2.122L7.05 7.05m4.242 4.243L9.878 9.878" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                            {confirmPassword && (
                                <div className="mt-2">
                                    <div className="flex items-center">
                                        <span className="text-xs text-gray-500 mr-2">Passwords match:</span>
                                        <span className={`text-xs font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            {passwordsMatch ? '✓' : '✗'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !password || !confirmPassword || !passwordsMatch}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 transition duration-200 transform hover:scale-105"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting...
                                </div>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPassword(): JSX.Element {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                    <p className="text-center text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
} 