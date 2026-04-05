let form=document.querySelector(".form-container")
let username=document.getElementById("username")
let email=document.getElementById("email")
let password=document.getElementById("password")
let confirmPassword=document.getElementById("confirm-password")

form.addEventListener("submit",function (e){
    e.preventDefault()
    let isRequiredvalid=checkRequired([username,email,password,confirmPassword])
    if(isRequiredvalid){
        let isUsernameValid=checkUsername(username)
        let isEmailValid=checkEmail(email)
        let isPasswordValid=checkPassword(password)
        let isConfirmPasswordValid=checkConfirmPassword(password,confirmPassword)
        let isallValid=isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid
        if(isallValid){
            alert("Registration Success")
            let formGroup=document.querySelectorAll(".form-group")
            formGroup.forEach((e)=>{
                e.className="form-group"
            })
            form.reset()
        }
        else{
            form.reset()
        }
    }
    else{
        form.reset()
    }

})
function checkUsername(input){
    if(input.value.trim().length<3){
        showError(input,`${FormatInputField(input)} must contain at least 3 characters`)
        return false;
    }
    else if(input.value.trim().length>=15){
        showError(input,`${FormatInputField(input)} must be less than 15 characters`)
        return false;
    }
    return true

}
function checkEmail(input){
const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if(regex.test(input.value)){
    return true
}
else{
    showError(input,`${FormatInputField(input)} is not valid`)
    return false
}

}


function checkPassword(input){
        if(input.value.trim().length<4){
        showError(input,`${FormatInputField(input)} must contain at least 4 characters`)
        return false;
    }
    else if(input.value.trim().length>=8){
        showError(input,`${FormatInputField(input)} must be less than 8 characters`)
        return false;
    }
    return true
}

function checkConfirmPassword(input1,input2){
    if(input1.value==input2.value){
        return true
    }
    else{
        showError(input2,`${FormatInputField(input2)} does not match with password`) 
        return false
    }
}

function checkRequired(array){
    let isValid=true
    array.forEach((input)=>{
        if(input.value.trim()==""){
            showError(input,`${FormatInputField(input)} is required`)
            isValid=false
        }

    })
    return isValid
}

function FormatInputField(name){

    return name.id.charAt(0).toUpperCase()+name.id.slice(1)
}
function showError(input,message){
let formP=input.parentElement
formP.className="form-group error"
let small=formP.querySelector("small")
small.innerText=message
}
