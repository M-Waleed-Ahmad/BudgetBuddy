import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getCurrentMonthSpendingTotal,
  getCurrentMonthBudget,
  getSpendingTrends,
  getSmartRecommendations,
  getCashflowReport,
  getRecentExpenses,
} from '../../api/api.js';

const initialState = {
  chartsData: { trends: null, recommendations: null, spendingTotal: 0, budget: null, recentExpenses: [] },
  cashFlowSummary: null,
  status: 'idle',
  cashflowStatus: 'idle',
  error: null,
  params: { period: 'this-month', planId: null },
};

export const fetchSummaryReport = createAsyncThunk('reports/fetchSummaryReport', async ({ period = 'this-month', planId = null } = {}, thunkAPI) => {
  try {
    const [spending, budget, trends, insights, recentExpenses] = await Promise.all([
      getCurrentMonthSpendingTotal(),
      getCurrentMonthBudget(),
      getSpendingTrends(9),
      getSmartRecommendations({ period, planId }),
      getRecentExpenses(5),
    ]);
    return { spending, budget, trends, insights, recentExpenses, params: { period, planId } };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load summary report');
  }
});

export const fetchCashFlowReport = createAsyncThunk('reports/fetchCashFlowReport', async (filters, thunkAPI) => {
  try {
    const res = await getCashflowReport(filters);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load cashflow');
  }
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummaryReport.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchSummaryReport.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.chartsData.trends = action.payload.trends;
        state.chartsData.recommendations = action.payload.insights;
        state.chartsData.spendingTotal = action.payload.spending || 0;
        state.chartsData.budget = action.payload.budget || null;
        state.chartsData.recentExpenses = action.payload.recentExpenses || [];
        state.params = action.payload.params || state.params;
      })
      .addCase(fetchSummaryReport.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(fetchCashFlowReport.pending, (state) => { state.cashflowStatus = 'loading'; })
      .addCase(fetchCashFlowReport.fulfilled, (state, action) => { state.cashflowStatus = 'succeeded'; state.cashFlowSummary = action.payload; })
      .addCase(fetchCashFlowReport.rejected, (state, action) => { state.cashflowStatus = 'failed'; state.error = action.payload; });
  },
});

export default reportsSlice.reducer;
