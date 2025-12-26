import { describe, it, expect, beforeEach } from 'vitest';
import { storeAuthToken, getAuthToken, clearAuthData } from './auth';

describe('Auth Utils', () => {
    beforeEach(() => {
        // Clear storage before each test
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should NOT store auth token in localStorage (cookie based)', () => {
        storeAuthToken();

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(sessionStorage.getItem('auth_token')).toBeNull();
    });

    it('should return null for getAuthToken (cookie based)', () => {
        localStorage.setItem('auth_token', 'old-token');
        expect(getAuthToken()).toBeNull();
    });

    it('should clear user data', () => {
        localStorage.setItem('user_data', 'delete-me-too');

        clearAuthData();

        expect(localStorage.getItem('user_data')).toBeNull();
    });
});
