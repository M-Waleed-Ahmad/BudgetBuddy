import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import expensesReducer from '../features/expenses/expensesSlice.js';
import budgetsReducer from '../features/budgets/budgetsSlice.js';
import notificationsReducer from '../features/notifications/notificationsSlice.js';
import reportsReducer from '../features/reports/reportsSlice.js';
import uiReducer from '../features/ui/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expensesReducer,
    budgets: budgetsReducer,
    notifications: notificationsReducer,
    reports: reportsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const selectRootState = (state) => state;
export const selectAppDispatch = () => store.dispatch;
