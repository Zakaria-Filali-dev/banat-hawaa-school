import { useState, useCallback, useEffect, useRef } from 'react';
import { validationService, VALIDATION_SCHEMAS } from '../services/validationService';

/**
 * Enhanced Form Validation Hook
 * 
 * Provides real-time form validation with:
 * - Debounced validation
 * - Field-level and form-level validation
 * - Custom validation rules
 * - Sanitized values
 * - Error tracking and display
 * - Submit handling with validation
 */
export function useFormValidation(initialValues = {}, schema = {}, options = {}) {
    const {
        validateOnChange = true,
        validateOnBlur = true,
        debounceMs = 300,
        enableSanitization = true,
        onSubmit = null,
        onFieldChange = null
    } = options;

    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [sanitizedValues, setSanitizedValues] = useState(initialValues);

    const debounceTimeouts = useRef({});
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            Object.values(debounceTimeouts.current).forEach(clearTimeout);
        };
    }, []);

    // Validate form whenever values change
    useEffect(() => {
        if (Object.keys(values).length > 0) {
            validateForm();
        }
    }, [values, validateForm]);

    /**
     * Validate entire form
     */
    const validateForm = useCallback(() => {
        if (!isMountedRef.current) return;

        const result = validationService.validateForm(values, schema);

        setErrors(result.errors);
        setIsValid(result.isValid);

        if (enableSanitization) {
            const sanitized = {};
            Object.keys(result.results).forEach(fieldName => {
                const fieldResult = result.results[fieldName];
                sanitized[fieldName] = fieldResult.sanitized !== undefined
                    ? fieldResult.sanitized
                    : values[fieldName];
            });
            setSanitizedValues(sanitized);
        }

        return result;
    }, [values, schema, enableSanitization]);

    /**
     * Validate single field with debouncing
     */
    const validateField = useCallback((fieldName, value) => {
        if (!isMountedRef.current) return;

        // Clear existing timeout
        if (debounceTimeouts.current[fieldName]) {
            clearTimeout(debounceTimeouts.current[fieldName]);
        }

        // Set new timeout for debounced validation
        debounceTimeouts.current[fieldName] = setTimeout(() => {
            if (!isMountedRef.current) return;

            const fieldSchema = schema[fieldName];
            if (!fieldSchema) return;

            let result;

            switch (fieldSchema.type) {
                case 'email':
                    result = validationService.validateEmail(value);
                    break;
                case 'password':
                    result = validationService.validatePassword(value, fieldSchema.options);
                    break;
                case 'name':
                    result = validationService.validateName(value, fieldSchema.label || fieldName);
                    break;
                case 'phone':
                    result = validationService.validatePhone(value);
                    break;
                case 'text':
                    result = validationService.validateTextContent(value, {
                        ...fieldSchema.options,
                        fieldName: fieldSchema.label || fieldName
                    });
                    break;
                case 'number':
                    result = validationService.validateNumber(value, {
                        ...fieldSchema.options,
                        fieldName: fieldSchema.label || fieldName
                    });
                    break;
                case 'custom':
                    result = validationService.validateCustom(value, fieldSchema.rule, fieldSchema.options);
                    break;
                default:
                    result = { isValid: true, errors: [], sanitized: value };
            }

            setErrors(prev => ({
                ...prev,
                [fieldName]: result.isValid ? [] : result.errors
            }));

            if (enableSanitization && result.sanitized !== undefined) {
                setSanitizedValues(prev => ({
                    ...prev,
                    [fieldName]: result.sanitized
                }));
            }
        }, debounceMs);
    }, [schema, debounceMs, enableSanitization]);

    /**
     * Handle field value change
     */
    const handleChange = useCallback((fieldName, value) => {
        if (!isMountedRef.current) return;

        setValues(prev => ({
            ...prev,
            [fieldName]: value
        }));

        if (validateOnChange) {
            validateField(fieldName, value);
        }

        if (onFieldChange) {
            onFieldChange(fieldName, value);
        }
    }, [validateOnChange, validateField, onFieldChange]);

    /**
     * Handle field blur event
     */
    const handleBlur = useCallback((fieldName) => {
        if (!isMountedRef.current) return;

        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        if (validateOnBlur) {
            validateField(fieldName, values[fieldName]);
        }
    }, [validateOnBlur, validateField, values]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (event) => {
        if (event) {
            event.preventDefault();
        }

        if (!isMountedRef.current) return;

        setIsSubmitting(true);

        try {
            // Mark all fields as touched
            const allTouched = {};
            Object.keys(schema).forEach(fieldName => {
                allTouched[fieldName] = true;
            });
            setTouched(allTouched);

            // Validate entire form
            const result = validateForm();

            if (result.isValid && onSubmit) {
                const submitValues = enableSanitization ? sanitizedValues : values;
                await onSubmit(submitValues);
            }

            return result;
        } catch (error) {
            console.error('Form submission error:', error);
            throw error;
        } finally {
            if (isMountedRef.current) {
                setIsSubmitting(false);
            }
        }
    }, [schema, validateForm, onSubmit, enableSanitization, sanitizedValues, values]);

    /**
     * Reset form to initial values
     */
    const resetForm = useCallback(() => {
        if (!isMountedRef.current) return;

        setValues(initialValues);
        setErrors({});
        setTouched({});
        setSanitizedValues(initialValues);
        setIsSubmitting(false);
        setIsValid(false);

        // Clear debounce timeouts
        Object.values(debounceTimeouts.current).forEach(clearTimeout);
        debounceTimeouts.current = {};
    }, [initialValues]);

    /**
     * Set field value programmatically
     */
    const setFieldValue = useCallback((fieldName, value) => {
        handleChange(fieldName, value);
    }, [handleChange]);

    /**
     * Set field error programmatically
     */
    const setFieldError = useCallback((fieldName, error) => {
        if (!isMountedRef.current) return;

        setErrors(prev => ({
            ...prev,
            [fieldName]: Array.isArray(error) ? error : [error]
        }));
    }, []);

    /**
     * Clear field error
     */
    const clearFieldError = useCallback((fieldName) => {
        if (!isMountedRef.current) return;

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    /**
     * Get field props for easy integration with inputs
     */
    const getFieldProps = useCallback((fieldName) => {
        return {
            name: fieldName,
            value: values[fieldName] || '',
            onChange: (e) => handleChange(fieldName, e.target.value),
            onBlur: () => handleBlur(fieldName),
            error: touched[fieldName] && errors[fieldName]?.length > 0,
            helperText: touched[fieldName] && errors[fieldName]?.[0]
        };
    }, [values, handleChange, handleBlur, touched, errors]);

    /**
     * Get error status for a field
     */
    const getFieldError = useCallback((fieldName) => {
        return touched[fieldName] && errors[fieldName]?.length > 0 ? errors[fieldName][0] : null;
    }, [touched, errors]);

    /**
     * Check if field is valid
     */
    const isFieldValid = useCallback((fieldName) => {
        return !errors[fieldName] || errors[fieldName].length === 0;
    }, [errors]);

    return {
        // Values and state
        values,
        sanitizedValues,
        errors,
        touched,
        isSubmitting,
        isValid,

        // Actions
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
        setFieldValue,
        setFieldError,
        clearFieldError,
        validateForm,

        // Helpers
        getFieldProps,
        getFieldError,
        isFieldValid
    };
}

/**
 * Hook for specific validation schemas
 */
export function useValidatedForm(schemaName, initialValues = {}, options = {}) {
    const schema = VALIDATION_SCHEMAS[schemaName];

    if (!schema) {
        throw new Error(`Validation schema '${schemaName}' not found`);
    }

    return useFormValidation(initialValues, schema, options);
}

/**
 * Hook for password validation with confirmation
 */
export function usePasswordValidation(options = {}) {
    const {
        onValidation = null,
        strengthRequired = 'medium'
    } = options;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validation, setValidation] = useState({
        isValid: false,
        errors: [],
        strength: 0,
        strengthLevel: 'weak',
        match: false
    });

    const validatePasswords = useCallback(() => {
        const passwordResult = validationService.validatePassword(password);
        const match = password === confirmPassword && password.length > 0;

        let errors = [...passwordResult.errors];

        if (confirmPassword && !match) {
            errors.push('Passwords do not match');
        }

        const strengthLevels = { weak: 1, medium: 2, strong: 3, 'very-strong': 4 };
        const requiredLevel = strengthLevels[strengthRequired] || 2;
        const currentLevel = strengthLevels[passwordResult.strengthLevel] || 1;

        if (currentLevel < requiredLevel) {
            errors.push(`Password strength must be at least ${strengthRequired}`);
        }

        const result = {
            isValid: errors.length === 0 && match,
            errors,
            strength: passwordResult.strength,
            strengthLevel: passwordResult.strengthLevel,
            match
        };

        setValidation(result);

        if (onValidation) {
            onValidation(result);
        }

        return result;
    }, [password, confirmPassword, strengthRequired, onValidation]);

    useEffect(() => {
        if (password || confirmPassword) {
            validatePasswords();
        }
    }, [password, confirmPassword, validatePasswords]);

    return {
        password,
        confirmPassword,
        setPassword,
        setConfirmPassword,
        validation,
        validatePasswords
    };
}

export default useFormValidation;