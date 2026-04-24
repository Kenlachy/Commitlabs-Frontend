import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    logInfo, 
    logWarn, 
    logError, 
    logDebug, 
    logCommitmentCreated, 
    logCommitmentSettled, 
    logEarlyExit, 
    logAttestation,
    logger 
} from './logger';

describe('logger with redaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logInfo', () => {
        it('should redact sensitive information from context', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const context = {
                userId: '123',
                token: 'secret-token-123',
                action: 'login',
                signature: 'abc-signature'
            };

            logInfo('test-request', 'User logged in', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"token":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"signature":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"userId":"123"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"action":"login"')
            );

            consoleSpy.mockRestore();
        });

        it('should handle undefined context', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            logInfo('test-request', 'Simple message');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"message":"Simple message"')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('logWarn', () => {
        it('should redact sensitive information from context', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const context = {
                warning: 'Deprecated API used',
                apiKey: 'secret-api-key',
                nonce: '123456'
            };

            logWarn('test-request', 'Warning message', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"apiKey":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"nonce":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"warning":"Deprecated API used"')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('logError', () => {
        it('should redact sensitive information from context', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const error = new Error('Test error');
            const context = {
                userId: '123',
                authToken: 'secret-auth-token',
                operation: 'create_commitment'
            };

            logError('test-request', 'Error occurred', error, context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"authToken":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"userId":"123"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"operation":"create_commitment"')
            );

            consoleSpy.mockRestore();
        });

        it('should handle error without context', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const error = new Error('Test error');
            logError('test-request', 'Error occurred', error);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"message":"Error occurred"')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('logDebug', () => {
        it('should redact sensitive information from context in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            
            const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
            
            const context = {
                debugInfo: 'Detailed debug info',
                privateKey: 'secret-private-key',
                password: 'secret-password'
            };

            logDebug('test-request', 'Debug message', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"privateKey":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"password":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"debugInfo":"Detailed debug info"')
            );

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });

        it('should not log in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
            
            logDebug('test-request', 'Debug message', { token: 'secret' });

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('analytics functions', () => {
        it('should redact sensitive information from commitment created payload', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const payload = {
                commitmentId: '123',
                userId: 'user123',
                signature: 'secret-signature',
                amount: '1000',
                token: 'auth-token'
            };

            logCommitmentCreated(payload);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"event":"CommitmentCreated"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"signature":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"token":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"commitmentId":"123"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from commitment settled payload', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const payload = {
                commitmentId: '123',
                settlementTx: 'tx-hash',
                authorization: 'bearer-token',
                finalAmount: '950'
            };

            logCommitmentSettled(payload);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"event":"CommitmentSettled"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"authorization":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"settlementTx":"tx-hash"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from early exit payload', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const payload = {
                commitmentId: '123',
                reason: 'early_exit',
                nonce: 'secret-nonce',
                exitFee: '50'
            };

            logEarlyExit(payload);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"event":"CommitmentEarlyExit"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"nonce":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"reason":"early_exit"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from attestation payload', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const payload = {
                attestationId: 'att-123',
                userId: 'user123',
                credentials: {
                    apiKey: 'secret-api-key',
                    accessToken: 'secret-access-token'
                },
                timestamp: '2023-01-01T00:00:00Z'
            };

            logAttestation(payload);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"event":"AttestationReceived"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"apiKey":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"accessToken":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"attestationId":"att-123"')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('logger object', () => {
        it('should redact sensitive information from logger.info', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const context = {
                message: 'Test info',
                token: 'secret-token',
                data: 'normal-data'
            };

            logger.info('Test message', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"token":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"data":"normal-data"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from logger.warn', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const context = {
                warning: 'Test warning',
                secret: 'secret-value'
            };

            logger.warn('Test warning', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"secret":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"warning":"Test warning"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from logger.error', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const context = {
                error: 'Test error',
                credentials: 'secret-credentials'
            };

            logger.error('Test error', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"credentials":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"error":"Test error"')
            );

            consoleSpy.mockRestore();
        });

        it('should redact sensitive information from logger.debug in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            
            const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
            
            const context = {
                debug: 'Test debug',
                privateKey: 'secret-key'
            };

            logger.debug('Test debug', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"privateKey":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"debug":"Test debug"')
            );

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('complex scenarios', () => {
        it('should handle deeply nested sensitive data', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const context = {
                user: {
                    profile: {
                        credentials: {
                            accessToken: 'secret-access-token',
                            refreshToken: 'secret-refresh-token'
                        }
                    }
                },
                transaction: {
                    signature: 'transaction-signature',
                    nonce: 'transaction-nonce'
                }
            };

            logInfo('test-request', 'Complex operation', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"accessToken":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"refreshToken":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"signature":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"nonce":"[REDACTED]"')
            );

            consoleSpy.mockRestore();
        });

        it('should handle arrays with sensitive data', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            const context = {
                logs: [
                    { id: '1', token: 'secret1' },
                    { id: '2', signature: 'secret2' },
                    { id: '3', message: 'clean' }
                ]
            };

            logInfo('test-request', 'Array operation', context);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"token":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"signature":"[REDACTED]"')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"message":"clean"')
            );

            consoleSpy.mockRestore();
        });
    });
});
