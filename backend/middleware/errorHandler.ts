import { Request, Response, NextFunction } from 'express';

/**
 * Sistema de métricas para errores
 */
interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
  lastErrors: Array<{
    timestamp: string;
    endpoint: string;
    statusCode: number;
    errorType: string;
    message: string;
  }>;
}

class ErrorMetricsCollector {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByEndpoint: {},
    errorsByStatusCode: {},
    lastErrors: []
  };

  private readonly MAX_LAST_ERRORS = 50;

  /**
   * Registra un error en las métricas
   */
  recordError(
    errorType: string,
    endpoint: string,
    statusCode: number,
    message: string
  ): void {
    this.metrics.totalErrors++;
    
    // Contar por tipo de error
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
    
    // Contar por endpoint
    this.metrics.errorsByEndpoint[endpoint] = (this.metrics.errorsByEndpoint[endpoint] || 0) + 1;
    
    // Contar por código de estado
    this.metrics.errorsByStatusCode[statusCode] = (this.metrics.errorsByStatusCode[statusCode] || 0) + 1;
    
    // Agregar a últimos errores (máximo 50)
    this.metrics.lastErrors.unshift({
      timestamp: new Date().toISOString(),
      endpoint,
      statusCode,
      errorType,
      message
    });
    
    if (this.metrics.lastErrors.length > this.MAX_LAST_ERRORS) {
      this.metrics.lastErrors = this.metrics.lastErrors.slice(0, this.MAX_LAST_ERRORS);
    }
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtiene un resumen de las métricas
   */
  getSummary(): {
    totalErrors: number;
    topErrors: Array<{ type: string; count: number }>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    statusCodeDistribution: Record<number, number>;
  } {
    // Top 10 tipos de error más frecuentes
    const topErrors = Object.entries(this.metrics.errorsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // Top 10 endpoints más problemáticos
    const topEndpoints = Object.entries(this.metrics.errorsByEndpoint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalErrors: this.metrics.totalErrors,
      topErrors,
      topEndpoints,
      statusCodeDistribution: { ...this.metrics.errorsByStatusCode }
    };
  }

  /**
   * Reinicia las métricas
   */
  reset(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByEndpoint: {},
      errorsByStatusCode: {},
      lastErrors: []
    };
  }
}

// Instancia global del colector de métricas
export const errorMetrics = new ErrorMetricsCollector();

/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Mantiene el stack trace correcto
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error de validación (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de autenticación (401 Unauthorized)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error de permisos (403 Forbidden)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error de recurso no encontrado (404 Not Found)
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} no encontrado`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de conflicto (409 Conflict) - ej: email duplicado
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error interno del servidor (500 Internal Server Error)
 */
export class InternalServerError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(500, message, false); // No es operacional
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Interfaz extendida para Request con información de usuario
 */
interface RequestWithUser extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

/**
 * Logger estructurado para errores
 */
const logError = (err: Error | AppError, req: RequestWithUser) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      origin: req.get('origin')
    },
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : 'No autenticado',
    error: {
      name: err.name,
      message: err.message,
      statusCode: err instanceof AppError ? err.statusCode : 500,
      isOperational: err instanceof AppError ? err.isOperational : false,
      stack: err.stack
    }
  };

  // En producción, aquí integrarías con servicios como:
  // - Sentry: Sentry.captureException(err)
  // - Datadog: logger.error(errorLog)
  // - CloudWatch: cloudwatch.putLogEvents(errorLog)
  
  if (process.env.NODE_ENV === 'production') {
    // Solo loguear información relevante en producción
    console.error(JSON.stringify({
      timestamp: errorLog.timestamp,
      method: errorLog.method,
      url: errorLog.url,
      user: errorLog.user,
      error: {
        name: errorLog.error.name,
        message: errorLog.error.message,
        statusCode: errorLog.error.statusCode
      }
    }));
  } else {
    // En desarrollo, loguear todo con formato legible
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR CAPTURADO');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('📍 Endpoint:', `${errorLog.method} ${errorLog.url}`);
    console.error('👤 Usuario:', errorLog.user);
    console.error('⚠️  Error:', errorLog.error.message);
    console.error('📊 Status:', errorLog.error.statusCode);
    console.error('🔍 Stack:', errorLog.error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
};

/**
 * Middleware global de manejo de errores
 * DEBE ser el último middleware registrado
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Loguear el error de forma estructurada
  logError(err, req as RequestWithUser);

  // Determinar statusCode y nombre del error
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorName = err.name || 'Error';

  // 📊 Registrar métricas
  errorMetrics.recordError(
    errorName,
    `${req.method} ${req.path}`,
    statusCode,
    err.message
  );

  // Si es un error operacional conocido (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        name: err.name
      })
    });
  }

  // Manejo de errores específicos de Supabase/PostgreSQL
  if ((err as any).code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'El recurso ya existe (duplicado)',
      statusCode: 409
    });
  }

  if ((err as any).code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Violación de clave foránea',
      statusCode: 400
    });
  }

  // Manejo de errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token JWT inválido',
      statusCode: 401
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token JWT expirado',
      statusCode: 401
    });
  }

  // Error desconocido - NO exponer detalles en producción
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: isDevelopment 
      ? err.message 
      : 'Error interno del servidor',
    statusCode: 500,
    ...(isDevelopment && { 
      stack: err.stack,
      name: err.name
    })
  });
};

/**
 * Wrapper para controladores asíncronos
 * Captura automáticamente errores de promesas rechazadas
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para manejar rutas no encontradas (404)
 * DEBE registrarse antes del errorHandler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Ruta ${req.originalUrl}`);
  next(error);
};
