import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  activeMenuItem: '/dashboard',
  theme: typeof localStorage !== 'undefined' ? localStorage.getItem('theme') || 'system' : 'system',
  isLoadingGlobal: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.isSidebarOpen = !state.isSidebarOpen; },
    setSidebarOpen: (state, action) => { state.isSidebarOpen = action.payload; },
    setActiveMenuItem: (state, action) => { state.activeMenuItem = action.payload; },
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    setGlobalLoading: (state, action) => { state.isLoadingGlobal = action.payload; },
  },
});

export const { toggleSidebar, setSidebarOpen, setActiveMenuItem, setTheme, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;
