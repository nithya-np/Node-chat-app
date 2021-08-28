const socket=io()

// Elements
const $messageForm =document.querySelector("#message-form")
const $messageFormInput=$messageForm.querySelector("input")
const $messageFormButton=$messageForm.querySelector("button")
const $sendLocationButton=document.querySelector("#send-location")
const $messages=document.querySelector("#messages")

// Templates
const messageTemplate=document.querySelector("#message-template").innerHTML
const locationTemplate=document.querySelector("#location-message-template").innerHTML
const sidebarTemplate=document.querySelector("#sidebar-template").innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll=()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    // Visible height
    const visibleHeight = $messages.offsetHeight
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight
    
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (msg)=>{
    console.log(msg)
    const html=Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("hh:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
})



socket.on("locationMessage", (msg)=>{
    console.log(msg)
    const html=Mustache.render(locationTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format("hh:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html)
})



socket.on("roomData",({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML=html
})


$messageForm.addEventListener("submit", (e)=>{
    e.preventDefault()

    // disable
    $messageFormButton.setAttribute("disabled","disabled")

    // const message=document.querySelector("input").value
    const message=e.target.elements.info.value
    socket.emit("sendMessage", message, (error)=>{
        // enable
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value=""
        $messageFormInput.focus()

        if(error)
        {
            return console.log(error)
        }
        console.log("The message was delivered!")
    })
})



$sendLocationButton.addEventListener("click", ()=>{
    // disable
    $sendLocationButton.setAttribute("disabled","disabled")

    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser!")
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendLocation", {
            latitude:  position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            // enable
            $sendLocationButton.removeAttribute("disabled")
            console.log("Location shared!")
        })
    })
})



socket.emit("join", {
    username,
    room
},(error)=>{
    if(error){
        alert(error)
        location.href="/"
    }
})