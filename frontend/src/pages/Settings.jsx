import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LogOut, Moon, Sun } from 'lucide-react';
import { PageHeader, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { errorMessage } from '../services/api';
import { CURRENCIES } from '../utils/constants';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({ defaultValues: { name: user.name, currency: user.currency } });

  const submit = async (v) => {
    try { await updateProfile(v); toast.success('Settings saved'); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" />
      <form onSubmit={handleSubmit(submit)} className="card space-y-4 p-5" noValidate>
        <h2 className="font-semibold">Profile</h2>
        <Field label="Name" error={errors.name?.message}><input className="input" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })} /></Field>
        <Field label="Email"><input className="input" value={user.email} disabled readOnly /></Field>
        <Field label="Currency"><select className="input" {...register('currency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <button className="btn-primary" disabled={isSubmitting || !isDirty}>{isSubmitting ? 'Saving…' : 'Save changes'}</button>
      </form>

      <section className="card mt-4 flex items-center justify-between p-5">
        <div><h2 className="font-semibold">Appearance</h2><p className="text-sm text-slate-500">Currently {theme} mode. Your choice is remembered on this device.</p></div>
        <button className="btn-secondary" onClick={toggle}>{theme === 'dark' ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}</button>
      </section>

      <section className="card mt-4 flex items-center justify-between p-5">
        <div><h2 className="font-semibold">Session</h2><p className="text-sm text-slate-500">Signed in as {user.email}</p></div>
        <button className="btn-secondary text-red-600" onClick={logout}><LogOut size={16} /> Log out</button>
      </section>
    </div>
  );
}
