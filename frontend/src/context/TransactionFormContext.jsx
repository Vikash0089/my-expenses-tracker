import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import TransactionFormModal from '../components/TransactionFormModal';

const Ctx = createContext(null);
export const useTransactionForm = () => useContext(Ctx);

/**
 * One global add/edit form. openForm({ type, date, personName, categoryId }) pre-fills fields;
 * openForm({ editing: tx }) edits. `txVersion` bumps after any change so pages can refetch.
 */
export function TransactionFormProvider({ children }) {
  const [state, setState] = useState({ open: false, prefill: {}, editing: null });
  const [txVersion, setTxVersion] = useState(0);

  const openForm = useCallback((opts = {}) => {
    const { editing = null, ...prefill } = opts;
    setState({ open: true, prefill, editing });
  }, []);
  const closeForm = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const bump = useCallback(() => setTxVersion((v) => v + 1), []);

  const value = useMemo(() => ({ openForm, txVersion, bump }), [openForm, txVersion, bump]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <TransactionFormModal {...state} onClose={closeForm} onSaved={bump} />
    </Ctx.Provider>
  );
}
