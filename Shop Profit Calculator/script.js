let profitScreenBtn=document.querySelector(".profit-screen")
let recordScreenBtn=document.querySelector(".record-screen")
let profitScreen=document.querySelector(".profit")
let recordScreen=document.querySelector(".record")
let DateCon=document.querySelector(".date")
let totalProfit=document.querySelector(".total-profit")
let todayProfit=document.querySelector(".today-profit")
let addProfit=document.getElementById("addP")
let addProfitBtn=document.querySelector(".add-profit")
let submitProfitBtn=document.querySelector(".submit-profit")
let cards=document.querySelector(".cards")
let CurrentDate=new Date()

let days=JSON.parse(localStorage.getItem("days"))||[]
let temp=JSON.parse(localStorage.getItem("temp"))||[]

window.addEventListener("DOMContentLoaded",()=>{
    console.log(temp)
    DateCon.textContent=CurrentDate.toDateString()
    days.forEach((e)=>{
        totalProfit.textContent=e.totalprofit
            let div=document.createElement("div")
    let spanDate=document.createElement("span")
    let spanAmount=document.createElement("span")
    spanDate.className="dateH"
    spanAmount.className="amount"
    div.className="card"
    spanDate.textContent=e.date
    spanAmount.textContent=e.profit
    div.append(spanDate)
    div.append(spanAmount)
    cards.append(div)
    })
    temp.forEach((e)=>{
        todayProfit.textContent=e.todayprofit
        totalProfit.textContent=e.totalprofit
    })

  
})

profitScreenBtn.addEventListener("click",()=>{
    profitScreen.classList.add("active")
    recordScreen.classList.remove("active")
})
recordScreenBtn.addEventListener("click",()=>{
    profitScreen.classList.remove("active")
    recordScreen.classList.add("active")
})

addProfitBtn.addEventListener("click",()=>{
   if(!addProfit.value || addProfit.value=="0"){
    alert("Please Enter Profit Amount")
    return
   }
    let profitValue=addProfit.value
    profitValue=Number(profitValue)
    let todaProfit=todayProfit.textContent
    todaProfit=Number(todaProfit)
    if(profitValue<0 && Math.abs(profitValue)>Number(todayProfit.textContent)){
         alert("Not allowed")
         return
    }
    todayProfit.textContent= profitValue+todaProfit
    let totProfit=totalProfit.textContent
    totProfit=Number(totProfit)
    totalProfit.textContent= totProfit+  profitValue
    temp.push({
        todayprofit:todayProfit.textContent,
        totalprofit:totalProfit.textContent
    })
    localStorage.setItem("temp",JSON.stringify(temp))


    addProfit.value=""

})



submitProfitBtn.addEventListener("click",(e)=>{
    if(!todayProfit.textContent){
        alert("Profit Amount is Null")
        return
    }
let result=confirm("Are you sure to submit data?")
if(!result){
    return
}

    let div=document.createElement("div")
    let spanDate=document.createElement("span")
    let spanAmount=document.createElement("span")
    spanDate.className="dateH"
    spanAmount.className="amount"
    div.className="card"
    spanDate.textContent=DateCon.textContent
    spanAmount.textContent=todayProfit.textContent
    div.append(spanDate)
    div.append(spanAmount)
    cards.append(div)

    days.push({
         date:DateCon.textContent,
        profit:todayProfit.textContent,
        totalprofit:totalProfit.textContent
    })
    localStorage.setItem("days",JSON.stringify(days))
    localStorage.removeItem("temp")

    todayProfit.textContent=0



})