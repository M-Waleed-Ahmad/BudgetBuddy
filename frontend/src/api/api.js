const BASE_URL = 'http://localhost:5000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
  };
};

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

// --- Profile API Functions ---

export const getUserProfile = async () => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
  }
  return data;
};

export const updateUserProfile = async (profileData) => {
  // Only send fields that might change (don't send email usually)
  // Filter out empty password field if user didn't enter a new one
  const updateData = { ...profileData };
  if (!updateData.password) {
      delete updateData.password;
  }

  const response = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
  });
  const data = await response.json();
  if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
  }
  return data; // Return updated profile data
};

// --- Cloudinary Upload Helper (Unsigned) ---
export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  // Note: No API key/secret needed here for unsigned uploads

  try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
      });
      const data = await response.json();
      if (!response.ok || data.error) {
          throw new Error(data.error?.message || 'Cloudinary upload failed');
      }
      console.log('Cloudinary Upload Response:', data);
      return data.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error; // Re-throw the error to be caught by the caller
  }
};

export const updateCurrencyPreference = async (dataToUpdate) => {
  console.log("Updating currency preference:", dataToUpdate);
  const response = await fetch(`${BASE_URL}/user/profile/currency`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currency_preference: dataToUpdate.currency_preference,expenseApproval:dataToUpdate.expenseApproval }), // Send only the currency preference
  });
  const data = await response.json();
  console.log("Response from currency preference update:", data); // Debugging line
  if (!response.ok) {
      throw new Error(data.message || 'Failed to update currency preference');
  }
  return data; // Return updated profile data
}

export const updateUI = async (dataToUpdate) => {
  console.log("Updating UI preferences:", dataToUpdate);
  const response = await fetch(`${BASE_URL}/user/profile/ui`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ darkMode: dataToUpdate.darkMode, language: dataToUpdate.language }), // Send only the UI preferences
  });
  const data = await response.json();
  console.log("Response from UI preference update:", data); // Debugging line
  if (!response.ok) {
      throw new Error(data.message || 'Failed to update UI preferences');
  }
  return data; // Return updated profile data
}
// --- Category APIs ---
export const getCategories = async () => {
  const response = await fetch(`${BASE_URL}/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');
  return data; // Expects an array of categories
};

export const addCategory = async (categoryData) => { // categoryData = { name: 'New Category' }
  const response = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to add category');
  return data; // Returns the newly created category object
};

export const updateCategory = async (categoryId, categoryData) => { // categoryData = { name: 'Updated Name' }
  const response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update category');
  return data; // Returns the updated category object
};

export const deleteCategory = async (categoryId) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
  });
  const data = await response.json(); // May just contain { message: '...' }
  if (!response.ok) throw new Error(data.message || 'Failed to delete category');
  return data;
};


// --- Invitation API Functions ---

export const getPendingInvitations = async () => {
  const response = await fetch(`${BASE_URL}/invites/pending`, { // Assuming this endpoint exists
      method: 'GET',
      headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch pending invitations');
  // The backend should ideally populate 'inviter_user_id' and 'plan_id' names
  // Example expected data: [{ id: '...', plan_name: '...', inviter_name: '...', role_assigned: '...', ... }]
  return data;
};

export const acceptInvitation = async (inviteId) => {
  const response = await fetch(`${BASE_URL}/invites/${inviteId}/accept`, { // Assuming this endpoint exists
      method: 'POST', // Or PUT
      headers: getAuthHeaders(),
      // No body usually needed unless sending extra info
  });
  const data = await response.json(); // Expect success message or updated membership info
  if (!response.ok) throw new Error(data.message || 'Failed to accept invitation');
  return data;
};

export const rejectInvitation = async (inviteId) => {
  const response = await fetch(`${BASE_URL}/invites/${inviteId}/reject`, { // Assuming this endpoint exists
      method: 'POST', // Or DELETE if it removes the invite
      headers: getAuthHeaders(),
  });
  const data = await response.json(); // Expect success message
  if (!response.ok) throw new Error(data.message || 'Failed to reject invitation');
  return data;
};
