const express = require('express');
const upload = require('express-fileupload');
const PageRoutes = require('./routes/rout');
const PORT = 3000;

const app = express();

app.use(upload());
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(PageRoutes);

async function start() {
    try {
        app.listen(PORT, function(){
            console.log("Server has been started");
        });
    } catch (error) {
        console.log(error);
    }
};

start();