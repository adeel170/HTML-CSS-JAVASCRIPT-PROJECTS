// selects element
let startscreen = document.getElementById("start-screen");
let quizscreen = document.getElementById("quiz-screen");
let resultscreen = document.getElementById("result-screen");
let questionstatement = document.querySelector(".question-statement");
let startbutton = document.querySelector(".start-quiz");
let currentquestion = document.getElementById("current-question");
let totalquestions = document.getElementById("total-questions");
let score = document.getElementById("score");
let option = document.querySelector(".ans");
let line = document.querySelector(".line");
let obtainedmarks = document.getElementById("os");
let totalmarks = document.getElementById("ts");
let message = document.querySelector(".msj");
let restartbutton = document.querySelector(".restart-btn");

let anscontainer = document.querySelector(".answers");

const quizQuestions = [
  {
    question: "What is the capital of France?",
    answers: [
      { text: "London", correct: false },
      { text: "Berlin", correct: false },
      { text: "Paris", correct: true },
      { text: "Madrid", correct: false },
    ],
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: [
      { text: "Venus", correct: false },
      { text: "Mars", correct: true },
      { text: "Jupiter", correct: false },
      { text: "Saturn", correct: false },
    ],
  },
  {
    question: "What is the largest ocean on Earth?",
    answers: [
      { text: "Atlantic Ocean", correct: false },
      { text: "Indian Ocean", correct: false },
      { text: "Arctic Ocean", correct: false },
      { text: "Pacific Ocean", correct: true },
    ],
  },
  {
    question: "Which of these is NOT a programming language?",
    answers: [
      { text: "Java", correct: false },
      { text: "Python", correct: false },
      { text: "Banana", correct: true },
      { text: "JavaScript", correct: false },
    ],
  },
  {
    question: "What is the chemical symbol for gold?",
    answers: [
      { text: "Go", correct: false },
      { text: "Gd", correct: false },
      { text: "Au", correct: true },
      { text: "Ag", correct: false },
    ],
  },
];

let cq = 0;
let s = 0;
// main functions
startbutton.addEventListener("click", showQuestion);
let ansdisabled = false;
function showQuestion() {
  ansdisabled = false;
  startscreen.classList.remove("active");
  quizscreen.classList.add("active");
let ques = quizQuestions[cq];
  cq += 1;
  if (cq > quizQuestions.length) {
    showResult();
    return;
  }
  currentquestion.innerText = cq;
  let percent = ((cq / quizQuestions.length) * 100 )-20;
  line.style.width = percent + "%";
  console.log(percent);
  anscontainer.innerHTML = "";
  questionstatement.innerText = ques.question;
  console.log(ques.question);
  ques.answers.forEach((answer, index) => {
    let option = document.createElement("button");
    option.innerText = answer.text;
    console.log(answer.text);
    option.dataset.correct = answer.correct;
    option.classList.add("ans");
    option.addEventListener("click", setAnswer);
    anscontainer.appendChild(option);
  });
}
function setAnswer(event) {
  if (ansdisabled) {
    return;
  }

  ansdisabled = true;
  if (event.target.dataset.correct === "true") {
    event.target.classList.add("correct");
    s += 1;
    score.innerText = s;
  } else {
    console.log(event.target.correct);
    event.target.classList.add("incorrect");
  }

  setTimeout(() => {
    if (cq <= quizQuestions.length) {
      showQuestion();
    }
  }, 1000);
}

function showResult() {
  quizscreen.classList.remove("active");
  resultscreen.classList.add("active");
  obtainedmarks.innerText = score.innerText;
  totalmarks.innerText = quizQuestions.length;
  let p = (s / quizQuestions.length) * 100;
  message.innerText = showMessage(p);
}
function showMessage(percentage) {
  if (percentage === 0) return "Better luck next time!";
  else if (percentage <= 20) return "Keep on trying!";
  else if (percentage <= 50) return "Room to improve!";
  else if (percentage <= 70) return "Good effort though!";
  else if (percentage <= 90) return "Almost there, nice!";
  else return "You nailed it!";
}

restartbutton.addEventListener("click", restartQuiz);
function restartQuiz() {
  cq = 0;
  s = 0;
  score.innerText=0
  resultscreen.classList.remove("active");
  startscreen.classList.add("active");
}
