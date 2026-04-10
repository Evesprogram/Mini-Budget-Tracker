// budgetTracker.js — Complete Budget Tracker with Goals + Budgets

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const BudgetTracker = (() => {

  // Persistent state
  const load = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch { return fallback; }
  };
  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  let transactions = load('transactions', []);
  let goals = load('goals', []);
  let budgets = load('budgets', {});

  // Validation helper
  const validate = (amount, description) => {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }
    if (!description || description.trim() === '') {
      throw new ValidationError('Description cannot be empty');
    }
  };

  return {
    // Income
    addIncome(amount, description, category) {
      try {
        validate(amount, description);
        transactions.push({ type: 'income', amount, description, category });
        save('transactions', transactions);
        return `Income added: R${amount} (${description})`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    // Expense
    addExpense(amount, description, category) {
      try {
        validate(amount, description);
        transactions.push({ type: 'expense', amount, description, category });
        if (budgets[category]) {
          budgets[category].spent += amount;
          save('budgets', budgets);
        }
        save('transactions', transactions);
        return `Expense added: R${amount} (${description})`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    // Savings (new type)
    addSavings(amount, description, category) {
      try {
        validate(amount, description);
        transactions.push({ type: 'savings', amount, description, category });
        // Savings also contribute to a goal if category matches
        const goal = goals.find(g => g.name.toLowerCase() === category?.toLowerCase());
        if (goal) {
          goal.current += amount;
          save('goals', goals);
        }
        save('transactions', transactions);
        return `Savings added: R${amount} (${description})`;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },

    // Balance
    getBalance() {
      return transactions.reduce((total, t) => {
        if (t.type === 'income') return total + t.amount;
        if (t.type === 'expense') return total - t.amount;
        return total; // savings don’t affect spendable balance
      }, 0);
    },

    // Summary
    getSummary() {
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSavings = transactions
        .filter(t => t.type === 'savings')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        totalSavings,
        balance: this.getBalance(),
        count: transactions.length
      };
    },

    // Transactions
    getTransactions() {
      return [...transactions];
    },

    // Report by Category
    getReportByCategory() {
      return transactions.reduce((report, t) => {
        if (!t.category) return report;
        report[t.category] = (report[t.category] || 0) + t.amount;
        return report;
      }, {});
    },

    // Goals
    addGoal(name, target) {
      goals.push({ name, target, current: 0 });
      save('goals', goals);
    },

    getGoals() {
      return [...goals];
    },

    // Budgets
    addBudget(name, target) {
      budgets[name] = { target, spent: 0 };
      save('budgets', budgets);
    },

    getBudgets() {
      return { ...budgets };
    },

    // Remove transaction
    removeTransaction(index) {
      transactions.splice(index, 1);
      save('transactions', transactions);
    },

    // Remove goal
    removeGoal(index) {
      goals.splice(index, 1);
      save('goals', goals);
    },

    // Remove budget
    removeBudget(name) {
      delete budgets[name];
      save('budgets', budgets);
    }
  };
})();
