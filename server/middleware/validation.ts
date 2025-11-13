import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for creating recommendations
 */
export const validateCreateRecommendation = [
  body('resourceId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Resource ID is required')
    .isLength({ max: 255 })
    .withMessage('Resource ID must not exceed 255 characters'),

  body('optimizationType')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Optimization type is required')
    .isIn(['resize', 'storage-class', 'terminate', 'schedule', 'rightsizing'])
    .withMessage('Invalid optimization type'),

  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 500 })
    .withMessage('Title must not exceed 500 characters'),

  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  body('projectedMonthlySavings')
    .isFloat({ min: 0 })
    .withMessage('Projected monthly savings must be a positive number'),

  body('projectedAnnualSavings')
    .isFloat({ min: 0 })
    .withMessage('Projected annual savings must be a positive number'),

  body('riskLevel')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Risk level must be between 0 and 10'),

  body('estimatedEffort')
    .optional()
    .isString()
    .trim(),

  body('implementationSteps')
    .optional()
    .isArray()
    .withMessage('Implementation steps must be an array'),

  handleValidationErrors,
];

/**
 * Validation rules for creating approval requests
 */
export const validateCreateApprovalRequest = [
  body('recommendationId')
    .isInt({ min: 1 })
    .withMessage('Recommendation ID must be a positive integer'),

  body('requestedBy')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Requested by is required')
    .isLength({ max: 255 })
    .withMessage('Requested by must not exceed 255 characters'),

  body('reason')
    .optional()
    .isString()
    .trim(),

  handleValidationErrors,
];

/**
 * Validation rules for updating approval request status
 */
export const validateUpdateApprovalRequest = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Approval request ID must be a positive integer'),

  body('status')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),

  body('reviewedBy')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Reviewed by is required')
    .isLength({ max: 255 })
    .withMessage('Reviewed by must not exceed 255 characters'),

  body('reviewNotes')
    .optional()
    .isString()
    .trim(),

  handleValidationErrors,
];

/**
 * Validation rules for system config
 */
export const validateSystemConfig = [
  body('key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Key is required')
    .isLength({ max: 255 })
    .withMessage('Key must not exceed 255 characters'),

  body('value')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Value is required'),

  body('description')
    .optional()
    .isString()
    .trim(),

  body('updatedBy')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Updated by is required')
    .isLength({ max: 255 })
    .withMessage('Updated by must not exceed 255 characters'),

  handleValidationErrors,
];

/**
 * Validation rules for updating system config
 */
export const validateUpdateSystemConfig = [
  param('key')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Key is required'),

  body('value')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Value is required'),

  body('updatedBy')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Updated by is required')
    .isLength({ max: 255 })
    .withMessage('Updated by must not exceed 255 characters'),

  handleValidationErrors,
];

/**
 * Validation rules for boolean mode toggles
 */
export const validateBooleanToggle = [
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean value'),

  handleValidationErrors,
];

/**
 * Validation rules for query parameters
 */
export const validateRecommendationsQuery = [
  query('status')
    .optional()
    .isString()
    .trim()
    .isIn(['pending', 'approved', 'rejected', 'executed'])
    .withMessage('Invalid status value'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),

  handleValidationErrors,
];

/**
 * Validation for ID parameters
 */
export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),

  handleValidationErrors,
];

/**
 * Sanitization helper - escape HTML and trim strings
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .slice(0, 10000); // Limit to reasonable length
};
