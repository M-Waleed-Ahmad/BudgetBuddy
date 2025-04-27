const BASE_URL = 'http://localhost:5000/api';

// Auth APIs
export const loginUser = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

export const signupUser = async (formData) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    return data;
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
};
export const logoutUser = async () => {
  const token = localStorage.getItem('token'); 

  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // Send the token
    },
  });

  if (!response.ok) {
    console.warn('Backend logout call failed, but proceeding with client-side logout.');

  }

  return { message: 'Logout initiated' }; 
};

