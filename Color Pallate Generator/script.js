let generateButton=document.querySelector(".generate-btn")
let container=document.querySelector(".boxes")


let copyBtn=document.querySelector(".copy-btn")


generateButton.addEventListener("click",getPallete)

function copyClicked(event){
    if(event.target.classList.contains("copy-btn")){
    let hexVal=event.target.previousElementSibling.textContent
    navigator.clipboard.writeText(hexVal).then(()=>{
        showCopySuccess(event.target)
    }).catch((err)=>{
        console.log(err)
    })
}
else if(event.target.classList.contains("color")){
    let hexVal=event.target.nextElementSibling.querySelector(".hex-code").textContent
     navigator.clipboard.writeText(hexVal).then(()=>{
        showCopySuccess(event.target.nextElementSibling.querySelector(".hex-code").nextElementSibling)
    }).catch((err)=>{
        console.log(err)
    })
}
}
function showCopySuccess(clas){
    clas.classList.remove("far", "fa-copy")
    clas.classList.add("fas", "fa-check")
    setTimeout(()=>{
        clas.classList.remove("fas", "fa-check")
    clas.classList.add("far", "fa-copy")
    },1500)
}

container.addEventListener("click",copyClicked)
function getPallete(){
    let colors=[]
    for(let i=0;i<5;i++){
        colors.push(getRandomColor())
    }
    let boxes=document.querySelectorAll(".color-box")
    boxes.forEach((box,index)=>{
        box.querySelector(".color").style.backgroundColor=colors[index]
        box.querySelector(".hex-code").textContent=colors[index]

    })
}
function getRandomColor(){
    let latters="0123456789ABCDEF"
    color="#"
    for(let i=0;i<6;i++){
        color+=latters[Math.floor(Math.random()*16)]
    }
    return color
}
// 

getPallete()