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






// api/api.js

// Assume BASE_URL and getAuthHeaders() are defined elsewhere in this file or imported
// Example:
// const BASE_URL = '/api'; // Or e.g., 'http://localhost:5001/api'
// const getAuthHeaders = () => {
//     const token = localStorage.getItem('authToken'); // Or however you store your token
//     return {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//     };
// };


// ==========================================================================
// Expense APIs
// ==========================================================================

/**
 * Fetches expenses for the current user within the date range defined
 * by their active MonthlyBudget plan for the current calendar month.
 * @async
 * @returns {Promise<{expenses: Array<object>, totalSpent: number}>} Object containing the list of expenses and the total amount spent.
 * @throws {Error} If the fetch fails or the response is not ok.
 */
export const fetchExpensesForCurrentMonth = async () => {
  const endpoint = `${BASE_URL}/expenses/current-month-plan`;
  console.log(`API Call: GET ${endpoint}`); // Debug log
  try {
      const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to fetch expenses (Status: ${response.status})`);
      }

      // Ensure the returned object has the expected structure
      return {
          expenses: data.expenses || [],
          totalSpent: data.totalSpent || 0
      };
  } catch (error) {
      console.error('❌ Network/Fetch Error in fetchExpensesForCurrentMonth:', error);
      // Re-throw the specific error message or a generic one
      throw new Error(error.message || 'Network error while fetching current month expenses.');
  }
};

/**
* Adds a new expense record for the logged-in user.
* @async
* @param {object} expenseData - The expense data.
* @param {string} expenseData.category_id - The ID of the category.
* @param {number} expenseData.amount - The expense amount (positive number).
* @param {string} expenseData.expense_date - The date of the expense (YYYY-MM-DD or ISO string).
* @param {string} [expenseData.description] - Optional description.
* @returns {Promise<object>} The newly created expense object (potentially populated by the backend).
* @throws {Error} If the fetch fails or the response is not ok.
*/
export const addExpense = async (expenseData) => {
  const endpoint = `${BASE_URL}/expenses`;
  console.log(`API Call: POST ${endpoint} with data:`, expenseData); // Debug log
  try {
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to add expense (Status: ${response.status})`);
      }

      return data; // Returns the saved expense object
  } catch (error) {
      console.error('❌ Network/Fetch Error in addExpense:', error);
      throw new Error(error.message || 'Network error while adding expense.');
  }
};

/**
* Updates an existing expense record.
* @async
* @param {string} expenseId - The ID (_id) of the expense to update.
* @param {object} expenseData - An object containing the fields to update.
* @param {string} [expenseData.category_id] - Optional new category ID.
* @param {number} [expenseData.amount] - Optional new amount (positive number).
* @param {string} [expenseData.expense_date] - Optional new date (YYYY-MM-DD or ISO string).
* @param {string} [expenseData.description] - Optional new description.
* @returns {Promise<object>} The updated expense object (potentially populated by the backend).
* @throws {Error} If expenseId is missing, fetch fails, or response is not ok.
*/
export const updateExpense = async (expenseId, expenseData) => {
  if (!expenseId) {
      console.error("Update Expense Error: expenseId is required.");
      throw new Error("Expense ID is required for update");
  }
  const endpoint = `${BASE_URL}/expenses/${expenseId}`;
  console.log(`API Call: PUT ${endpoint} with data:`, expenseData); // Debug log
  try {
      const response = await fetch(endpoint, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to update expense (Status: ${response.status})`);
      }

      return data; // Returns the updated expense object
  } catch (error) {
      console.error(`❌ Network/Fetch Error in updateExpense (ID: ${expenseId}):`, error);
      throw new Error(error.message || 'Network error while updating expense.');
  }
};

/**
* Deletes an expense record.
* @async
* @param {string} expenseId - The ID (_id) of the expense to delete.
* @returns {Promise<object>} Success message object (e.g., { message: '...' }) or empty for 204.
* @throws {Error} If expenseId is missing, fetch fails, or response indicates an error.
*/
export const deleteExpense = async (expenseId) => {
  if (!expenseId) {
      console.error("Delete Expense Error: expenseId is required.");
      throw new Error("Expense ID is required for delete");
  }
  const endpoint = `${BASE_URL}/expenses/${expenseId}`;
  console.log(`API Call: DELETE ${endpoint}`); // Debug log
  try {
      const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: getAuthHeaders(),
      });

      // Handle 204 No Content specifically - success, but no body to parse
      if (response.status === 204) {
          console.log(`API Success (204) from ${endpoint}`);
          return { message: 'Expense deleted successfully' }; // Provide consistent success feedback
      }

      const data = await response.json(); // Only parse if not 204

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to delete expense (Status: ${response.status})`);
      }

      console.log(`API Success (${response.status}) from ${endpoint}:`, data);
      return data; // Return success message from backend if status 200/OK
  } catch (error) {
      console.error(`❌ Network/Fetch Error in deleteExpense (ID: ${expenseId}):`, error);
      // Check if the error is due to trying to parse JSON from an empty 204 response
      if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
           // This can happen if the server sends 204 but fetch still tries parsing. Treat as success.
           console.warn("Caught SyntaxError likely due to 204 No Content response. Treating as success.");
           return { message: 'Expense deleted successfully' };
      }
      throw new Error(error.message || 'Network error while deleting expense.');
  }
};

export const getCategoryWiseSpendingForCurrentMonth = async () => {
  const endpoint = `${BASE_URL}/expenses/current-month/category-wise`;
  console.log(`API Call: GET ${endpoint}`); // Debug log
  try {
      const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to fetch category-wise spending (Status: ${response.status})`);
      }

      return data; // Returns the category-wise spending data
  } catch (error) {
      console.error('❌ Network/Fetch Error in getCategoryWiseSpendingForCurrentMonth:', error);
      throw new Error(error.message || 'Network error while fetching category-wise spending.');
  }
};


// api/api.js or api/familyApi.js

// Assume BASE_URL and getAuthHeaders() are defined elsewhere
// Example:
// const BASE_URL = '/api';
// const getAuthHeaders = () => { /* ... returns headers with Authorization ... */ };

// ==========================================================================
// Family Plan API Functions
// ==========================================================================

/**
 * Fetches all family plans the logged-in user is a member of.
 * @async
 * @returns {Promise<Array<object>>} Array of plan objects [{ _id, planId, name, userRole }, ...]
 * @throws {Error} If fetch fails or response is not ok.
 */
export const getUserFamilyPlans = async () => {
  const endpoint = `${BASE_URL}/family-plans`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to fetch family plans (Status: ${response.status})`);
      }
      return data || []; // Return fetched plans or empty array
  } catch (error) {
      console.error('❌ Network/Fetch Error in getUserFamilyPlans:', error);
      throw new Error(error.message || 'Network error while fetching family plans.');
  }
};

/**
* Creates a new family plan.
* @async
* @param {object} planData - Data for the new plan.
* @param {string} planData.plan_name - The name of the plan.
* @param {number} [planData.total_budget_amount] - Optional overall budget target.
* @param {string} [planData.start_date] - Optional start date (YYYY-MM-DD).
* @param {string} [planData.end_date] - Optional end date (YYYY-MM-DD).
* @param {string} [planData.currency] - Optional currency code (e.g., 'USD').
* @returns {Promise<object>} The newly created family plan object.
* @throws {Error} If fetch fails or response is not ok.
*/
export const addFamilyPlan = async (planData) => {
  const endpoint = `${BASE_URL}/family-plans`;
  console.log(`API Call: POST ${endpoint} with data:`, planData);
  try {
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(), // Includes 'Content-Type': 'application/json'
          body: JSON.stringify(planData),
      });
      const data = await response.json();
      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to create family plan (Status: ${response.status})`);
      }
      return data; // Return the created plan object
  } catch (error) {
      console.error('❌ Network/Fetch Error in addFamilyPlan:', error);
      throw new Error(error.message || 'Network error while creating family plan.');
  }
};

/**
* Updates the settings of a specific family plan.
* User must be an admin of the plan.
* @async
* @param {string} planId - The ID (_id) of the plan to update.
* @param {object} settingsData - Data containing the fields to update.
* @param {string} [settingsData.plan_name] - New plan name.
* @param {number} [settingsData.total_budget_amount] - New overall budget target.
* @param {string} [settingsData.start_date] - New start date (YYYY-MM-DD).
* @param {string} [settingsData.end_date] - New end date (YYYY-MM-DD).
* @param {string} [settingsData.currency] - New currency code.
* @returns {Promise<object>} The updated family plan object.
* @throws {Error} If planId is missing, fetch fails, or response is not ok.
*/
export const updatePlanSettings = async (planId, settingsData) => {
  if (!planId) {
      console.error("Update Plan Error: planId is required.");
      throw new Error("Plan ID is required for update");
  }
  const endpoint = `${BASE_URL}/family-plans/${planId}`;
  console.log(`API Call: PUT ${endpoint} with data:`, settingsData);
  try {
      const response = await fetch(endpoint, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(settingsData),
      });
      const data = await response.json();
      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to update plan settings (Status: ${response.status})`);
      }
      return data; // Return the updated plan object
  } catch (error) {
      console.error(`❌ Network/Fetch Error in updatePlanSettings (ID: ${planId}):`, error);
      throw new Error(error.message || 'Network error while updating plan settings.');
  }
};

/**
* Deletes an entire family plan and all associated data.
* User must be an admin of the plan.
* @async
* @param {string} planId - The ID (_id) of the plan to delete.
* @returns {Promise<object>} Success message object (e.g., { message: '...' }).
* @throws {Error} If planId is missing, fetch fails, or response indicates an error.
*/
export const deleteFamilyPlan = async (planId) => {
  if (!planId) {
      console.error("Delete Plan Error: planId is required.");
      throw new Error("Plan ID is required for delete");
  }
  const endpoint = `${BASE_URL}/family-plans/${planId}`;
  console.log(`API Call: DELETE ${endpoint}`);
  try {
      const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: getAuthHeaders(), // Auth header is usually sufficient
      });

      // Handle 204 No Content specifically
      if (response.status === 204) {
          console.log(`API Success (204) from ${endpoint}`);
          return { message: 'Plan deleted successfully' };
      }

      const data = await response.json(); // Only parse if not 204

      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to delete plan (Status: ${response.status})`);
      }

      console.log(`API Success (${response.status}) from ${endpoint}:`, data);
      return data; // Return success message from backend if status 200/OK
  } catch (error) {
      console.error(`❌ Network/Fetch Error in deleteFamilyPlan (ID: ${planId}):`, error);
      // Handle potential JSON parsing error for 204 response defensively
      if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
           console.warn("Caught SyntaxError likely due to 204 No Content. Treating as success.");
           return { message: 'Plan deleted successfully' };
      }
      throw new Error(error.message || 'Network error while deleting plan.');
  }
};

/**
* Fetches details of a specific family plan.
* @async
* @param {string} planId - The ID (_id) of the plan to fetch.
* @returns {Promise<object>} The family plan object with all details.
* @throws {Error} If planId is missing, fetch fails, or response is not ok.
*/
export const getPlanDetails = async (planId) => {
  if (!planId) {
      console.error("Get Plan Details Error: planId is required.");
      throw new Error("Plan ID is required to fetch details");
  }
  const endpoint = `${BASE_URL}/family-plans/${planId}`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
          console.error(`API Error (${response.status}) from ${endpoint}:`, data);
          throw new Error(data.message || `Failed to fetch plan details (Status: ${response.status})`);
      }
      return data; // Return the fetched plan object
  } catch (error) {
      console.error(`❌ Network/Fetch Error in getFamilyPlanDetails (ID: ${planId}):`, error);
      throw new Error(error.message || 'Network error while fetching plan details.');
  }
};



// api/api.js or api/familyApi.js
// Assuming BASE_URL and getAuthHeaders are defined

// --- Family Member APIs ---

/**
 * Fetches the list of members for a specific family plan.
 * @async
 * @param {string} planId - The ID of the family plan.
 * @returns {Promise<Array<object>>} Array of member objects [{ _id, user: { _id, name, email, avatar }, role, planId }, ...]
 * @throws {Error} If planId is missing, fetch fails, or response is not ok.
 */
export const getPlanMembers = async (planId) => {
  if (!planId) throw new Error("Plan ID is required to fetch members.");
  const endpoint = `${BASE_URL}/family-members/${planId}/members`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      console.log(`API Call: GET ${endpoint}`); // Debug log
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to fetch members (Status: ${response.status})`);
      return data || [];
  } catch (error) { console.error(`❌ Error fetching members for plan ${planId}:`, error); throw error; }
};

/**
* Invites a user to join a family plan by email.
* @async
* @param {string} planId - The ID of the plan to invite to.
* @param {object} inviteData - Invitation details.
* @param {string} inviteData.invitee_email - Email of the user to invite.
* @param {'viewer' | 'editor'} inviteData.role_assigned - Role to assign upon acceptance.
* @returns {Promise<object>} Object containing success message and invite details.
* @throws {Error} If planId/data is missing, fetch fails, or response is not ok.
*/
export const inviteMember = async (planId, inviteData) => {
  if (!planId || !inviteData?.invitee_email || !inviteData?.role_assigned) {
      throw new Error("Plan ID, invitee email, and role are required.");
  }
  const endpoint = `${BASE_URL}/family-members/${planId}/invites`;
  console.log(`API Call: POST ${endpoint} with data:`, inviteData);
  try {
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(), // Includes Content-Type
          body: JSON.stringify(inviteData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to send invitation (Status: ${response.status})`);
      return data; // { message: '...', invite: {...} }
  } catch (error) { console.error(`❌ Error inviting member to plan ${planId}:`, error); throw error; }
};

/**
* Updates the role of a member within a family plan.
* Requires admin privileges on the plan.
* @async
* @param {string} planId - The ID of the family plan.
* @param {string} memberUserId - The user ID (_id) of the member whose role is being changed.
* @param {{role: 'viewer' | 'editor' | 'admin'}} roleData - Object containing the new role.
* @returns {Promise<object>} Object containing success message and updated membership details.
* @throws {Error} If IDs/data are missing, fetch fails, or response is not ok.
*/
export const updateMemberRole = async (planId, memberUserId, roleData) => {
  if (!planId || !memberUserId || !roleData?.role) {
      throw new Error("Plan ID, Member User ID, and new Role are required.");
  }
  const endpoint = `${BASE_URL}/family-members/${planId}/members/${memberUserId}`;
  console.log(`API Call: PUT ${endpoint} with data:`, roleData);
  try {
      const response = await fetch(endpoint, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(roleData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to update role (Status: ${response.status})`);
      return data; // { message: '...', membership: {...} }
  } catch (error) { console.error(`❌ Error updating role for member ${memberUserId} in plan ${planId}:`, error); throw error; }
};

/**
* Removes a member from a family plan.
* Requires admin privileges on the plan.
* @async
* @param {string} planId - The ID of the family plan.
* @param {string} memberUserId - The user ID (_id) of the member to remove.
* @returns {Promise<object>} Success message object.
* @throws {Error} If IDs are missing, fetch fails, or response is not ok.
*/
export const removeMember = async (planId, memberUserId) => {
  if (!planId || !memberUserId) throw new Error("Plan ID and Member User ID are required.");
  const endpoint = `${BASE_URL}/family-members/${planId}/members/${memberUserId}`;
  console.log(`API Call: DELETE ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.status === 204) return { message: 'Member removed successfully.' }; // Handle No Content
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to remove member (Status: ${response.status})`);
      return data; // { message: '...' }
  } catch (error) {
       if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
            console.warn("Caught SyntaxError likely due to 204 No Content. Treating as success.");
            return { message: 'Member removed successfully.' };
       }
      console.error(`❌ Error removing member ${memberUserId} from plan ${planId}:`, error);
      throw error;
  }
};

// --- Family Expense APIs ---

/**
 * Fetches all expenses for a specific family plan.
 * @async
 * @param {string} planId - The ID of the family plan.
 * @returns {Promise<Array<object>>} Array of expense objects.
 * @throws {Error} If planId is missing, fetch fails, or response is not ok.
 */
export const getExpensesByPlan = async (planId) => {
  if (!planId) throw new Error("Plan ID is required to fetch expenses.");
  const endpoint = `${BASE_URL}/family-expenses/plan/${planId}`;
  console.log(`API Call: GET ${endpoint}`);
  try {
    const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to fetch expenses (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching expenses for plan ${planId}:`, error);
    throw error;
  }
};

/**
 * Fetches all expenses for a specific family plan and user.
 * @async
 * @param {string} planId - The ID of the family plan.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} Array of expense objects.
 * @throws {Error} If IDs are missing, fetch fails, or response is not ok.
 */
export const getExpensesByPlanAndUser = async (planId) => {
  if (!planId) throw new Error("Plan ID and User ID are required to fetch expenses.");
  const endpoint = `${BASE_URL}/family-expenses/plan/${planId}/user/`;
  console.log(`API Call: GET ${endpoint}`);
  try {
    const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to fetch expenses (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching expenses for plan ${planId} `, error);
    throw error;
  }
};

/**
 * Fetches a single expense by its ID.
 * @async
 * @param {string} expenseId - The ID of the expense.
 * @returns {Promise<object>} The expense object.
 * @throws {Error} If expenseId is missing, fetch fails, or response is not ok.
 */
export const getExpenseById = async (expenseId) => {
  if (!expenseId) throw new Error("Expense ID is required to fetch the expense.");
  const endpoint = `${BASE_URL}/family-expenses/${expenseId}`;
  console.log(`API Call: GET ${endpoint}`);
  try {
    const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to fetch expense (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching expense ${expenseId}:`, error);
    throw error;
  }
};

/**
 * Creates a new family expense.
 * @async
 * @param {object} expenseData - The expense data.
 * @returns {Promise<object>} The newly created expense object.
 * @throws {Error} If fetch fails or response is not ok.
 */
export const createFamilyExpense = async (planId, expenseData) => {
  const endpoint = `${BASE_URL}/family-expenses`;
  console.log(`API Call: POST ${endpoint} with data:`, expenseData);
  try {
    const payload = {
      plan_id: planId,
      ...expenseData,
      expense_date: expenseData.date, // map frontend 'date' to backend 'expense_date'
      status: 'pending',               // or any default you'd like
      approved_by_user_id: null,       // initially null or however your logic dictates
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to create expense (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error('❌ Error creating expense:', error);
    throw error;
  }
};


/**
 * Updates an existing family expense.
 * @async
 * @param {string} expenseId - The ID of the expense to update.
 * @param {object} expenseData - The updated expense data.
 * @returns {Promise<object>} The updated expense object.
 * @throws {Error} If expenseId is missing, fetch fails, or response is not ok.
 */
export const updateFamilyExpense = async (expenseId, expenseData) => {
  if (!expenseId) throw new Error("Expense ID is required to update the expense.");
  const endpoint = `${BASE_URL}/family-expenses/${expenseId}`;
  console.log(`API Call: PUT ${endpoint} with data:`, expenseData);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(expenseData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to update expense (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error(`❌ Error updating expense ${expenseId}:`, error);
    throw error;
  }
};

/**
 * Deletes a family expense by its ID.
 * @async
 * @param {string} expenseId - The ID of the expense to delete.
 * @returns {Promise<object>} Success message object.
 * @throws {Error} If expenseId is missing, fetch fails, or response is not ok.
 */
export const deleteFamilyExpense = async (expenseId) => {
  if (!expenseId) throw new Error("Expense ID is required to delete the expense.");
  const endpoint = `${BASE_URL}/family-expenses/${expenseId}`;
  console.log(`API Call: DELETE ${endpoint}`);
  try {
    const response = await fetch(endpoint, { method: 'DELETE', headers: getAuthHeaders() });
    if (response.status === 204) return { message: 'Expense deleted successfully.' };
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to delete expense (Status: ${response.status})`);
    return data;
  } catch (error) {
    console.error(`❌ Error deleting expense ${expenseId}:`, error);
    throw error;
  }
};

export const approveFamilyExpense = async (expenseId) => {
  if (!expenseId) throw new Error("Expense ID is required to approve the expense.");
  const endpoint = `${BASE_URL}/family-expenses/approve/${expenseId}`;
  console.log(`API Call: PUT ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to approve expense (Status: ${response.status})`);
    return data; // Returns the approved expense object
  } catch (error) {
    console.error(`❌ Error approving expense ${expenseId}:`, error);
    throw error;
  }
}
export const rejectFamilyExpense = async (expenseId) => {
  if (!expenseId) throw new Error("Expense ID is required to reject the expense.");
  const endpoint = `${BASE_URL}/family-expenses/reject/${expenseId}`;
  console.log(`API Call: PUT ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Failed to reject expense (Status: ${response.status})`);
    return data; // Returns the rejected expense object
  } catch (error) {
    console.error(`❌ Error rejecting expense ${expenseId}:`, error);
    throw error;
  }
}



// api/api.js

// Assume BASE_URL and getAuthHeaders() are defined elsewhere
// const BASE_URL = '/api';
// const getAuthHeaders = () => ({ /* ... headers ... */ });

// --- User API ---
export const getMyProfile = async () => {
  const endpoint = `${BASE_URL}/user/me`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
      return data;
  } catch (error) { console.error('❌ Error getMyProfile:', error); throw error; }
};

export const getRecentExpenses = async (limit = 3) => {
  const endpoint = `${BASE_URL}/expenses/recent?limit=${3}&sort=-expense_date`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch recent expenses');
      return data || [];
  } catch (error) {
      console.error('❌ Error getRecentExpenses:', error);
      throw error;
  }
};

export const getCurrentMonthSpendingTotal = async () => {
  const endpoint = `${BASE_URL}/expenses/current-month-total`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch spending total');
      return data.totalSpent || 0; // Return the number
  } catch (error) { console.error('❌ Error getCurrentMonthSpendingTotal:', error); throw error; }
};

export const getSpendingTrends = async (months = 9) => {
  const endpoint = `${BASE_URL}/expenses/trends?period=monthly&months=${months}`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch spending trends');
      return data || { months: [], categories: [] }; // Ensure default structure
  } catch (error) { console.error('❌ Error getSpendingTrends:', error); throw error; }
};


// --- Notifications API ---

export const getNotifications = async () => {
  const endpoint = `${BASE_URL}/notifications`;
  console.log(`API Call: GET ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'GET', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
      return data || []; // Return empty array if no notifications
  } catch (error) { console.error('❌ Error getNotifications:', error); throw error; }
}

export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) throw new Error("Notification ID is required to mark as read.");
  const endpoint = `${BASE_URL}/notifications/${notificationId}`;
  console.log(`API Call: PUT ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'PUT', headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to mark notification as read');
      return data; // Return the updated notification object
  } catch (error) { console.error(`❌ Error markNotificationAsRead ${notificationId}:`, error); throw error; }
};


export const deleteNotification = async (notificationId) => {
  if (!notificationId) throw new Error("Notification ID is required to delete.");
  const endpoint = `${BASE_URL}/notifications/${notificationId}`;
  console.log(`API Call: DELETE ${endpoint}`);
  try {
      const response = await fetch(endpoint, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.status === 204) return { message: 'Notification deleted successfully.' }; // Handle No Content
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete notification');
      return data; // Return success message from backend if status 200/OK
  } catch (error) {
       if (error instanceof SyntaxError && error.message.includes('Unexpected end of JSON input')) {
            console.warn("Caught SyntaxError likely due to 204 No Content. Treating as success.");
            return { message: 'Notification deleted successfully' };
       }
      console.error(`❌ Error deleting notification ${notificationId}:`, error);
      throw error;
  }
};

