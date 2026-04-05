let dateSpan = document.querySelector(".date");
let taskNameInput = document.querySelector(".input");
let addtaskBtn = document.querySelector(".input-btn");
let allTasks = document.getElementById("all");
let activeTasks = document.getElementById("Active");
let CompTasks = document.getElementById("Completed");
let empCon = document.querySelector(".empty-con");

let itemsCon = document.querySelector(".items-container");
let itemsLeft = document.querySelector(".itemsLeft");
let clearItemBtn = document.querySelector(".clr");
let boxBtn = document.querySelector(".cbBox");

let allTasksArray = [];
let activeTask = [];
let compTask = [];
currentFilter = "all";

window.addEventListener("DOMContentLoaded", () => {
  checkEmp(allTasksArray);
});

CompTasks.addEventListener("click", () => {
  compTask = allTasksArray.filter((e) => e.completed);
  checkEmp(compTask);
  renderCompTasks();
});
activeTasks.addEventListener("click", () => {
  activeTask = allTasksArray.filter((e) => !e.completed);
  checkEmp(activeTask);
  renderActiveTasks();
});
allTasks.addEventListener("click", () => {
  checkEmp(allTasksArray);
  renderScreen();
});

function renderActiveTasks() {
  itemsCon.innerHTML = "";
  activeTask.forEach((e) => {
    let li = document.createElement("li");
    let div = document.createElement("div");
    let checkbox = document.createElement("input");
    let span = document.createElement("span");
    let button = document.createElement("button");
    let i = document.createElement("i");
    i.className = "fas fa-times";
    li.className = "item";
    div.className = "ld";
    checkbox.type = "checkbox";
    checkbox.checked = e.completed;
    checkbox.addEventListener("change", () => {
      toggleTodo(e.id);
    });

    button.className = "removeItembtn";
    button.append(i);
    button.addEventListener("click", () => {
      deleteTask(e.id);
    });
    span.textContent = e.text;

    div.append(checkbox);
    div.append(span);
    li.append(div);
    li.append(button);
    itemsCon.append(li);
  });
}

function renderCompTasks() {
  itemsCon.innerHTML = "";
  compTask.forEach((e) => {
    let li = document.createElement("li");
    let div = document.createElement("div");
    let checkbox = document.createElement("input");
    let span = document.createElement("span");
    let button = document.createElement("button");
    let i = document.createElement("i");
    i.className = "fas fa-times";
    li.className = "item";
    div.className = "ld";
    checkbox.type = "checkbox";
    checkbox.checked = e.completed;
    checkbox.addEventListener("change", () => {
      toggleTodo(e.id);
    });

    button.className = "removeItembtn";
    button.append(i);
    button.addEventListener("click", () => {
      deleteTask(e.id);
    });
    span.textContent = e.text;

    div.append(checkbox);
    div.append(span);
    li.append(div);
    li.append(button);
    itemsCon.append(li);
  });
}

function checkEmp(array) {
  console.log(array.length);
  if (array.length == 0) {
    empCon.className = "items-container active";
    itemsCon.className = "items-container hidden";
  } else {
    empCon.className = "items-container hidden";
    itemsCon.className = "items-container active";
  }
}

addtaskBtn.addEventListener("click", () => {
  taskName = taskNameInput.value;
  if (!taskName || taskName.length > 22) {
    alert(
      "Task name cannot be empty or task name length cannot be greater than 22 characters",
    );
    taskNameInput.value = "";
    return;
  }

  let todo = {
    id: Date.now(),
    text: taskNameInput.value,
    completed: false,
  };

  allTasksArray.push(todo);
  // localStorage.setItem("allTasksArray",JSON.stringify(todo))
  updateItemsCount();
  checkEmp(allTasksArray);
  renderScreen();
  taskNameInput.value = "";
});


taskNameInput.addEventListener("keydown", (e) => {
  if(e.key=="Enter"){

 
  taskName = taskNameInput.value;
  if (!taskName || taskName.length > 22) {
    alert(
      "Task name cannot be empty or task name length cannot be greater than 22 characters",
    );
    taskNameInput.value = "";
    return;
  }

  let todo = {
    id: Date.now(),
    text: taskNameInput.value,
    completed: false,
  };

  allTasksArray.push(todo);
  // localStorage.setItem("allTasksArray",JSON.stringify(todo))
  updateItemsCount();
  checkEmp(allTasksArray);
  renderScreen();
  taskNameInput.value = "";
   }
});

function updateItemsCount() {
  let temp = allTasksArray.filter((e) => !e.completed);

  itemsLeft.textContent = `${temp?.length} item${
    temp?.length !== 1 ? "s" : ""
  } left`;
}

function renderScreen() {
  itemsCon.innerHTML = "";
  allTasksArray.forEach((e) => {
    let li = document.createElement("li");
    let div = document.createElement("div");
    let checkbox = document.createElement("input");
    let span = document.createElement("span");
    let button = document.createElement("button");
    let i = document.createElement("i");
    i.className = "fas fa-times";
    li.className = "item";
    div.className = "ld";
    checkbox.type = "checkbox";
    checkbox.checked = e.completed;
    checkbox.addEventListener("change", () => {
      toggleTodo(e.id);
    });

    button.className = "removeItembtn";
    button.append(i);
    button.addEventListener("click", () => {
      deleteTask(e.id);
    });
    span.textContent = e.text;

    div.append(checkbox);
    div.append(span);
    li.append(div);
    li.append(button);
    itemsCon.append(li);
  });
}

function deleteTask(id) {
  allTasksArray = allTasksArray.filter((e) => e.id != id);
  renderScreen();
  checkEmp(allTasksArray);
  updateItemsCount();
}
function toggleTodo(s) {
  allTasksArray = allTasksArray.map((todoo) => {
    if (todoo.id == s) {
      return { ...todoo, completed: !todoo.completed };
    }
    return todoo;
  });
  console.log(allTasksArray);
  updateItemsCount();
}

clearItemBtn.addEventListener("click", () => {
  allTasksArray = allTasksArray.filter((e) => !e.completed);
  renderScreen();
  checkEmp(allTasksArray);
  updateItemsCount();
});
