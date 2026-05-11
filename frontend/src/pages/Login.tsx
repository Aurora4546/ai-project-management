import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email format').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(location.state?.message || null);
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setApiError(null);
            setSuccessMsg(null);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
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
                if (error.response?.status === 400 && typeof error.response.data === 'object' && !error.response.data.message) {
                    const errors = error.response.data;
                    formik.setErrors(errors);
                    setApiError("Please fix the validation errors below.");
                } else {
                    setApiError(error.response?.data?.message || 'Invalid credentials. Please try again.');
                }
            } finally {
                setSubmitting(false);
            }
        },
    });

    const hasError = (fieldName: keyof typeof formik.values) => {
        return Boolean(formik.errors[fieldName] && (formik.touched[fieldName] || (formik.values[fieldName] && formik.values[fieldName].length > 0)));
    };

    const getInputClass = (fieldName: keyof typeof formik.values) => {
        const baseClass = "w-full px-3 py-2 border rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors";
        if (hasError(fieldName)) {
            return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`;
        }
        return `${baseClass} border-border-subtle focus:border-primary focus:ring-primary`;
    };

    return (
        <div className="bg-background-light font-display antialiased min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-[480px] bg-white border border-border-subtle rounded p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log in</h1>
                </div>

                {successMsg && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {successMsg}
                    </div>
                )}
                {apiError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {apiError}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-5">
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
                                placeholder="Enter your password"
                                className={getInputClass('password')}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.password}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-700 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {hasError('password') ? (
                            <div className="text-red-500 text-xs">{formik.errors.password}</div>
                        ) : null}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded transition-colors duration-200"
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Logging in...' : 'Log in'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center border-t border-border-subtle pt-6">
                    <p className="text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
