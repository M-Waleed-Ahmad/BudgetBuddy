import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../api/api.js';

const initialState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (_, thunkAPI) => {
  try {
    const res = await getNotifications();
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to load notifications');
  }
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, thunkAPI) => {
  try {
    const res = await markNotificationAsRead(id);
    return res;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to mark as read');
  }
});

export const deleteNote = createAsyncThunk('notifications/deleteNote', async (id, thunkAPI) => {
  try {
    await deleteNotification(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message || 'Failed to delete notification');
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload?.is_read) state.unreadCount += 1;
    },
    markAllAsRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, is_read: true }));
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.unreadCount = (action.payload || []).filter((n) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.items = state.items.map((n) => (n._id === action.payload._id ? action.payload : n));
        state.unreadCount = state.items.filter((n) => !n.is_read).length;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload);
        state.unreadCount = state.items.filter((n) => !n.is_read).length;
      });
  },
});

export const { addNotification, markAllAsRead, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
