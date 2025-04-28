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



export const getCurrentMonthBudget = async () => {
  try {
    const response = await fetch(`${BASE_URL}/monthly-budgets/current`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 404) {
        return { message: 'Budget for the current month not found' };
      }
      throw new Error(data.message || 'Failed to fetch current month budget');
    }

    return data; // Return the budget data if found
  } catch (error) {
    console.error('❌ Error fetching current month budget:', error);
    throw error;
  }
};

export const createMonthlyBudget = async (budgetData) => {
  try {
    console.log("Creating monthly budget with data:", budgetData); // Debugging line
    const response = await fetch(`${BASE_URL}/monthly-budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(budgetData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create monthly budget');
    }

    return data; // Return the created budget data
  } catch (error) {
    console.error('❌ Error creating monthly budget:', error);
    throw error;
  }
}
export const updateMonthlyBudget = async (budgetId, budgetData) => {
  try {
    const response = await fetch(`${BASE_URL}/monthly-budgets/${budgetId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(budgetData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update monthly budget');
    }

    return data; // Return the updated budget data
  } catch (error) {
    console.error('❌ Error updating monthly budget:', error);
    throw error;
  }
}

// --- Budget Item APIs ---
export const addBudgetItem = async (itemData) => {
  try {
    console.log("Adding budget item with data:", itemData); // Debugging line
    const response = await fetch(`${BASE_URL}/budgets/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add budget item');
    }

    return data; // Return the added budget item data
  } catch (error) {
    console.error('❌ Error adding budget item:', error);
    throw error;
  }
}
export const updateBudgetItem = async (itemId, itemData) => { // Takes the specific item's ID and the data
  if (!itemId) {
    console.error("Item ID is required for update");
    throw new Error("Item ID is required");
  }
  try {
    // Correct endpoint: PUT /api/budgets/:id
    const response = await fetch(`${BASE_URL}/budgets/${itemId}`, { // Use itemId directly
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData), // Send only the fields to be updated
    });

    const data = await response.json();
    if (!response.ok) {
      // Use the error message from the backend if available
      throw new Error(data.message || `Failed to update budget item (ID: ${itemId})`);
    }

    // Return the updated budget item data (backend sends it due to {new: true})
    return data;
  } catch (error) {
    console.error(`❌ Error updating budget item ${itemId}:`, error);
    throw error; // Re-throw the error for the component to catch
  }
}


export const deleteBudgetItem = async (itemId) => { // Takes the specific item's ID
  if (!itemId) {
      console.error("Item ID is required for delete");
      throw new Error("Item ID is required");
  }
  try {
      // Correct endpoint: DELETE /api/budgets/:id
      const response = await fetch(`${BASE_URL}/budgets/${itemId}`, { // Use itemId directly
          method: 'DELETE',
          headers: getAuthHeaders(),
          // No body needed for DELETE
      });

      // Check for successful deletion (status 200 OK with message, or 204 No Content)
      if (response.status === 204) {
          return { message: 'Budget item deleted successfully' }; // Simulate a success message if backend sends 204
      }

      const data = await response.json(); // Try to parse JSON for potential error messages or success message
      if (!response.ok) {
          // Use the error message from the backend if available
          throw new Error(data.message || `Failed to delete budget item (ID: ${itemId})`);
      }

      // Return success data/message from backend if status was 200
      return data;
  } catch (error) {
      console.error(`❌ Error deleting budget item ${itemId}:`, error);
      throw error; // Re-throw the error for the component to catch
  }
}


export const getBudgetsForMonth = async (monthYear) => { // Accepts YYYY-MM format
  if (!monthYear) {
    console.error("MonthYear is required for getBudgetsForMonth");
    throw new Error("MonthYear is required");
  }
  try {
    // Call the GET endpoint with monthYear as a query parameter
    const response = await fetch(`${BASE_URL}/budgets?monthYear=${monthYear}`, { // Note the query param
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch budget items for the month');
    }

    // Expecting an array of budget items like:
    // [{ _id: '...', user_id: '...', month_year: '...', limit_amount: ..., category_id: { _id: 'cat1', name: 'Food'}, description: '...' }, ...]
    return data;
  } catch (error) {
    console.error(`❌ Error fetching budget items for ${monthYear}:`, error);
    throw error;
  }
}




