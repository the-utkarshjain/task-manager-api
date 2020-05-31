const express = require('express')
const User = require('../models/user.js')
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendGoodbyeEmail} = require('../emails/account.js')
const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        await sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    }catch(e){
        res.status(500).send(e)
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedOperation = ['name','email','password','age']

    const isValidOperation = updates.every((update) => allowedOperation.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid update!'})
    }

    try{
        const user = req.user
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await sendGoodbyeEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.send(req.user)
    }catch(e){
        res.status(500).send(e)
    }
})

const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(new Error("Please upload a jpg or jpeg or png file"))
        }
        cb(undefined, true)
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send("hi")
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'),async (req, res) => {
    req.user.avatar = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

module.exports = router