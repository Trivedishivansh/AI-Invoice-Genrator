import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import { connect } from 'mongoose'
import { connectDB } from './config/db.js'
import path from 'path'
import invoiceRouter from './routes/invoiceRouter.js'
import businessProfileRouter from './routes/businessProfileRouter.js'
import aiInvoiceRouter from './routes/aiinvoiceRouter.js'

const app = express()
const port = 4000

app.use(
  cors({
    origin: "https://ai-invoice-genrator-4xt5.vercel.app/", // ✅ Vite frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


app.use(clerkMiddleware())
app.use(express.json({limit:'20mb'}))
app.use(express.urlencoded({limit:'20mb',extended:true}))


connectDB()

app.use('/uploads',express.static(path.join(process.cwd(),"uploads")))

app.use('/api/invoice',invoiceRouter)
app.use('/api/businessProfile',businessProfileRouter)
app.use('/api/ai',aiInvoiceRouter)

app.get('/',(req,res)=>{
  res.send("Api working")
})

app.listen(port,()=>{
  console.log(`server start on http://localhost:${port}`)
})
