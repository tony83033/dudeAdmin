"use client"

import { useState, FormEvent, Suspense } from 'react';
import { account } from '@/lib/appwrite';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppwriteException } from 'appwrite';

export const dynamic = 'force-dynamic';

function ForgotPasswordContent() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirect = searchParams.get('redirect');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await account.createRecovery(
                email,
                `${window.location.origin}/reset-password`
            );
            
            setMessage('Password reset link has been sent to your email!');
            setEmail('');
            
        } catch (error) {
            console.error('Recovery email error:', error);
            const appwriteError = error as AppwriteException;
            setError(appwriteError.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter your email address"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                            <p className="text-sm text-green-700">{message}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ForgotPassword() {
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
            <ForgotPasswordContent />
        </Suspense>
    );
}

