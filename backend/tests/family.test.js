const { setupDatabase, createUser, today } = require('./helpers');

setupDatabase();

/** Creates a plan owned by a new user, with two of the owner's categories. */
async function setupPlan(planFields = {}) {
  const owner = await createUser({ name: 'Owner' });
  const groceries = (await owner.client.post('/api/categories', { name: 'Groceries' })).body;
  const utilities = (await owner.client.post('/api/categories', { name: 'Utilities' })).body;
  const plan = (
    await owner.client.post('/api/family-plans', { plan_name: 'Household', total_budget_amount: 1000, ...planFields })
  ).body;
  return { owner, plan, groceries, utilities };
}

/** Invites a new user with `role` and accepts the invitation. */
async function addMember(owner, plan, role, name = role) {
  const member = await createUser({ name });
  const invite = await owner.client.post(`/api/family-plans/${plan._id}/invites`, {
    invitee_email: member.user.email,
    role_assigned: role,
  });
  expect(invite.status).toBe(201);
  const [pending] = (await member.client.get('/api/invites/pending')).body;
  const accept = await member.client.post(`/api/invites/${pending._id}/accept`);
  expect(accept.status).toBe(200);
  return member;
}

const expenseBody = (category, amount = 100) => ({
  category_id: category._id,
  amount,
  description: 'Weekly shop',
  expense_date: today(),
});

describe('plans', () => {
  it('makes the creator the owner and an admin', async () => {
    const { owner, plan } = await setupPlan();
    expect(plan).toMatchObject({ plan_name: 'Household', userRole: 'admin', currency: 'USD' });
    expect(plan.owner._id).toBe(owner.user._id);

    const list = (await owner.client.get('/api/family-plans')).body;
    expect(list).toEqual([expect.objectContaining({ _id: plan._id, userRole: 'admin' })]);
  });

  it('hides plans from non-members', async () => {
    const { plan } = await setupPlan();
    const outsider = await createUser();
    expect((await outsider.client.get(`/api/family-plans/${plan._id}`)).status).toBe(404);
    expect((await outsider.client.get(`/api/family-plans/${plan._id}/expenses`)).status).toBe(404);
    expect((await outsider.client.post(`/api/family-plans/${plan._id}/expenses`, {})).status).toBe(404);
  });

  it("offers the owner's categories even before any limits are set", async () => {
    const { owner, plan } = await setupPlan();
    const categories = (await owner.client.get(`/api/family-plans/${plan._id}/categories`)).body;
    expect(categories.map((c) => [c.name, c.limitAmount])).toEqual([
      ['Groceries', 0],
      ['Utilities', 0],
    ]);
  });

  it('saves category limits and keeps them within the plan total', async () => {
    const { owner, plan, groceries, utilities } = await setupPlan();
    const url = `/api/family-plans/${plan._id}`;

    const tooMuch = await owner.client.put(url, {
      categoryBudgets: [
        { category_id: groceries._id, limit_amount: 800 },
        { category_id: utilities._id, limit_amount: 300 },
      ],
    });
    expect(tooMuch.status).toBe(400);

    const ok = await owner.client.put(url, {
      plan_name: 'Our Home',
      require_approval: true,
      categoryBudgets: [
        { category_id: groceries._id, limit_amount: 600 },
        { category_id: utilities._id, limit_amount: 300 },
      ],
    });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ plan_name: 'Our Home', require_approval: true });
    expect(ok.body.categoryBudgets.map((c) => c.limitAmount)).toEqual([600, 300]);

    const removed = await owner.client.put(url, { categoryBudgets: [{ category_id: utilities._id, limit_amount: 0 }] });
    expect(removed.body.categoryBudgets).toHaveLength(1);

    const stranger = await createUser();
    const foreignCategory = (await stranger.client.post('/api/categories', { name: 'Theirs' })).body;
    const foreign = await owner.client.put(url, { categoryBudgets: [{ category_id: foreignCategory._id, limit_amount: 5 }] });
    expect(foreign.status).toBe(400);
  });

  it('only lets the owner delete the plan, and removes everything with it', async () => {
    const { owner, plan, groceries } = await setupPlan();
    const admin = await addMember(owner, plan, 'admin');
    await owner.client.post(`/api/family-plans/${plan._id}/expenses`, expenseBody(groceries));

    expect((await admin.client.delete(`/api/family-plans/${plan._id}`)).status).toBe(403);
    expect((await owner.client.delete(`/api/family-plans/${plan._id}`)).status).toBe(200);
    expect((await admin.client.get('/api/family-plans')).body).toEqual([]);
    expect((await owner.client.get(`/api/family-plans/${plan._id}`)).status).toBe(404);
  });
});

describe('members and invitations', () => {
  it('lets admins invite, change roles and remove members', async () => {
    const { owner, plan } = await setupPlan();
    const member = await addMember(owner, plan, 'viewer', 'Sara');

    const members = (await owner.client.get(`/api/family-plans/${plan._id}/members`)).body;
    expect(members.map((m) => [m.user.name, m.role, m.isOwner])).toEqual([
      ['Owner', 'admin', true],
      ['Sara', 'viewer', false],
    ]);

    const promote = await owner.client.put(`/api/family-plans/${plan._id}/members/${member.user._id}`, { role: 'editor' });
    expect(promote.status).toBe(200);
    expect((await member.client.get(`/api/family-plans/${plan._id}`)).body.userRole).toBe('editor');

    const remove = await owner.client.delete(`/api/family-plans/${plan._id}/members/${member.user._id}`);
    expect(remove.status).toBe(200);
    expect((await member.client.get(`/api/family-plans/${plan._id}`)).status).toBe(404);
  });

  it("protects the owner and doesn't let non-admins manage members", async () => {
    const { owner, plan } = await setupPlan();
    const editor = await addMember(owner, plan, 'editor');
    const admin = await addMember(owner, plan, 'admin');

    expect((await admin.client.put(`/api/family-plans/${plan._id}/members/${owner.user._id}`, { role: 'viewer' })).status).toBe(403);
    expect((await admin.client.delete(`/api/family-plans/${plan._id}/members/${owner.user._id}`)).status).toBe(403);
    expect((await editor.client.post(`/api/family-plans/${plan._id}/invites`, { invitee_email: 'x@example.com', role_assigned: 'viewer' })).status).toBe(403);
    expect((await editor.client.delete(`/api/family-plans/${plan._id}/members/${admin.user._id}`)).status).toBe(403);
    expect((await owner.client.delete(`/api/family-plans/${plan._id}/members/${owner.user._id}`)).status).toBe(400);

    // Upper-case ids resolve to the same user and must not bypass the owner checks.
    const ownerIdUpper = owner.user._id.toUpperCase();
    expect((await admin.client.put(`/api/family-plans/${plan._id}/members/${ownerIdUpper}`, { role: 'viewer' })).status).toBe(403);
    expect((await admin.client.delete(`/api/family-plans/${plan._id}/members/${ownerIdUpper}`)).status).toBe(403);
    expect((await owner.client.get(`/api/family-plans/${plan._id}`)).body.userRole).toBe('admin');
  });

  it('lets an edited rejected expense be resubmitted', async () => {
    const { owner, plan, groceries } = await setupPlan({ require_approval: true });
    const editor = await addMember(owner, plan, 'editor');
    const url = `/api/family-plans/${plan._id}/expenses`;

    const expense = (await editor.client.post(url, expenseBody(groceries))).body;
    await owner.client.post(`${url}/${expense._id}/reject`);
    const resubmitted = await editor.client.put(`${url}/${expense._id}`, { amount: 90 });
    expect(resubmitted.body.status).toBe('pending');
  });

  it('lets members leave a plan', async () => {
    const { owner, plan } = await setupPlan();
    const viewer = await addMember(owner, plan, 'viewer');
    expect((await viewer.client.delete(`/api/family-plans/${plan._id}/members/${viewer.user._id}`)).status).toBe(200);
    expect((await viewer.client.get('/api/family-plans')).body).toEqual([]);
  });

  it('rejects duplicate invitations and unknown emails', async () => {
    const { owner, plan } = await setupPlan();
    const invitee = await createUser();
    const url = `/api/family-plans/${plan._id}/invites`;
    expect((await owner.client.post(url, { invitee_email: invitee.user.email, role_assigned: 'viewer' })).status).toBe(201);
    expect((await owner.client.post(url, { invitee_email: invitee.user.email, role_assigned: 'viewer' })).status).toBe(409);
    expect((await owner.client.post(url, { invitee_email: 'nobody@example.com', role_assigned: 'viewer' })).status).toBe(404);
  });

  it('only lets the invitee respond to an invitation', async () => {
    const { owner, plan } = await setupPlan();
    const invitee = await createUser();
    const outsider = await createUser();
    await owner.client.post(`/api/family-plans/${plan._id}/invites`, { invitee_email: invitee.user.email, role_assigned: 'editor' });
    const [invite] = (await invitee.client.get('/api/invites/pending')).body;

    expect((await outsider.client.post(`/api/invites/${invite._id}/accept`)).status).toBe(404);
    expect((await invitee.client.post(`/api/invites/${invite._id}/reject`)).status).toBe(200);
    expect((await invitee.client.post(`/api/invites/${invite._id}/accept`)).status).toBe(400);
  });
});

describe('expenses and approvals', () => {
  it("enforces roles: viewers read, editors manage their own, admins manage all", async () => {
    const { owner, plan, groceries } = await setupPlan();
    const viewer = await addMember(owner, plan, 'viewer');
    const editor = await addMember(owner, plan, 'editor');
    const url = `/api/family-plans/${plan._id}/expenses`;

    expect((await viewer.client.post(url, expenseBody(groceries))).status).toBe(403);
    const adminExpense = (await owner.client.post(url, expenseBody(groceries))).body;
    const editorExpense = (await editor.client.post(url, expenseBody(groceries, 40))).body;

    expect((await viewer.client.get(url)).body).toHaveLength(2);
    expect((await editor.client.get(`${url}?mine=true`)).body).toHaveLength(1);

    expect((await editor.client.put(`${url}/${adminExpense._id}`, { amount: 1 })).status).toBe(403);
    expect((await editor.client.delete(`${url}/${adminExpense._id}`)).status).toBe(403);
    expect((await editor.client.put(`${url}/${editorExpense._id}`, { amount: 45 })).status).toBe(200);
    expect((await owner.client.delete(`${url}/${editorExpense._id}`)).status).toBe(200);
  });

  it('requires approval for non-admin expenses when the plan asks for it', async () => {
    const { owner, plan, groceries } = await setupPlan({ require_approval: true });
    const editor = await addMember(owner, plan, 'editor', 'Sara');
    const url = `/api/family-plans/${plan._id}/expenses`;

    const pending = (await editor.client.post(url, expenseBody(groceries, 75))).body;
    expect(pending.status).toBe('pending');
    expect(pending.added_by.name).toBe('Sara');
    expect((await owner.client.post(url, expenseBody(groceries))).body.status).toBe('approved');

    const ownerInbox = (await owner.client.get('/api/notifications')).body.map((n) => n.type);
    expect(ownerInbox).toContain('expense_needs_approval');

    expect((await editor.client.post(`${url}/${pending._id}/approve`)).status).toBe(403);
    const approved = await owner.client.post(`${url}/${pending._id}/approve`);
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('approved');
    expect(approved.body.approved_by.name).toBe('Owner');
    expect((await owner.client.post(`${url}/${pending._id}/reject`)).status).toBe(400);

    const editorInbox = (await editor.client.get('/api/notifications')).body.map((n) => n.type);
    expect(editorInbox).toContain('expense_approved');

    // Editing an approved expense sends it back for approval.
    const edited = await editor.client.put(`${url}/${pending._id}`, { amount: 80 });
    expect(edited.body.status).toBe('pending');
    expect(edited.body.approved_by).toBeNull();
  });

  it("only accepts the plan owner's categories", async () => {
    const { owner, plan } = await setupPlan();
    const other = await createUser();
    const foreign = (await other.client.post('/api/categories', { name: 'Elsewhere' })).body;
    const res = await owner.client.post(`/api/family-plans/${plan._id}/expenses`, expenseBody(foreign));
    expect(res.status).toBe(400);
  });
});
