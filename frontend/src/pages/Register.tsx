import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const validationSchema = Yup.object().shape({
    first_name: Yup.string()
        .min(2, 'First name must be at least 2 characters')
        .max(32, 'First name must be 32 characters or less')
        .matches(/^[^0-9]*$/, 'First name cannot contain numbers')
        .matches(/^[^\s]*$/, 'First name cannot contain spaces')
        .required('First name is required'),
    last_name: Yup.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(32, 'Last name must be 32 characters or less')
        .matches(/^[^0-9]*$/, 'Last name cannot contain numbers')
        .matches(/^[^\s]*$/, 'Last name cannot contain spaces')
        .required('Last name is required'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required')
        .test('checkEmailUnique', 'This email is already in use. Please use a different email.', async function (value) {
            if (!value) return true;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/v1/auth/check-email?email=${value}`);
                return !response.data;
            } catch (error) {
                return true;
            }
        }),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters long')
        .required('Password is required'),
    confirm_password: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
});

export const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const formik = useFormik({
        initialValues: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            confirm_password: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setApiError(null);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
                    firstName: values.first_name,
                    lastName: values.last_name,
                    email: values.email,
                    password: values.password
                });

                if (response.data.token) {
                    login(response.data.token, {
                        email: response.data.email,
                        firstName: response.data.firstName,
                        lastName: response.data.lastName
                    });
                    navigate('/dashboard', { replace: true });
                }
            } catch (error: any) {
                if (error.response?.status === 400 && typeof error.response.data === 'object') {
                    const errors = error.response.data;
                    const formikErrors: Record<string, string> = {};

                    if (errors.firstName) formikErrors.first_name = errors.firstName;
                    if (errors.lastName) formikErrors.last_name = errors.lastName;
                    if (errors.email) formikErrors.email = errors.email;
                    if (errors.password) formikErrors.password = errors.password;

                    if (Object.keys(formikErrors).length > 0) {
                        formik.setErrors(formikErrors);
                        setApiError("Please fix the validation errors below.");
                    } else {
                        setApiError(error.response?.data?.message || 'Failed to register. Please try again.');
                    }
                } else {
                    setApiError(error.response?.data?.message || 'Failed to register. Please try again.');
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    const hasError = (fieldName: keyof typeof formik.values) => {
        return Boolean(formik.errors[fieldName] && (formik.touched[fieldName] || (formik.values[fieldName] && formik.values[fieldName].length > 0)));
    };

    const areNamesValid =
        Boolean(formik.values.first_name.trim().length >= 2) &&
        Boolean(formik.values.last_name.trim().length >= 2) &&
        !hasError('first_name') &&
        !hasError('last_name');

    const getInputClass = (fieldName: keyof typeof formik.values) => {
        const baseClass = "w-full px-3 py-2 border rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none disabled:cursor-not-allowed";
        if (hasError(fieldName)) {
            return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`;
        }
        return `${baseClass} border-border-subtle focus:border-primary focus:ring-primary`;
    };

    return (
        <div className="bg-background-light font-display antialiased min-h-screen flex items-center justify-center p-4">
            {/* Main Registration Card */}
            <div className="w-full max-w-[480px] bg-white border border-border-subtle rounded p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
                </div>

                {apiError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {apiError}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-5">
                    {/* Name Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-900" htmlFor="first_name">
                                First Name
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                maxLength={32}
                                placeholder="First name"
                                className={getInputClass('first_name')}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.first_name}
                            />
                            {hasError('first_name') ? (
                                <div className="text-red-500 text-xs">{formik.errors.first_name}</div>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-900" htmlFor="last_name">
                                Last Name
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                maxLength={32}
                                placeholder="Last name"
                                className={getInputClass('last_name')}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.last_name}
                            />
                            {hasError('last_name') ? (
                                <div className="text-red-500 text-xs">{formik.errors.last_name}</div>
                            ) : null}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-900" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            className={getInputClass('email')}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                            disabled={!areNamesValid}
                            title={!areNamesValid ? "Please provide a valid first and last name to continue" : undefined}
                        />
                        {hasError('email') ? (
                            <div className="text-red-500 text-xs">{formik.errors.email}</div>
                        ) : null}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-900" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className={getInputClass('password')}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.password}
                                disabled={!areNamesValid}
                                title={!areNamesValid ? "Please provide a valid first and last name to continue" : undefined}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                disabled={!areNamesValid}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="text-xs text-slate-500">
                            Password must be at least 8 characters long.
                        </div>
                        {hasError('password') ? (
                            <div className="text-red-500 text-xs">{formik.errors.password}</div>
                        ) : null}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-900" htmlFor="confirm_password">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className={getInputClass('confirm_password')}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.confirm_password}
                                disabled={!areNamesValid}
                                title={!areNamesValid ? "Please provide a valid first and last name to continue" : undefined}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                                disabled={!areNamesValid}
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {hasError('confirm_password') ? (
                            <div className="text-red-500 text-xs">{formik.errors.confirm_password}</div>
                        ) : null}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-border-subtle pt-6">
                    <p className="text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
