import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { redactLogContext, redactAnalyticsPayload } from './redaction';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
/**
 * Lightweight analytics-friendly logger for backend events.
 *
 * These helpers are intentionally simple because the actual business logic
 * lives elsewhere. When the app moves into production we could replace the
 * `emit` implementation with something that forwards events to an analytics
 * service (Mixpanel, Segment, Datadog, etc.).
 *
 * For now we simply write a structured JSON string to the console so that
 * developers and automated tests can verify that the correct hooks are being
 * invoked.
 */

export interface AnalyticsPayload {
    [key: string]: unknown;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    requestId?: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

interface AnalyticsEvent {
    event: string;
    timestamp: string;
    requestId?: string;
    context?: Record<string, unknown>;
    payload?: AnalyticsPayload;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

const requestIds = new WeakMap<Request | NextRequest, string>();

export function getRequestId(req?: Request | NextRequest): string {
    if (!req) return randomUUID();
    let rid: string | undefined | null = req.headers.get('x-request-id');
    if (rid) return rid;

    rid = requestIds.get(req);
    if (!rid) {
        rid = randomUUID();
        requestIds.set(req, rid);
    }
    return rid;
}

function formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
}

function createLogEntry(
    level: LogLevel,
    req: Request | NextRequest | undefined | string,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
): LogEntry {
    let requestId: string | undefined;
    if (typeof req === 'string') {
        requestId = req;
    } else if (req) {
        requestId = getRequestId(req);
    }

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        requestId,
    };

    if (context) entry.context = context;

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    return entry;
}

export function logInfo(req: Request | NextRequest | undefined | string, message: string, context?: Record<string, unknown>): void {
    const redactedContext = redactLogContext(context);
    const entry = createLogEntry('info', req, message, redactedContext);
    console.log(formatEntry(entry));
}

export function logWarn(req: Request | NextRequest | undefined | string, message: string, context?: Record<string, unknown>): void {
    const redactedContext = redactLogContext(context);
    const entry = createLogEntry('warn', req, message, redactedContext);
    console.warn(formatEntry(entry));
}

export function logError(req: Request | NextRequest | undefined | string, message: string, error?: Error, context?: Record<string, unknown>): void {
    const redactedContext = redactLogContext(context);
    const entry = createLogEntry('error', req, message, redactedContext, error);
    console.error(formatEntry(entry));
}

export function logDebug(req: Request | NextRequest | undefined | string, message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
        const redactedContext = redactLogContext(context);
        const entry = createLogEntry('debug', req, message, redactedContext);
        console.debug(formatEntry(entry));
    }
}

function emit(event: AnalyticsEvent) {
    // In development we use console.log; in production this might be a call
    // to an external service or to a logging library that understands
    // structured events.
    console.log(JSON.stringify(event));
}

export function logCommitmentCreated(payload: AnalyticsPayload = {}) {
    const redactedPayload = redactAnalyticsPayload(payload);
    emit({
        event: 'CommitmentCreated',
        timestamp: new Date().toISOString(),
        payload: redactedPayload
    });
}

export function logCommitmentSettled(payload: AnalyticsPayload = {}) {
    const redactedPayload = redactAnalyticsPayload(payload);
    emit({
        event: 'CommitmentSettled',
        timestamp: new Date().toISOString(),
        payload: redactedPayload
    });
}

export function logEarlyExit(payload: AnalyticsPayload = {}) {
    const redactedPayload = redactAnalyticsPayload(payload);
    emit({
        event: 'CommitmentEarlyExit',
        timestamp: new Date().toISOString(),
        payload: redactedPayload
    });
}

export function logAttestation(payload: AnalyticsPayload = {}) {
    const redactedPayload = redactAnalyticsPayload(payload);
    emit({
        event: 'AttestationReceived',
        timestamp: new Date().toISOString(),
        payload: redactedPayload
    });
}

export const logger = {
    info: (message: string, context?: Record<string, unknown>) =>
        logInfo(undefined, message, context),
    warn: (message: string, context?: Record<string, unknown>) =>
        logWarn(undefined, message, context),
    error: (message: string, context?: Record<string, unknown>) =>
        logError(undefined, message, undefined, context),
    debug: (message: string, context?: Record<string, unknown>) =>
        logDebug(undefined, message, context),
};

export { redact, redactLogContext, redactAnalyticsPayload } from './redaction';
