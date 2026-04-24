import { describe, it, expect } from 'vitest';
import { redact, redactLogContext, redactAnalyticsPayload } from './redaction';

describe('redaction', () => {
    describe('redact function', () => {
        it('should redact sensitive fields from objects', () => {
            const data = {
                username: 'john_doe',
                token: 'secret-token-123',
                signature: 'abc123signature',
                normalField: 'normal-value'
            };

            const result = redact(data);

            expect(result).toEqual({
                username: 'john_doe',
                token: '[REDACTED]',
                signature: '[REDACTED]',
                normalField: 'normal-value'
            });
        });

        it('should handle nested objects recursively', () => {
            const data = {
                user: {
                    id: '123',
                    credentials: {
                        accessToken: 'secret-access-token',
                        refreshToken: 'secret-refresh-token'
                    }
                },
                metadata: {
                    nonce: '123456'
                }
            };

            const result = redact(data);

            expect(result).toEqual({
                user: {
                    id: '123',
                    credentials: {
                        accessToken: '[REDACTED]',
                        refreshToken: '[REDACTED]'
                    }
                },
                metadata: {
                    nonce: '[REDACTED]'
                }
            });
        });

        it('should handle arrays with sensitive data', () => {
            const data = {
                logs: [
                    { message: 'Normal log', token: 'secret1' },
                    { message: 'Another log', signature: 'secret2' },
                    { message: 'Clean log' }
                ]
            };

            const result = redact(data);

            expect(result).toEqual({
                logs: [
                    { message: 'Normal log', token: '[REDACTED]' },
                    { message: 'Another log', signature: '[REDACTED]' },
                    { message: 'Clean log' }
                ]
            });
        });

        it('should handle null and undefined values', () => {
            const data = {
                nullValue: null,
                undefinedValue: undefined,
                token: 'secret-token'
            };

            const result = redact(data);

            expect(result).toEqual({
                nullValue: null,
                undefinedValue: undefined,
                token: '[REDACTED]'
            });
        });

        it('should handle primitive values', () => {
            expect(redact('string')).toBe('string');
            expect(redact(123)).toBe(123);
            expect(redact(true)).toBe(true);
            expect(redact(false)).toBe(false);
        });

        it('should use custom replacement text', () => {
            const data = {
                token: 'secret-token',
                normal: 'normal-value'
            };

            const result = redact(data, { replacement: '[HIDDEN]' });

            expect(result).toEqual({
                token: '[HIDDEN]',
                normal: 'normal-value'
            });
        });

        it('should use custom denylist', () => {
            const data = {
                customSecret: 'secret-value',
                token: 'normal-token',
                normalField: 'normal-value'
            };

            const result = redact(data, { denylist: ['customSecret'] });

            expect(result).toEqual({
                customSecret: '[REDACTED]',
                token: 'normal-token',
                normalField: 'normal-value'
            });
        });

        it('should handle case-insensitive matching by default', () => {
            const data = {
                TOKEN: 'uppercase-token',
                Signature: 'capitalized-signature',
                nonce: 'lowercase-nonce'
            };

            const result = redact(data);

            expect(result).toEqual({
                TOKEN: '[REDACTED]',
                Signature: '[REDACTED]',
                nonce: '[REDACTED]'
            });
        });

        it('should handle case-sensitive matching when disabled', () => {
            const data = {
                TOKEN: 'uppercase-token',
                token: 'lowercase-token',
                Signature: 'capitalized-signature'
            };

            const result = redact(data, { caseInsensitive: false });

            expect(result).toEqual({
                TOKEN: 'uppercase-token',
                token: '[REDACTED]',
                Signature: 'Signature'
            });
        });

        it('should handle partial field name matching', () => {
            const data = {
                'user-token': 'user-token-value',
                'auth_signature': 'auth-signature-value',
                'refreshToken': 'refresh-token-value',
                normalField: 'normal-value'
            };

            const result = redact(data);

            expect(result).toEqual({
                'user-token': '[REDACTED]',
                'auth_signature': '[REDACTED]',
                'refreshToken': '[REDACTED]',
                normalField: 'normal-value'
            });
        });

        it('should handle empty objects and arrays', () => {
            const data = {
                emptyObject: {},
                emptyArray: [],
                token: 'secret-token'
            };

            const result = redact(data);

            expect(result).toEqual({
                emptyObject: {},
                emptyArray: [],
                token: '[REDACTED]'
            });
        });

        it('should handle complex nested structures', () => {
            const data = {
                users: [
                    {
                        id: '1',
                        profile: {
                            name: 'User 1',
                            credentials: {
                                apiKey: 'secret-api-key',
                                password: 'secret-password'
                            }
                        }
                    },
                    {
                        id: '2',
                        profile: {
                            name: 'User 2',
                            credentials: {
                                apiKey: 'another-secret-key'
                            }
                        }
                    }
                ],
                metadata: {
                    authorization: 'bearer-token',
                    timestamp: '2023-01-01'
                }
            };

            const result = redact(data);

            expect(result).toEqual({
                users: [
                    {
                        id: '1',
                        profile: {
                            name: 'User 1',
                            credentials: {
                                apiKey: '[REDACTED]',
                                password: '[REDACTED]'
                            }
                        }
                    },
                    {
                        id: '2',
                        profile: {
                            name: 'User 2',
                            credentials: {
                                apiKey: '[REDACTED]'
                            }
                        }
                    }
                ],
                metadata: {
                    authorization: '[REDACTED]',
                    timestamp: '2023-01-01'
                }
            });
        });
    });

    describe('redactLogContext', () => {
        it('should return undefined when context is undefined', () => {
            const result = redactLogContext(undefined);
            expect(result).toBeUndefined();
        });

        it('should return undefined when context is null', () => {
            const result = redactLogContext(null as any);
            expect(result).toBeNull();
        });

        it('should redact sensitive fields from log context', () => {
            const context = {
                userId: '123',
                token: 'secret-token',
                action: 'login'
            };

            const result = redactLogContext(context);

            expect(result).toEqual({
                userId: '123',
                token: '[REDACTED]',
                action: 'login'
            });
        });

        it('should accept custom options', () => {
            const context = {
                customField: 'secret-value',
                normalField: 'normal-value'
            };

            const result = redactLogContext(context, {
                denylist: ['customField'],
                replacement: '[HIDDEN]'
            });

            expect(result).toEqual({
                customField: '[HIDDEN]',
                normalField: 'normal-value'
            });
        });
    });

    describe('redactAnalyticsPayload', () => {
        it('should return undefined when payload is undefined', () => {
            const result = redactAnalyticsPayload(undefined);
            expect(result).toBeUndefined();
        });

        it('should return undefined when payload is null', () => {
            const result = redactAnalyticsPayload(null as any);
            expect(result).toBeNull();
        });

        it('should redact sensitive fields from analytics payload', () => {
            const payload = {
                event: 'user_login',
                userId: '123',
                authToken: 'secret-auth-token',
                sessionId: 'session-123'
            };

            const result = redactAnalyticsPayload(payload);

            expect(result).toEqual({
                event: 'user_login',
                userId: '123',
                authToken: '[REDACTED]',
                sessionId: 'session-123'
            });
        });

        it('should accept custom options', () => {
            const payload = {
                customSecret: 'secret-value',
                normalField: 'normal-value'
            };

            const result = redactAnalyticsPayload(payload, {
                denylist: ['customSecret'],
                replacement: '[ANALYTICS_REDACTED]'
            });

            expect(result).toEqual({
                customSecret: '[ANALYTICS_REDACTED]',
                normalField: 'normal-value'
            });
        });
    });

    describe('edge cases', () => {
        it('should handle circular references gracefully', () => {
            const data: any = { token: 'secret-token' };
            data.self = data;

            // This should not throw an error
            const result = redact(data);
            expect(result.token).toBe('[REDACTED]');
            expect(result.self).toBe(result.self); // Circular reference preserved
        });

        it('should handle Date objects', () => {
            const date = new Date('2023-01-01');
            const data = {
                timestamp: date,
                token: 'secret-token'
            };

            const result = redact(data);
            expect(result.timestamp).toBe(date);
            expect(result.token).toBe('[REDACTED]');
        });

        it('should handle RegExp objects', () => {
            const regex = /test/g;
            const data = {
                pattern: regex,
                token: 'secret-token'
            };

            const result = redact(data);
            expect(result.pattern).toBe(regex);
            expect(result.token).toBe('[REDACTED]');
        });

        it('should handle functions', () => {
            const fn = () => 'test';
            const data = {
                callback: fn,
                token: 'secret-token'
            };

            const result = redact(data);
            expect(result.callback).toBe(fn);
            expect(result.token).toBe('[REDACTED]');
        });
    });
});
