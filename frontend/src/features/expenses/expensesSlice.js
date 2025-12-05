import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchExpensesForCurrentMonth, addExpense, updateExpense, deleteExpense } from '../../api/api.js';

const initialState = {
  items: [],
  totalSpent: 0,
  filters: { dateRange: null, category: '', minAmount: '', maxAmount: '', searchQuery: '' },
  status: 'idle',
  error: null,
};

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async (_, thunkAPI) => {
  try {
    const res = await fetchExpensesForCurrentMonth();
    console.log('Fetched expenses:', res);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load expenses');
  }
});

export const createExpense = createAsyncThunk('expenses/createExpense', async (payload, thunkAPI) => {
  try {
    const res = await addExpense(payload);
    console.log('Added expense:', res);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to add expense');
  }
});

export const editExpense = createAsyncThunk('expenses/editExpense', async ({ id, data }, thunkAPI) => {
  try {
    const res = await updateExpense(id, data);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to update expense');
  }
});

export const removeExpense = createAsyncThunk('expenses/removeExpense', async (id, thunkAPI) => {
  try {
    await deleteExpense(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to delete expense');
  }
});

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.expenses || [];
        state.totalSpent = action.payload.totalSpent || 0;
      })
      .addCase(fetchExpenses.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.totalSpent += Number(action.payload?.amount || 0);
      })
      .addCase(editExpense.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item._id === action.payload._id ? action.payload : item));
      })
      .addCase(removeExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { setFilters, clearFilters } = expensesSlice.actions;
export default expensesSlice.reducer;
