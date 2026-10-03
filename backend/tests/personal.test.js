const { setupDatabase, createUser, today, currentMonth } = require('./helpers');

setupDatabase();

async function seedCategory(client, name = 'Groceries') {
  const res = await client.post('/api/categories', { name });
  expect(res.status).toBe(201);
  return res.body;
}

describe('categories', () => {
  it('prevents case-insensitive duplicates', async () => {
    const { client } = await createUser();
    await seedCategory(client, 'Rent');
    const dup = await client.post('/api/categories', { name: 'rent' });
    expect(dup.status).toBe(409);
  });

  it('refuses to delete a category that is in use', async () => {
    const { client } = await createUser();
    const category = await seedCategory(client);
    await client.post('/api/expenses', { category_id: category._id, amount: 10, expense_date: today() });

    const res = await client.delete(`/api/categories/${category._id}`);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/1 expense/);
  });
});

describe('monthly budgets', () => {
  it('stores the submitted amount and derives the month from the start date', async () => {
    const { client } = await createUser();
    const res = await client.post('/api/monthly-budgets', {
      total_budget_amount: 50000,
      start_date: '2026-03-01',
      end_date: '2026-03-31',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ total_budget_amount: 50000, month_year: '2026-03' });

    const dup = await client.post('/api/monthly-budgets', {
      total_budget_amount: 1,
      start_date: '2026-03-05',
      end_date: '2026-03-20',
    });
    expect(dup.status).toBe(409);
  });

  it('rejects an end date before the start date', async () => {
    const { client } = await createUser();
    const res = await client.post('/api/monthly-budgets', {
      total_budget_amount: 100,
      start_date: '2026-03-10',
      end_date: '2026-03-01',
    });
    expect(res.status).toBe(400);
  });

  it('returns null when there is no current budget, then the active one', async () => {
    const { client } = await createUser();
    expect((await client.get('/api/monthly-budgets/current')).body).toBeNull();

    await client.post('/api/monthly-budgets', { total_budget_amount: 900, start_date: today(), end_date: today() });
    const current = await client.get('/api/monthly-budgets/current');
    expect(current.body.total_budget_amount).toBe(900);
  });
});

describe('category budgets', () => {
  it('requires one of your own categories and one limit per category per month', async () => {
    const { client } = await createUser();
    const other = await createUser();
    const mine = await seedCategory(client);
    const theirs = await seedCategory(other.client);

    const foreign = await client.post('/api/budgets', {
      category_id: theirs._id,
      limit_amount: 100,
      month_year: currentMonth(),
    });
    expect(foreign.status).toBe(404);

    const ok = await client.post('/api/budgets', { category_id: mine._id, limit_amount: 100, month_year: currentMonth() });
    expect(ok.status).toBe(201);
    expect(ok.body.category_name).toBe('Groceries');

    const dup = await client.post('/api/budgets', { category_id: mine._id, limit_amount: 50, month_year: currentMonth() });
    expect(dup.status).toBe(409);

    const list = await client.get(`/api/budgets?monthYear=${currentMonth()}`);
    expect(list.body).toHaveLength(1);
  });
});

describe('expenses', () => {
  it('validates amounts, dates and categories', async () => {
    const { client } = await createUser();
    const category = await seedCategory(client);
    const post = (body) => client.post('/api/expenses', { category_id: category._id, amount: 5, expense_date: today(), ...body });

    expect((await post({ amount: -5 })).status).toBe(400);
    expect((await post({ amount: '0x10' })).status).toBe(400);
    expect((await post({ expense_date: '2026-02-31' })).status).toBe(400);
    expect((await post({ expense_date: true })).status).toBe(400);
    expect((await post({ category_id: undefined })).status).toBe(400);
    expect((await post({ amount: '12.50' })).body.amount).toBe(12.5);
  });

  it('ignores a monthly budget whose dates do not include today when totalling the current period', async () => {
    const { client } = await createUser();
    const food = await seedCategory(client, 'Food');
    await client.post('/api/monthly-budgets', { total_budget_amount: 100, start_date: '2001-01-05', end_date: '2001-01-20' });
    await client.post('/api/expenses', { category_id: food._id, amount: 25, expense_date: today() });

    const res = await client.get('/api/expenses/current-month-plan');
    expect(res.body.period.source).toBe('calendar');
    expect(res.body.totalSpent).toBe(25);
  });

  it('reports the same current-period total from every endpoint', async () => {
    const { client } = await createUser();
    const food = await seedCategory(client, 'Food');
    const fuel = await seedCategory(client, 'Fuel');
    await client.post('/api/expenses', { category_id: food._id, amount: 120.5, expense_date: today() });
    await client.post('/api/expenses', { category_id: food._id, amount: 30, expense_date: today() });
    await client.post('/api/expenses', { category_id: fuel._id, amount: 49.5, expense_date: today() });
    await client.post('/api/expenses', { category_id: fuel._id, amount: 999, expense_date: '2020-01-15' });

    const plan = await client.get('/api/expenses/current-month-plan');
    const total = await client.get('/api/expenses/current-month-total');
    const byCategory = await client.get('/api/expenses/current-month/category-wise');

    expect(plan.body.period.source).toBe('calendar');
    expect(plan.body.totalSpent).toBe(200);
    expect(plan.body.expenses).toHaveLength(3);
    expect(total.body.totalSpent).toBe(200);
    const sum = byCategory.body.categoryWiseSpending.reduce((acc, row) => acc + row.totalSpent, 0);
    expect(sum).toBe(200);
    expect(byCategory.body.categoryWiseSpending[0]).toMatchObject({ categoryName: 'Food', totalSpent: 150.5 });
  });

  it('builds month-by-month trends', async () => {
    const { client } = await createUser();
    const food = await seedCategory(client, 'Food');
    await client.post('/api/expenses', { category_id: food._id, amount: 40, expense_date: today() });

    const res = await client.get('/api/expenses/trends?months=3');
    expect(res.body.months).toHaveLength(3);
    expect(res.body.months[2]).toBe(currentMonth());
    expect(res.body.categories).toEqual([{ name: 'Food', data: [0, 0, 40] }]);
  });

  it('notifies once when a category budget crosses 80% and again when it is exceeded', async () => {
    const { client } = await createUser();
    const food = await seedCategory(client, 'Food');
    await client.post('/api/budgets', { category_id: food._id, limit_amount: 100, month_year: currentMonth() });

    const alerts = async () =>
      (await client.get('/api/notifications')).body.filter((n) => n.type.startsWith('budget_limit')).map((n) => n.type);

    await client.post('/api/expenses', { category_id: food._id, amount: 50, expense_date: today() });
    expect(await alerts()).toEqual([]);
    await client.post('/api/expenses', { category_id: food._id, amount: 35, expense_date: today() });
    expect(await alerts()).toEqual(['budget_limit_approaching']);
    await client.post('/api/expenses', { category_id: food._id, amount: 5, expense_date: today() });
    expect(await alerts()).toEqual(['budget_limit_approaching']);
    await client.post('/api/expenses', { category_id: food._id, amount: 20, expense_date: today() });
    expect(await alerts()).toEqual(['budget_limit_exceeded', 'budget_limit_approaching']);
  });
});

describe('data isolation between users', () => {
  it("never exposes or modifies another user's records", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const category = await seedCategory(alice.client);
    const expense = (await alice.client.post('/api/expenses', { category_id: category._id, amount: 10, expense_date: today() })).body;
    const monthly = (
      await alice.client.post('/api/monthly-budgets', { total_budget_amount: 10, start_date: today(), end_date: today() })
    ).body;
    const budget = (
      await alice.client.post('/api/budgets', { category_id: category._id, limit_amount: 10, month_year: currentMonth() })
    ).body;
    const [notification] = (await alice.client.get('/api/notifications')).body;

    expect((await bob.client.get('/api/monthly-budgets')).body).toEqual([]);
    expect((await bob.client.get('/api/categories')).body).toEqual([]);
    expect((await bob.client.get(`/api/budgets?monthYear=${currentMonth()}`)).body).toEqual([]);
    expect((await bob.client.get('/api/expenses')).body).toEqual([]);

    expect((await bob.client.put(`/api/expenses/${expense._id}`, { amount: 1 })).status).toBe(404);
    expect((await bob.client.delete(`/api/expenses/${expense._id}`)).status).toBe(404);
    expect((await bob.client.put(`/api/monthly-budgets/${monthly._id}`, { total_budget_amount: 1 })).status).toBe(404);
    expect((await bob.client.delete(`/api/monthly-budgets/${monthly._id}`)).status).toBe(404);
    expect((await bob.client.put(`/api/budgets/${budget._id}`, { limit_amount: 1 })).status).toBe(404);
    expect((await bob.client.delete(`/api/budgets/${budget._id}`)).status).toBe(404);
    expect((await bob.client.put(`/api/categories/${category._id}`, { name: 'Hacked' })).status).toBe(404);
    expect((await bob.client.put(`/api/notifications/${notification._id}/read`)).status).toBe(404);
    expect((await bob.client.delete(`/api/notifications/${notification._id}`)).status).toBe(404);

    // Alice's data is untouched.
    expect((await alice.client.get('/api/expenses')).body[0].amount).toBe(10);
  });
});
