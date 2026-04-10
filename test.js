document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('transaction-form');
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expensesEl = document.getElementById('expenses');
  const savingsEl = document.getElementById('savings');
  const countEl = document.getElementById('count');
  const tableBody = document.querySelector('#transactions-table tbody');

  const goalForm = document.getElementById('goal-form');
  const goalsList = document.getElementById('goals-list');

  const budgetForm = document.getElementById('budget-form');
  const budgetsList = document.getElementById('budgets-list');

  // Chart.js setup
  const ctx = document.getElementById('categoryChart').getContext('2d');
  let categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        label: 'Expenses by Category',
        data: [],
        backgroundColor: ['#e57373','#64b5f6','#81c784','#fff176','#ba68c8','#ffb74d']
      }]
    }
  });

  // Refresh UI
  function updateUI() {
    // Main goal tracker (shows goal with highest % progress)
    const mainGoalDiv = document.getElementById('main-goal-tracker');
    const goals = BudgetTracker.getGoals();
    if (goals.length > 0) {
      let best = goals[0];
      let bestPct = best.target ? best.current / best.target : 0;
      goals.forEach(g => {
        const pct = g.target ? g.current / g.target : 0;
        if (pct > bestPct) {
          best = g;
          bestPct = pct;
        }
      });
      const percent = Math.floor(bestPct * 100);
      mainGoalDiv.style.display = '';
      mainGoalDiv.innerHTML = `
        <h2>Goal Progress</h2>
        <p><b>${best.name}</b>: R${best.current} / R${best.target} (${percent}%)</p>
        <div class="goal-progress"><div class="bar" style="width:${percent}%"></div></div>
        <p>${percent >= 100 ? '🎉 Goal reached!' : `You are ${percent}% towards your goal!`}</p>
      `;
    } else {
      mainGoalDiv.style.display = 'none';
    }
    balanceEl.textContent = BudgetTracker.getBalance();

    const summary = BudgetTracker.getSummary();
    incomeEl.textContent = summary.totalIncome;
    expensesEl.textContent = summary.totalExpenses;
    savingsEl.textContent = summary.totalSavings;
    countEl.textContent = summary.count;

    // Transactions table with delete icon
    tableBody.innerHTML = '';
    BudgetTracker.getTransactions().forEach((t, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${t.type}</td>
        <td>R${t.amount}</td>
        <td>${t.description}</td>
        <td>${t.category || '-'}</td>
        <td><button class="icon-btn" data-del-tx="${i}" title="Delete"><i class="fa fa-trash"></i></button></td>
      `;
      tableBody.appendChild(row);
    });

    // Goals list with delete icon
    goalsList.innerHTML = '';
    BudgetTracker.getGoals().forEach((g, i) => {
      const progress = Math.min((g.current / g.target) * 100, 100);
      const div = document.createElement('div');
      div.innerHTML = `
        <p>${g.name}: R${g.current} / R${g.target} <button class="icon-btn" data-del-goal="${i}" title="Delete"><i class="fa fa-trash"></i></button></p>
        <div class="goal-progress"><div class="bar" style="width:${progress}%"></div></div>
      `;
      goalsList.appendChild(div);
    });

    // Budgets list with delete icon
    budgetsList.innerHTML = '';
    const budgets = BudgetTracker.getBudgets();
    Object.keys(budgets).forEach(name => {
      const b = budgets[name];
      const progress = Math.min((b.spent / b.target) * 100, 100);
      const div = document.createElement('div');
      div.innerHTML = `
        <p>${name}: R${b.spent} / R${b.target} <button class="icon-btn" data-del-budget="${name}" title="Delete"><i class="fa fa-trash"></i></button></p>
        <div class="goal-progress"><div class="bar" style="width:${progress}%"></div></div>
      `;
      budgetsList.appendChild(div);
    });
  // Delete handlers for transactions, goals, budgets with confirmation
  document.addEventListener('click', function(e) {
    // Transaction delete
    if (e.target.closest('[data-del-tx]')) {
      const idx = e.target.closest('[data-del-tx]').getAttribute('data-del-tx');
      if (confirm('Are you sure you want to delete this transaction?')) {
        BudgetTracker.removeTransaction(Number(idx));
        updateUI();
      }
    }
    // Goal delete
    if (e.target.closest('[data-del-goal]')) {
      const idx = e.target.closest('[data-del-goal]').getAttribute('data-del-goal');
      if (confirm('Are you sure you want to delete this goal?')) {
        BudgetTracker.removeGoal(Number(idx));
        updateUI();
      }
    }
    // Budget delete
    if (e.target.closest('[data-del-budget]')) {
      const name = e.target.closest('[data-del-budget]').getAttribute('data-del-budget');
      if (confirm('Are you sure you want to delete this budget?')) {
        BudgetTracker.removeBudget(name);
        updateUI();
      }
    }
  });

    // Update category chart
    const report = BudgetTracker.getReportByCategory();
    categoryChart.data.labels = Object.keys(report);
    categoryChart.data.datasets[0].data = Object.values(report);
    categoryChart.update();
  }

  // Handle transaction form
  form.addEventListener('submit', e => {
    e.preventDefault();
    const amount = Number(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;

    let result;
    if (type === 'income') {
      result = BudgetTracker.addIncome(amount, description, category);
    } else if (type === 'expense') {
      result = BudgetTracker.addExpense(amount, description, category);
    } else if (type === 'savings') {
      result = BudgetTracker.addSavings(amount, description, category);
    }

    console.log(result);
    updateUI();
    form.reset();
  });

  // Handle goal form
  goalForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('goal-name').value;
    const target = Number(document.getElementById('goal-amount').value);
    BudgetTracker.addGoal(name, target);
    updateUI();
    goalForm.reset();
  });

  // Handle budget form
  budgetForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('budget-name').value;
    const target = Number(document.getElementById('budget-target').value);
    BudgetTracker.addBudget(name, target);
    updateUI();
    budgetForm.reset();
  });


  // Navigation toggle (fix: show/hide sections properly)
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      // Hide all sections
      document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
      });
      // Remove active class from all buttons
      document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
      // Show target section
      document.getElementById(target).style.display = '';
      btn.classList.add('active');
    });
  });

  // On load, show dashboard only
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById('dashboard').style.display = '';

  // Initial UI update
  updateUI();
});


