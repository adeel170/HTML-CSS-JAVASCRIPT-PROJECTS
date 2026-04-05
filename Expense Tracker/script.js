let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let balance = document.querySelector(".balanceAmount");
let Income = document.querySelector(".income-bal");
let Expense = document.querySelector(".expenses-bal");
let expenseName = document.getElementById("des");
let expenseAmount = document.getElementById("amount");
let transactionSection = document.querySelector(".transactions");

let addTransactionButton = document.getElementById("add-t");
addTransactionButton.addEventListener("click", addTransaction);

function loadTransactions() {
  transactions.forEach((t) => {
    let CurrentBalance = Number(balance.textContent.slice(1));
    CurrentBalance += t.amount;
    balance.textContent = "$" + CurrentBalance;
    if (t.amount > 0) {
      let currentIncomeBalance = Income.textContent.slice(1);
      currentIncomeBalance = Number(currentIncomeBalance);
      let newIncomeBalance = currentIncomeBalance + t.amount;
      Income.textContent = "$" + newIncomeBalance;
    } else {
      let currentExpenseBalance = Expense.textContent.slice(1);
      currentExpenseBalance = Number(currentExpenseBalance);
      let newExpenseBalance = currentExpenseBalance + t.amount;
      Expense.textContent = "$" + String(newExpenseBalance).slice(1);
    }

    let transactionCard = document.createElement("div");
    transactionCard.classList.add("transaction");
    let spanName = document.createElement("span");
    let spanAmount = document.createElement("span");
    spanAmount.textContent = "$" + t.amount;
    spanName.textContent = t.name;

    transactionCard.append(spanName);
    transactionCard.append(spanAmount);

    transactionSection.append(transactionCard);
  });
}

loadTransactions();
function addTransaction() {
  let TexpName = expenseName.value;
  let TexpAmount = expenseAmount.value;
  if (TexpName == "" || TexpAmount == "" || TexpAmount == 0) {
    alert("Invaid Data Entered");
    return;
  }

  if (TexpAmount > 0) {
    currentBalance = balance.textContent.slice(1);
    currentBalance = Number(currentBalance);
    TexpAmount = Number(TexpAmount);
    let newBalance = currentBalance + TexpAmount;
    balance.textContent = "$" + newBalance;
    let currentIncomeBalance = Income.textContent.slice(1);
    currentIncomeBalance = Number(currentIncomeBalance);
    let newIncomeBalance = currentIncomeBalance + TexpAmount;
    Income.textContent = "$" + newIncomeBalance;
  }

  if (TexpAmount < 0) {
    CT = Number(TexpAmount);
    CT = Math.abs(CT);
    currentBalance = balance.textContent.slice(1);
    currentBalance = Number(currentBalance);
    if (currentBalance < CT) {
      alert("Insufficient Balance");
      return;
    }

    TexpAmount = Number(TexpAmount);

    let newBalance = currentBalance + TexpAmount;

    balance.textContent = "$" + newBalance;
    let currentExpenseBalance = Expense.textContent.slice(1);
    currentExpenseBalance = Number(currentExpenseBalance);
    let newExpenseBalance = currentExpenseBalance + TexpAmount;
    Expense.textContent = "$" + String(newExpenseBalance).slice(1);
  }

  let transactionCard = document.createElement("div");
  transactionCard.classList.add("transaction");
  let spanName = document.createElement("span");
  let spanAmount = document.createElement("span");
  spanAmount.textContent = "$" + TexpAmount;
  spanName.textContent = TexpName;

  transactionCard.append(spanName);
  transactionCard.append(spanAmount);

  transactionSection.append(transactionCard);

  transactions.push({
    name: TexpName,
    amount: TexpAmount,
  });
  localStorage.setItem("transactions", JSON.stringify(transactions));
  expenseName.value = "";
  expenseAmount.value = "";
}
