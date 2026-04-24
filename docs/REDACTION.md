# Backend Log Redaction

## Overview

This document describes the centralized redaction layer implemented to prevent accidental logging of sensitive information in backend logs and analytics events.

## Features

- **Automatic Redaction**: Sensitive fields are automatically redacted from all logs and analytics events
- **Nested Object Support**: Handles deeply nested objects and arrays recursively
- **Configurable**: Supports custom denylists and replacement text
- **Case-Insensitive Matching**: Default behavior matches field names regardless of case
- **Partial Field Matching**: Redacts fields containing sensitive keywords (e.g., `user-token`)

## Implementation

### Core Redaction Function

The `redact()` function in `src/lib/backend/redaction.ts` provides the core redaction functionality:

```typescript
import { redact, redactLogContext, redactAnalyticsPayload } from '@/lib/backend/redaction';

// Basic usage
const safeData = redact(sensitiveData);

// Custom options
const safeData = redact(data, {
    denylist: ['customSecret'],
    replacement: '[HIDDEN]',
    caseInsensitive: false
});
```

### Integration with Logger

All logging functions in `src/lib/backend/logger.ts` automatically apply redaction:

```typescript
import { logInfo, logError, logCommitmentCreated } from '@/lib/backend/logger';

// These automatically redact sensitive data
logInfo(req, 'User action', { userId: '123', token: 'secret' });
logError(req, 'Error occurred', error, { apiKey: 'secret-key' });
logCommitmentCreated({ signature: 'secret-signature', amount: '1000' });
```

## Default Denylist

The following field names are automatically redacted by default:

- `signature`
- `token`
- `nonce`
- `authorization`
- `password`
- `secret`
- `key`
- `privateKey`
- `publicKey`
- `apiKey`
- `accessToken`
- `refreshToken`
- `authToken`
- `bearer`
- `credentials`

## Usage Examples

### Basic Redaction

```typescript
const data = {
    username: 'john_doe',
    token: 'secret-token-123',
    signature: 'abc123signature',
    normalField: 'normal-value'
};

const result = redact(data);
// Result:
// {
//     username: 'john_doe',
//     token: '[REDACTED]',
//     signature: '[REDACTED]',
//     normalField: 'normal-value'
// }
```

### Nested Objects

```typescript
const data = {
    user: {
        credentials: {
            accessToken: 'secret-access-token',
            refreshToken: 'secret-refresh-token'
        }
    }
};

const result = redact(data);
// All sensitive fields are recursively redacted
```

### Arrays

```typescript
const data = {
    logs: [
        { message: 'Normal log', token: 'secret1' },
        { message: 'Another log', signature: 'secret2' }
    ]
};

const result = redact(data);
// Sensitive fields in array elements are redacted
```

### Custom Configuration

```typescript
const customOptions = {
    denylist: ['customSecret', 'privateField'],
    replacement: '[HIDDEN]',
    caseInsensitive: false
};

const result = redact(data, customOptions);
```

## Testing

Comprehensive unit tests are provided in:

- `src/lib/backend/redaction.test.ts` - Core redaction functionality tests
- `src/lib/backend/logger.test.ts` - Logger integration tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test redaction.test.ts
npm test logger.test.ts
```

### Test Coverage

The implementation includes comprehensive test coverage for:

- ✅ Basic object redaction
- ✅ Nested object redaction
- ✅ Array redaction
- ✅ Primitive values
- ✅ Null/undefined handling
- ✅ Custom configuration options
- ✅ Case sensitivity options
- ✅ Partial field matching
- ✅ Edge cases (circular references, Dates, etc.)
- ✅ Logger integration
- ✅ Analytics event redaction

## Security Considerations

1. **Default Denylist**: The default denylist includes common sensitive field names
2. **Case-Insensitive**: Default behavior prevents case-based bypasses
3. **Partial Matching**: Catches variations like `user-token` or `auth_signature`
4. **Recursive Processing**: Ensures deeply nested sensitive data is caught
5. **No False Positives**: Only redacts fields matching the denylist

## Performance Impact

- **Minimal Overhead**: Redaction is performed during log formatting, not during data processing
- **Efficient Algorithm**: Uses efficient object traversal and string matching
- **Lazy Evaluation**: Only processes data that is actually being logged

## Migration Guide

### Before

```typescript
// Direct logging - potential security risk
logInfo(req, 'User logged in', {
    userId: user.id,
    token: user.token,  // This could be logged!
    action: 'login'
});
```

### After

```typescript
// Automatic redaction - secure
logInfo(req, 'User logged in', {
    userId: user.id,
    token: user.token,  // Automatically redacted to [REDACTED]
    action: 'login'
});
```

## Best Practices

1. **Always Use Logger Functions**: Avoid direct console.log with sensitive data
2. **Trust the Redaction**: The redaction layer handles sensitive data automatically
3. **Customize When Needed**: Use custom denylists for application-specific sensitive fields
4. **Test Your Changes**: Ensure new logging calls don't expose sensitive data
5. **Review Analytics Payloads**: Analytics events are also automatically redacted

## Troubleshooting

### Common Issues

1. **Field Not Redacted**: Check if the field name matches the denylist (case-insensitive by default)
2. **Too Much Redaction**: Consider using a custom denylist with specific field names
3. **Performance Concerns**: Redaction only processes data being logged, not stored data

### Debugging

```typescript
// Test redaction manually
import { redact } from '@/lib/backend/redaction';

const testData = { /* your data */ };
console.log('Redacted:', redact(testData));
```

## Future Enhancements

Potential improvements to consider:

1. **Pattern-Based Redaction**: Support regex patterns for field matching
2. **Value-Based Redaction**: Detect and redact values that look like secrets (e.g., long random strings)
3. **Environment-Specific Denylists**: Different denylists for development vs production
4. **Redaction Metrics**: Track how many fields are being redacted for monitoring

## Contributing

When adding new logging calls or analytics events:

1. Always include potentially sensitive data in context/payload objects
2. Trust the redaction layer to handle sensitive fields
3. Add tests for new logging scenarios
4. Update documentation if adding new sensitive field patterns

## Security

This redaction layer is a security measure to prevent accidental exposure of sensitive information. It should be used in conjunction with:

- Proper access controls
- Secure storage of sensitive data
- Regular security audits
- Code review processes

The redaction layer is designed to fail safe - if there's any doubt about whether a field might be sensitive, it's better to add it to the denylist.
