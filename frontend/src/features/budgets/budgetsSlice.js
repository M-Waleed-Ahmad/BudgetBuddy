import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getCurrentMonthBudget,
  createMonthlyBudget,
  updateMonthlyBudget,
  getBudgetsForMonth,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getCategories,
} from '../../api/api.js';

const initialState = {
  monthly: { data: null, status: 'idle', error: null },
  items: [],
  categories: [],
  status: 'idle',
  error: null,
  activeMonth: null,
};

export const fetchMonthlyBudget = createAsyncThunk('budgets/fetchMonthlyBudget', async (_, thunkAPI) => {
  try {
    const res = await getCurrentMonthBudget();
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load monthly budget');
  }
});

export const saveMonthlyBudget = createAsyncThunk('budgets/saveMonthlyBudget', async ({ id, data }, thunkAPI) => {
  try {
    if (id) return await updateMonthlyBudget(id, data);
    return await createMonthlyBudget(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to save monthly budget');
  }
});

export const fetchBudgetItems = createAsyncThunk('budgets/fetchBudgetItems', async (monthYear, thunkAPI) => {
  try {
    const res = await getBudgetsForMonth(monthYear);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load budget items');
  }
});

export const saveBudgetItem = createAsyncThunk('budgets/saveBudgetItem', async ({ id, data }, thunkAPI) => {
  try {
    if (id) return await updateBudgetItem(id, data);
    return await addBudgetItem(data);
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to save budget item');
  }
});

export const removeBudgetItem = createAsyncThunk('budgets/removeBudgetItem', async (id, thunkAPI) => {
  try {
    await deleteBudgetItem(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to delete budget item');
  }
});

export const fetchBudgetCategories = createAsyncThunk('budgets/fetchBudgetCategories', async (_, thunkAPI) => {
  try {
    const res = await getCategories();
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load categories');
  }
});

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setActiveMonth: (state, action) => { state.activeMonth = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyBudget.pending, (state) => { state.monthly.status = 'loading'; state.monthly.error = null; })
      .addCase(fetchMonthlyBudget.fulfilled, (state, action) => { state.monthly.status = 'succeeded'; state.monthly.data = action.payload || null; })
      .addCase(fetchMonthlyBudget.rejected, (state, action) => { state.monthly.status = 'failed'; state.monthly.error = action.payload; state.monthly.data = null; })
      .addCase(saveMonthlyBudget.fulfilled, (state, action) => { state.monthly.data = action.payload; })
      .addCase(fetchBudgetItems.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchBudgetItems.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload || []; })
      .addCase(fetchBudgetItems.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(saveBudgetItem.fulfilled, (state, action) => {
        const exists = state.items.find((i) => i._id === action.payload._id);
        state.items = exists ? state.items.map((i) => (i._id === action.payload._id ? action.payload : i)) : [action.payload, ...state.items];
      })
      .addCase(removeBudgetItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      .addCase(fetchBudgetCategories.fulfilled, (state, action) => { state.categories = action.payload || []; });
  },
});

export const { setActiveMonth } = budgetsSlice.actions;
export default budgetsSlice.reducer;
