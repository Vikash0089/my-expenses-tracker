import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui';
import { errorMessage } from '../services/api';
import { CURRENCIES } from '../utils/constants';

function useSubmit(action) {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const submit = async (values) => {
    setServerError('');
    try {
      await action(values);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (e) {
      setServerError(errorMessage(e));
      toast.error(errorMessage(e));
    }
  };
  return [submit, serverError];
}

const EMAIL_RULE = { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } };

export function Login() {
  const { login } = useAuth();
  const [submit, serverError] = useSubmit(login);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div><h1 className="text-2xl font-bold">Welcome back</h1><p className="text-sm text-slate-500">Log in to see your Expenses.</p></div>
      {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{serverError}</p>}
      <Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" className="input" {...register('email', EMAIL_RULE)} /></Field>
      <Field label="Password" error={errors.password?.message}><input type="password" autoComplete="current-password" className="input" {...register('password', { required: 'Password is required' })} /></Field>
      <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
      <p className="text-center text-sm text-slate-500">New here? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Create an account</Link></p>
    </form>
  );
}

export function Register() {
  const { register: signup } = useAuth();
  const [submit, serverError] = useSubmit(signup);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { currency: 'INR' } });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div><h1 className="text-2xl font-bold">Create your account</h1><p className="text-sm text-slate-500">Start tracking every rupee in minutes.</p></div>
      {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{serverError}</p>}
      <Field label="Name" error={errors.name?.message}><input autoComplete="name" className="input" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })} /></Field>
      <Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" className="input" {...register('email', EMAIL_RULE)} /></Field>
      <Field label="Password" error={errors.password?.message} hint="At least 8 characters">
        <input type="password" autoComplete="new-password" className="input" {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })} />
      </Field>
      <Field label="Currency"><select className="input" {...register('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Log in</Link></p>
    </form>
  );
}
