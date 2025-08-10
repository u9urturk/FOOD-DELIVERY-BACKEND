import { Injectable, Logger, LogLevel } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  // Error logging
  logError(
    message: string,
    error?: Error,
    context?: LogContext,
    className?: string,
  ): void {
    const loggerInstance = className ? new Logger(className) : this.logger;
    const formattedMessage = this.formatMessage(message, context);
    
    if (error) {
      loggerInstance.error(formattedMessage, error.stack);
    } else {
      loggerInstance.error(formattedMessage);
    }
  }

  // Warning logging
  logWarning(
    message: string,
    context?: LogContext,
    className?: string,
  ): void {
    const loggerInstance = className ? new Logger(className) : this.logger;
    const formattedMessage = this.formatMessage(message, context);
    loggerInstance.warn(formattedMessage);
  }

  // Info logging
  logInfo(
    message: string,
    context?: LogContext,
    className?: string,
  ): void {
    const loggerInstance = className ? new Logger(className) : this.logger;
    const formattedMessage = this.formatMessage(message, context);
    loggerInstance.log(formattedMessage);
  }

  // Debug logging
  logDebug(
    message: string,
    context?: LogContext,
    className?: string,
  ): void {
    const loggerInstance = className ? new Logger(className) : this.logger;
    const formattedMessage = this.formatMessage(message, context);
    loggerInstance.debug(formattedMessage);
  }

  // HTTP request logging
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ): void {
    const level: LogLevel = this.getLogLevelByStatusCode(statusCode);
    const message = `${method} ${url} - ${statusCode} - ${responseTime}ms`;
    const fullContext = {
      ...context,
      method,
      url,
      statusCode,
      responseTime,
    };

    switch (level) {
      case 'error':
        this.logError(message, undefined, fullContext, 'HTTP');
        break;
      case 'warn':
        this.logWarning(message, fullContext, 'HTTP');
        break;
      case 'log':
        this.logInfo(message, fullContext, 'HTTP');
        break;
      case 'debug':
        this.logDebug(message, fullContext, 'HTTP');
        break;
    }
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    error?: Error,
    context?: LogContext,
  ): void {
    const message = `DB ${operation} on ${table}${duration ? ` - ${duration}ms` : ''}`;
    
    if (error) {
      this.logError(message, error, context, 'Database');
    } else {
      this.logInfo(message, context, 'Database');
    }
  }

  // Authentication logging
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'token_refresh' | 'otp_verify',
    username: string,
    success: boolean,
    context?: LogContext,
  ): void {
    const message = `Auth ${event} for user ${username} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    if (success) {
      this.logInfo(message, context, 'Auth');
    } else {
      this.logWarning(message, context, 'Auth');
    }
  }

  // Security event logging
  logSecurityEvent(
    event: 'rate_limit' | 'invalid_token' | 'unauthorized_access' | 'permission_denied',
    context?: LogContext,
  ): void {
    const message = `Security event: ${event}`;
    this.logWarning(message, context, 'Security');
  }

  // Business logic logging
  logBusinessEvent(
    event: string,
    details: string,
    context?: LogContext,
  ): void {
    const message = `Business event: ${event} - ${details}`;
    this.logInfo(message, context, 'Business');
  }

  // Performance logging
  logPerformance(
    operation: string,
    duration: number,
    threshold: number = 1000,
    context?: LogContext,
  ): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (duration > threshold) {
      this.logWarning(message, context, 'Performance');
    } else {
      this.logDebug(message, context, 'Performance');
    }
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context) return message;

    const contextParts: string[] = [];

    if (context.userId) contextParts.push(`userId: ${context.userId}`);
    if (context.requestId) contextParts.push(`requestId: ${context.requestId}`);
    if (context.ip) contextParts.push(`ip: ${context.ip}`);

    return contextParts.length > 0 
      ? `${message} | ${contextParts.join(', ')}`
      : message;
  }

  private getLogLevelByStatusCode(statusCode: number): LogLevel {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'log';
    return 'debug';
  }
}
