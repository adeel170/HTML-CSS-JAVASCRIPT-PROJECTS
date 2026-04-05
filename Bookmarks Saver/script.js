
let bookMarks=JSON.parse(localStorage.getItem("bookmarks"))|| []

document.addEventListener("DOMContentLoaded",loadBookmarks)
function loadBookmarks()
{
if(bookMarks.length==0){
    return
}
bookMarks.forEach((bm)=>{
    console.log(bm)
        let anchor=document.createElement("a")
    anchor.href=bm.url
    anchor.target="_blank"
    anchor.textContent=bm.name
    let removeButton=document.createElement("button")
    removeButton.textContent="remove"

    removeButton.setAttribute("id","remove")
    let bookmarkItem=document.createElement("div")
    bookmarkItem.classList.add("li")
    bookmarkItem.append(anchor)
    bookmarkItem.append(removeButton)
 
    bookmarkList.append(bookmarkItem)
        removeButton.addEventListener("click",function(){
        bookmarkList.removeChild(bookmarkItem)

        bookMarks=bookMarks.filter(n=>n.name!==bm.name)
        localStorage.setItem("bookmarks",JSON.stringify(bookMarks))

    })

})

}

let bookmarkName=document.getElementById("name")
let bookmarkURL=document.getElementById("url")
let addBookmarkButton=document.querySelector(".add-bkmrk")
let bookmarkList=document.querySelector(".bookmarks-list")

addBookmarkButton.addEventListener("click",function (){
    if(!bookmarkName.value || !bookmarkURL.value){
        alert("Please Fill Both Fields")
        return
    }
    if(!bookmarkURL.value.startsWith("http://") && !bookmarkURL.value.startsWith("https://")){
        alert("Please Enter valid url address")
        return
    }
    let anchor=document.createElement("a")
    anchor.href=bookmarkURL.value
    anchor.target="_blank"
    

    anchor.textContent=bookmarkName.value
    let removeButton=document.createElement("button")
    removeButton.textContent="remove"

    removeButton.setAttribute("id","remove")
    let bookmarkItem=document.createElement("div")
    bookmarkItem.classList.add("li")
    bookmarkItem.append(anchor)
    bookmarkItem.append(removeButton)
 
    bookmarkList.append(bookmarkItem)
    bookMarks.push({
        name:bookmarkName.value,
        url:bookmarkURL.value
    })
    localStorage.setItem("bookmarks",JSON.stringify(bookMarks))
    removeButton.addEventListener("click",function(){
        bookmarkList.removeChild(bookmarkItem)

    })
    bookmarkName.value=""
    bookmarkURL.value=""



})