const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const port = 3000

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Creating a backend application that have authentication feature and have mongodb database');
})

const ADMIN = [];
const USER = [];


//Database add karna hoga..uske liye mongodb add karna hoga


//Admin
app.post('/admin/signup', (req, res) => {
    const {username, password} = req.body;

    if(!username || !password){
        res.status(403).json({message: "Username and password both required"});
    }
    const admin = ADMIN.find(a => a.username===username);
    if(admin){
        res.status(403).json({message: "Admin already exists"});
    }
    else{
        ADMIN.push({username, password});
        res.status(200).json({message: "Admin created successfully"});
    }
});

//Login
// app.post('/user/signup', async (req, res) => {
//     const {username, password} = req.body;
    
//     if(!username || !password){
//         res.status(403).json({message: "Username and password both required"});
//     }
//     const user = await USER.find(a => a.username===username);
//     if(user){
//         res.status(403).json({message: "User already exists"});
//     }
//     else{
//         const newUser = new USER({username, password});
//         USER.push({username, password});
//         res.status(200).json({message: "user created successfully"});
//     }
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})