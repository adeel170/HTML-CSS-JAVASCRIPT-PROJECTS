let passwordContainer=document.querySelector(".password-container")
let password=document.querySelector(".password")
let copyBtn=document.querySelector(".copy-btn")

let passwordRange=document.getElementById("password-length")

let rangeValue=document.querySelector(".range-value")
let upperCase=document.getElementById("uppercase")
let lowerCase=document.getElementById("lowercase")
let Numbers=document.getElementById("numbers")
let Symbols=document.getElementById("Symbols")
let genBtn=document.querySelector(".generate-btn")

let RemarksValue=document.querySelector(".value")
let Bar=document.querySelector(".strength-bar")

const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const numberCharacters = "0123456789";
const symbolCharacters = "!@#$%^&*()-_=+[]{}|;:,.<>?/";


passwordRange.addEventListener("input",()=>{
    rangeValue.innerText=passwordRange.value
})

rangeValue.innerText=passwordRange.value
genBtn.addEventListener("click",createPassword)

function createPassword(){
let length=rangeValue.innerText
let IncludeUppercase=upperCase.checked
let IncludeLowercase=lowerCase.checked
let IncludeNumbers=Numbers.checked
let IncludeSymbols=Symbols.checked
let newPassword=generatePassword(length,IncludeUppercase,IncludeLowercase,IncludeNumbers,IncludeSymbols)

password.value=newPassword
strengthCalculator(newPassword)

}

function generatePassword(length,IncludeUppercase,IncludeLowercase,IncludeNumbers,IncludeSymbols){
    if(!IncludeUppercase && !IncludeLowercase && !IncludeNumbers && !IncludeSymbols ){
        alert("Select At Least One Checkbox")
        return
    }
    let str=""
    if (IncludeUppercase){
        str+=uppercaseLetters
    }
        if (IncludeLowercase){
        str+=lowercaseLetters
    }
        if (IncludeNumbers){
        str+=numberCharacters
    }
        if (IncludeSymbols){
        str+=symbolCharacters
    }

    let finalPassword=""
    for(let i=0;i<length;i++){
        finalPassword+=str[Math.floor(Math.random() *str.length)]
    }
    return finalPassword
}

function strengthCalculator(fpassword){
    let hasUpperCase=/[A-Z]/.test(fpassword)
    let haslowerCase=/[a-z]/.test(fpassword)
    let hasNumbers=/[0-9]/.test(fpassword)
    let hasSymbols=/[!@#$%^&*()-_=+[\]{}|;:,.<>?]/.test(fpassword)
    let strengthScore=0
    strengthScore=Math.min(Number(fpassword.length)*2,40)

    if (hasUpperCase)  strengthScore+=15
    if (haslowerCase)  strengthScore+=15
    if (hasNumbers)  strengthScore+=15
    if (hasSymbols)  strengthScore+=15

if (fpassword.length<8){

     strengthScore=Math.min(strengthScore,40)
}
    Bar.style.width= strengthScore +"%"
    console.log(strengthScore)
    let rem=""

if(strengthScore<=40){
    RemarksValue.innerText="Weak"
    Bar.style.backgroundColor="#FF4D4D"
}
else if(strengthScore<70){
    RemarksValue.innerText="Medium"
    Bar.style.backgroundColor="#FFC107"
}
else if(strengthScore>=70){
    RemarksValue.innerText="Strong"
    Bar.style.backgroundColor="#4CAF50"
}

}

copyBtn.addEventListener("click",()=>{
    console.log(password.value)
    if(password.value=="") return

    navigator.clipboard.writeText(password.value).then(()=>{
        showSuccess()
    }).catch((error)=>{
        alert(error)
    })

})

function showSuccess(){
    copyBtn.className="fas fa-check copy-btn"

    setTimeout(()=>{
        copyBtn.className="far fa-copy copy-btn"
    },1500)

}

window.addEventListener("DOMContentLoaded",createPassword)