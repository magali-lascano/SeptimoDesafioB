import express from 'express'
import mongoose from 'mongoose'
import handlebars from 'express-handlebars'
import {Server} from "socket.io"
import cookieParser from 'cookie-parser'
import session from 'express-session'
import FileStore from 'session-file-store'
import MongoStore from 'connect-mongo'
import passport from 'passport'

import { __dirname} from './utils.js';
import viewRouter from "./routes/view.routes.js";
import productsRouter from './routes/products.routes.js';
import cartsRouter from './routes/cart.routes.js';
import loginRouter from './routes/login.routes.js';
import cookieRouter from './routes/cookies.routes.js';
import usersRouter from './routes/users.routes.js';
import sessionsRouter from './routes/sessions.routes.js';
import ProductManager from "./dao/controllers/product.controller.mdb.js";
import MessagesManager from "./dao/controllers/message.controller.mdb.js";
import UserMongo from './dao/controllers/user.controller.mdb.js';
import "./dao/dbconf.js";

const app = express();
const PORT = 5000


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

// const fileStorage = FileStore(session)
// app.use(session({ store: MongoStore.create({ mongoUrl: MONGOOSE_URL, mongoOptions: {}, ttl: 60, clearInterval: 5000 }), // MONGODB secret: 'secretKeyAbc123', resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

app.engine('handlebars', handlebars.engine())
app.set('views', `${__dirname}/views`)
app.set('view engine', 'handlebars')

// handlebars
app.engine('handlebars', handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

app.use('/', viewRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/carts', cartsRouter)
app.use('/api/cookies', cookieRouter)
app.use('/api/login', loginRouter)
app.use('/api/sessions', sessionsRouter)

// socket server
const pmanagersocket = new ProductManager();
const messagesManager = new MessagesManager();
const userMongo = new UserMongo (); 
const httpServer = app.listen(PORT,() => {console.log("Listening on PORT: 5000");});
const socketServer = new Server(httpServer);
socketServer.on("Coneccion", (socket) => {
    console.log(`Cliente connectado: ${socket.id}`);
    socket.on(`Desconectar`, () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
    socket.on("newproduct", (newProduct) => {
        console.log(`Producto agregado: ${newProduct}`);
        ProductManager.addProduct({...newProduct });
    });
    socket.on("deleteProduct", (productId) => {
        console.log(`Producto borrado ${productId}`);
        ProductManager.deleteProductById(productId);
    });
    socket.on("message", async (info) => {
        console.log(info)
        await messagesManager.createMessage(info);
        socketServer.emit("chat", await messagesManager.getMessages());
    });
});