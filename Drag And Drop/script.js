let cards=document.querySelectorAll(".card")
let lists=document.querySelectorAll(".list")

for(let card of cards){
    card.addEventListener("dragstart",dragstart)
    card.addEventListener("dragend",dragend)
}
for(let list of lists){
    list.addEventListener("dragover",dragover)
    list.addEventListener("dragenter",dragenter)
    list.addEventListener("dragleave",dragleave)
    list.addEventListener("drop",dragdrop)
}
function dragstart(event){
    event.dataTransfer.setData("text/plain",this.id)

}
function dragend(){
    console.log("drag Ended")
}
function dragover(event){
    event.preventDefault();
}
function dragenter(event){
    event.preventDefault();
    this.classList.add("over")
}
function dragleave(event){
    this.classList.remove("over")
}
function dragdrop(event){
    let id=event.dataTransfer.getData("text/plain")
    let card=document.getElementById(id)
    this.appendChild(card)
    this.classList.remove("over")
}
