/**
 * Redaction utility for sensitive data in logs
 * 
 * This module provides a centralized redaction helper that prevents accidental
 * logging of sensitive information like signatures, tokens, nonces, and other
 * secret values. It handles nested objects and arrays recursively.
 */

type RedactableValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/**
 * Default denylist of sensitive field names that should be redacted
 */
const DEFAULT_DENYLIST = [
    'signature',
    'token', 
    'nonce',
    'authorization',
    'password',
    'secret',
    'key',
    'privateKey',
    'publicKey',
    'apiKey',
    'accessToken',
    'refreshToken',
    'authToken',
    'bearer',
    'credentials'
];

/**
 * Configuration options for redaction
 */
interface RedactionOptions {
    /** Custom denylist of field names to redact */
    denylist?: string[];
    /** Replacement text for redacted values */
    replacement?: string;
    /** Whether to use case-insensitive matching */
    caseInsensitive?: boolean;
}

/**
 * Default redaction options
 */
const DEFAULT_OPTIONS: Required<RedactionOptions> = {
    denylist: DEFAULT_DENYLIST,
    replacement: '[REDACTED]',
    caseInsensitive: true
};

/**
 * Checks if a field name should be redacted based on the denylist
 */
function shouldRedact(fieldName: string, denylist: string[], caseInsensitive: boolean): boolean {
    const target = caseInsensitive ? fieldName.toLowerCase() : fieldName;
    
    return denylist.some(denied => {
        const deniedField = caseInsensitive ? denied.toLowerCase() : denied;
        return target === deniedField || target.includes(deniedField);
    });
}

/**
 * Redacts sensitive values from an object or array recursively
 * 
 * @param data - The data to redact (object, array, or primitive)
 * @param options - Redaction configuration options
 * @returns The data with sensitive values redacted
 */
export function redact<T = RedactableValue>(data: T, options: RedactionOptions = {}): T {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { denylist, replacement, caseInsensitive } = opts;

    // Handle null/undefined/primitive values
    if (data === null || data === undefined) {
        return data;
    }

    // Handle strings that might contain sensitive data
    if (typeof data === 'string') {
        return data as T;
    }

    // Handle numbers and booleans
    if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => redact(item, options)) as T;
    }

    // Handle objects
    if (typeof data === 'object') {
        const result: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (shouldRedact(key, denylist, caseInsensitive)) {
                result[key] = replacement;
            } else {
                result[key] = redact(value, options);
            }
        }
        
        return result as T;
    }

    // Fallback for unknown types
    return data;
}

/**
 * Convenience function to redact sensitive data from log context
 * 
 * @param context - Log context object that may contain sensitive data
 * @param options - Redaction configuration options
 * @returns Redacted context object
 */
export function redactLogContext(context?: Record<string, unknown>, options?: RedactionOptions): Record<string, unknown> | undefined {
    if (!context) {
        return context;
    }
    
    return redact(context, options);
}

/**
 * Convenience function to redact sensitive data from analytics payload
 * 
 * @param payload - Analytics payload that may contain sensitive data
 * @param options - Redaction configuration options
 * @returns Redacted payload object
 */
export function redactAnalyticsPayload(payload?: Record<string, unknown>, options?: RedactionOptions): Record<string, unknown> | undefined {
    if (!payload) {
        return payload;
    }
    
    return redact(payload, options);
}
