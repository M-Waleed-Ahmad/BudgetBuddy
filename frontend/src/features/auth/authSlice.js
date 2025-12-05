import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginUser, signupUser, logoutUser, getUserProfile } from '../../api/api.js';

const initialState = {
  user: null,
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: !!(typeof localStorage !== 'undefined' && localStorage.getItem('token')),
  loading: false,
  error: null,
};

export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    const res = await loginUser(payload);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (payload, thunkAPI) => {
  try {
    const res = await signupUser(payload);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Signup failed');
  }
});

export const loadCurrentUser = createAsyncThunk('auth/loadCurrentUser', async (_, thunkAPI) => {
  try {
    const res = await getUserProfile();
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load user');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutUser();
  } catch (err) {
    // backend logout failure is non-blocking
    console.warn('Logout API failed:', err);
  } finally {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user || null;
      state.token = action.payload.token || null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
    setAuthLoading: (state, action) => { state.loading = action.payload; },
    setAuthError: (state, action) => { state.error = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = !!action.payload.token;
        if (action.payload.token && typeof localStorage !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = !!action.payload.token;
        if (action.payload.token && typeof localStorage !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(loadCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload || null;
        state.isAuthenticated = !!state.token;
      })
      .addCase(loadCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setCredentials, clearAuth, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
