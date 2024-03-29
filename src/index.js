const path=require("path")
const express=require("express")
const http=require("http")
const socketio=require("socket.io")
const Filter=require("bad-words")
const {generateMessage, generateLocationMessage}=require("./utils/messages.js")
const {addUser, removeUser, getUser, getUsersInRoom}=require("./utils/users.js")

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const port=process.env.PORT || 3000
const publicDirPath=path.join(__dirname,"../public")
app.use(express.static(publicDirPath))

// Execute once for each new connection, when connected
io.on("connection", (socket)=>{
    console.log("New WebSocket connection")

    socket.on("join", (options, callback)=>{
        const {error,user}=addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message", generateMessage("Admin","Welcome!"))
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin",`${user.username} has joined!`))
        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        // socket.emit, socket.broadcast.emit, io.emit
        // socket.broadcast.to.emit -- emit msg to everyone in the room expect that person
        // io.to.emit -- emit msg to everyone in the room
    })

    socket.on("sendMessage", (msg, callback)=>{
        const user=getUser(socket.id)

        const filter=new Filter()
        if(filter.isProfane(msg))
        {
            return callback("Profanity is not allowed!")
        }

        io.to(user.room).emit("message", generateMessage(user.username,msg))
        callback()
    })

    socket.on("sendLocation", (pos, callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${pos.latitude},${pos.longitude}`))
        callback()
    })

    socket.on("disconnect", ()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage("Admin",`${user.username} has left!`))
            io.to(user.room).emit("roomData",{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        } 
    })
})

server.listen(port,()=>{
    console.log("Runs on port ",port)
})