const express =  require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname + '/public'));
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));
app.use('/resources/', express.static(path.join(__dirname, 'resources')));
//app.use('/node_modules/', express.static(path.join(__dirname, 'node_modules')));
app.use('/', express.static(path.join(__dirname, '')));
app.listen(3000, ()=>{
    console.log('visit http://localhost:3000/');
});